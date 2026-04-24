#include <token.hpp>

// ── create ─────────────────────────────────────────────────────────────────
ACTION token::create(name issuer, asset maximum_supply) {
    require_auth(get_self());
    check(maximum_supply.is_valid() && maximum_supply.amount > 0, "Invalid supply");
    check(maximum_supply.symbol == ZOT_SYM, "Symbol must be ZOT,4");
    check(maximum_supply.amount <= SUPPLY_CAP, "Exceeds hard cap");

    stat_t stat_tbl(get_self(), maximum_supply.symbol.code().raw());
    check(stat_tbl.find(maximum_supply.symbol.code().raw()) == stat_tbl.end(),
          "Token already created");

    stat_tbl.emplace(get_self(), [&](auto& row) {
        row.supply     = asset(0, ZOT_SYM);
        row.max_supply = maximum_supply;
        row.issuer     = issuer;
    });

    // Seed authorized issuers
    issuers_t issuers_tbl(get_self(), get_self().value);
    for (name auth : {FAUCET_CONTRACT, BURN_CONTRACT, FARMING_CONTRACT}) {
        issuers_tbl.emplace(get_self(), [&](auto& row) {
            row.account    = auth;
            row.authorized = true;
        });
    }
}

// ── issue ──────────────────────────────────────────────────────────────────
ACTION token::issue(name to, asset quantity, std::string memo) {
    check(quantity.symbol == ZOT_SYM, "Wrong symbol");
    check(quantity.is_valid() && quantity.amount > 0, "Invalid quantity");
    check(memo.size() <= 256, "Memo too long");

    // Only authorized issuers (faucet, burn, farming) may call issue()
    check(is_authorized_issuer(get_first_receiver()), "Caller not authorized to issue");

    stat_t stat_tbl(get_self(), ZOT_SYM.code().raw());
    auto stat_itr = stat_tbl.require_find(ZOT_SYM.code().raw(), "Token not created");

    check(stat_itr->supply + quantity <= stat_itr->max_supply, "Supply cap exceeded");

    // Emission cap check
    emissioncap_t cap_tbl(get_self(), get_self().value);
    auto cap = cap_tbl.get_or_default();
    uint32_t today = current_time_point().sec_since_epoch() / 86400;
    if (cap.emission_day != today) {
        cap.faucet_today   = 0;
        cap.burn_today     = 0;
        cap.farming_today  = 0;
        cap.total_today    = 0;
        cap.emission_day   = today;
    }
    check(cap.total_today + static_cast<uint64_t>(quantity.amount) <= cap.cap_daily_total,
          "Daily emission cap reached");

    cap.total_today += static_cast<uint64_t>(quantity.amount);
    cap_tbl.set(cap, get_self());

    // Update global supply
    stat_tbl.modify(stat_itr, get_self(), [&](auto& row) {
        row.supply += quantity;
    });

    // Track total issued for halving computation
    halvingstate_t hstate_tbl(get_self(), get_self().value);
    auto hstate = hstate_tbl.get_or_default();
    hstate.total_issued += static_cast<uint64_t>(quantity.amount);
    hstate_tbl.set(hstate, get_self());

    add_balance(to, quantity, to);
}

// ── retire ─────────────────────────────────────────────────────────────────
ACTION token::retire(asset quantity, std::string memo) {
    require_auth(get_self());
    check(quantity.symbol == ZOT_SYM && quantity.amount > 0, "Invalid quantity");

    stat_t stat_tbl(get_self(), ZOT_SYM.code().raw());
    auto stat_itr = stat_tbl.require_find(ZOT_SYM.code().raw(), "Token not created");
    check(stat_itr->supply >= quantity, "Retire exceeds supply");

    stat_tbl.modify(stat_itr, get_self(), [&](auto& row) {
        row.supply -= quantity;
    });

    halvingstate_t hstate_tbl(get_self(), get_self().value);
    auto hstate = hstate_tbl.get_or_default();
    hstate.total_sinks += static_cast<uint64_t>(quantity.amount);
    hstate_tbl.set(hstate, get_self());

    sub_balance(get_self(), quantity);
}

// ── transfer ───────────────────────────────────────────────────────────────
ACTION token::transfer(name from, name to, asset quantity, std::string memo) {
    check(from != to, "Cannot transfer to self");
    require_auth(from);
    check(is_account(to), "Recipient does not exist");
    check(quantity.symbol == ZOT_SYM && quantity.is_valid() && quantity.amount > 0,
          "Invalid quantity");
    check(memo.size() <= 256, "Memo too long");

    require_recipient(from);
    require_recipient(to);

    sub_balance(from, quantity);
    add_balance(to, quantity, from);
}

// ── setissuer ──────────────────────────────────────────────────────────────
ACTION token::setissuer(name account, bool authorized) {
    require_auth(get_self());
    issuers_t issuers_tbl(get_self(), get_self().value);
    auto itr = issuers_tbl.find(account.value);
    if (itr == issuers_tbl.end()) {
        issuers_tbl.emplace(get_self(), [&](auto& row) {
            row.account    = account;
            row.authorized = authorized;
        });
    } else {
        issuers_tbl.modify(itr, get_self(), [&](auto& row) {
            row.authorized = authorized;
        });
    }
}

// ── setemission ────────────────────────────────────────────────────────────
ACTION token::setemission(uint64_t cap_daily_total, uint64_t cap_faucet,
                          uint64_t cap_burn, uint64_t cap_farming, uint64_t cap_per_claim) {
    require_auth(get_self());
    emissioncap_t cap_tbl(get_self(), get_self().value);
    auto cap = cap_tbl.get_or_default();
    cap.cap_daily_total = cap_daily_total;
    cap.cap_faucet      = cap_faucet;
    cap.cap_burn        = cap_burn;
    cap.cap_farming     = cap_farming;
    cap.cap_per_claim   = cap_per_claim;
    cap_tbl.set(cap, get_self());
}

// ── sethalving ─────────────────────────────────────────────────────────────
ACTION token::sethalving(uint8_t halving_id, uint64_t seuil_supply_nette,
                         uint32_t plancher_ts_min, uint64_t faucet_rate_new,
                         uint8_t burn_rate_pct, uint8_t farming_rate_pct) {
    require_auth(get_self());
    halvingcfg_t hcfg_tbl(get_self(), get_self().value);
    auto itr = hcfg_tbl.find(halving_id);
    if (itr == hcfg_tbl.end()) {
        hcfg_tbl.emplace(get_self(), [&](auto& row) {
            row.halving_id         = halving_id;
            row.seuil_supply_nette = seuil_supply_nette;
            row.plancher_ts_min    = plancher_ts_min;
            row.faucet_rate_new    = faucet_rate_new;
            row.burn_rate_pct      = burn_rate_pct;
            row.farming_rate_pct   = farming_rate_pct;
            row.declenche          = false;
            row.declenchement_ts   = 0;
        });
    } else {
        hcfg_tbl.modify(itr, get_self(), [&](auto& row) {
            row.seuil_supply_nette = seuil_supply_nette;
            row.plancher_ts_min    = plancher_ts_min;
            row.faucet_rate_new    = faucet_rate_new;
            row.burn_rate_pct      = burn_rate_pct;
            row.farming_rate_pct   = farming_rate_pct;
        });
    }
}

// ── checkhalving ───────────────────────────────────────────────────────────
// Anyone may call — checks double condition and triggers next halving if met
ACTION token::checkhalving() {
    halvingcfg_t hcfg_tbl(get_self(), get_self().value);
    halvingstate_t hstate_tbl(get_self(), get_self().value);
    emissioncap_t cap_tbl(get_self(), get_self().value);

    auto hstate = hstate_tbl.get_or_default();
    uint64_t net = net_supply();
    uint32_t now_sec = current_time_point().sec_since_epoch();

    for (auto& h : hcfg_tbl) {
        if (h.declenche) continue;

        bool supply_met = net >= h.seuil_supply_nette;
        bool time_met   = (now_sec - hstate.last_halving_ts) >= h.plancher_ts_min;

        if (supply_met && time_met) {
            // Trigger halving: update emission caps and faucet/burn/farming rates
            auto cap = cap_tbl.get_or_default();
            cap.cap_faucet = h.faucet_rate_new; // new daily rate for faucet pool
            cap_tbl.set(cap, get_self());

            // Update state
            hstate.last_halving_id = h.halving_id;
            hstate.last_halving_ts = now_sec;
            hstate_tbl.set(hstate, get_self());

            // Mark halving as triggered
            hcfg_tbl.modify(hcfg_tbl.iterator_to(h), get_self(), [&](auto& row) {
                row.declenche        = true;
                row.declenchement_ts = now_sec;
            });

            // Only trigger one halving per call
            break;
        }
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────
void token::sub_balance(name owner, asset value) {
    accounts_t from_acnts(get_self(), owner.value);
    auto from_itr = from_acnts.require_find(value.symbol.code().raw(), "No balance");
    check(from_itr->balance >= value, "Insufficient balance");
    if (from_itr->balance == value) {
        from_acnts.erase(from_itr);
    } else {
        from_acnts.modify(from_itr, get_self(), [&](auto& row) {
            row.balance -= value;
        });
    }
}

void token::add_balance(name owner, asset value, name ram_payer) {
    accounts_t to_acnts(get_self(), owner.value);
    auto to_itr = to_acnts.find(value.symbol.code().raw());
    if (to_itr == to_acnts.end()) {
        to_acnts.emplace(ram_payer, [&](auto& row) {
            row.balance = value;
        });
    } else {
        to_acnts.modify(to_itr, get_self(), [&](auto& row) {
            row.balance += value;
        });
    }
}

bool token::is_authorized_issuer(name account) {
    issuers_t issuers_tbl(get_self(), get_self().value);
    auto itr = issuers_tbl.find(account.value);
    return (itr != issuers_tbl.end() && itr->authorized);
}

uint64_t token::net_supply() {
    halvingstate_t hstate_tbl(get_self(), get_self().value);
    auto hstate = hstate_tbl.get_or_default();
    return (hstate.total_issued > hstate.total_sinks)
           ? hstate.total_issued - hstate.total_sinks : 0;
}

EOSIO_DISPATCH(token, (create)(issue)(retire)(transfer)(setissuer)(setemission)(sethalving)(checkhalving))
