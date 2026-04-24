#include <burn.hpp>

// ── on_nft_transfer ────────────────────────────────────────────────────────
// Triggered when user sends NFT(s) to this contract via AtomicAssets transfer
void burn::on_nft_transfer(name from, name to, std::vector<uint64_t> asset_ids, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return; // avoid self-transfer loops

    require_auth(from);

    for (uint64_t asset_id : asset_ids) {
        process_burn(from, asset_id);
    }
}

// ── on_zot_transfer ────────────────────────────────────────────────────────
void burn::on_zot_transfer(name from, name to, asset quantity, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return;

    check(quantity.symbol == ZOT_SYM, "Invalid symbol");
    check(quantity.amount > 0, "Amount must be positive");

    // Memo "recharge:<asset_id>" triggers tool recharge
    if (memo.rfind("recharge:", 0) == 0) {
        handle_recharge(from, quantity, memo.substr(9));
        return;
    }

    // All other ZOT transfers to this contract are sinks — tokens stay locked
}

// ── on_wax_transfer ────────────────────────────────────────────────────────
void burn::on_wax_transfer(name from, name to, asset quantity, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return;

    check(quantity.symbol == WAX_SYM, "Invalid symbol");

    // Replenish treasury balance
    swapcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    cfg.treasury_balance += quantity;
    cfg_tbl.set(cfg, get_self());
}

// ── process_burn ───────────────────────────────────────────────────────────
void burn::process_burn(name wallet, uint64_t asset_id) {
    // TODO: fetch asset data from atomicassets to get:
    //   - collection_name
    //   - template_id
    //   - rarity (from immutable_data)
    //   - ram_usage (bytes)
    // For now: stubs with placeholder values

    name   collection_name = "placeholder"_n; // from atomicassets asset row
    uint64_t ram_bytes     = 256;             // from asset.ram_usage
    uint64_t base_value_units = 200000;       // 20.0000 ZOT base (from oracle_floor_price)
    uint16_t boost_mult    = 100;             // 1.0x default

    // Check if collection is in registry — apply partner boost/split
    colregistry_t col_tbl(get_self(), get_self().value);
    auto col_itr = col_tbl.find(collection_name.value);
    bool is_partner = (col_itr != col_tbl.end() && col_itr->actif);

    if (is_partner) {
        boost_mult = col_itr->boost_multiplier;
        // base_value_units = max(oracle_floor_price, market_price) — oracle lookup TODO
    }

    // TODO: apply Tool Burn boosts (read from toolcharges + atomicassets equipped tools)
    // TODO: apply NFT Profil boost

    auto [zot_reward, wax_reward] = compute_rewards(base_value_units, boost_mult);

    // Issue ZOT
    issue_zot(wallet, zot_reward, "ZOTVERSE burn reward");

    // Distribute WAX from treasury (with daily cap + floor fallback)
    distribute_wax(wallet, wax_reward);

    // Update stats
    uint64_t wax_units = static_cast<uint64_t>(wax_reward.amount);
    update_burnlog(wallet, static_cast<uint64_t>(zot_reward.amount), ram_bytes, wax_units);
    update_ramlb(wallet, ram_bytes, wax_units);

    // RAM fee split for partner collections
    if (is_partner) {
        // ram_wax_value = ram_bytes * current_ram_price (from eosio.rammarket — TODO)
        asset ram_wax_value(static_cast<int64_t>(ram_bytes * 1950), WAX_SYM); // ~0.019 WAX/KB mock
        split_ram_fee(ram_wax_value, col_itr->royalty_wallet);
    }

    // Burn the NFT (send to eosio.null or atomicassets burn)
    // action(..., ATOMIC_CONTRACT, "burnasset"_n, ...).send();
}

// ── compute_rewards ────────────────────────────────────────────────────────
std::pair<asset, asset> burn::compute_rewards(uint64_t base_value_units, uint16_t boost_mult) {
    swapcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();

    uint64_t boosted = base_value_units * boost_mult / 100;

    uint64_t zot_units = boosted * cfg.ratio_zot_pct / 100;
    uint64_t wax_units = boosted * cfg.ratio_wax_pct / 100;

    // Enforce ratio floor: ZOT must be >= ratio_floor_zot%
    uint64_t floor_zot = boosted * cfg.ratio_floor_zot / 100;
    if (zot_units < floor_zot) {
        zot_units = floor_zot;
        wax_units = boosted - zot_units;
    }

    return {
        asset(static_cast<int64_t>(zot_units), ZOT_SYM),
        asset(static_cast<int64_t>(wax_units), WAX_SYM)
    };
}

// ── distribute_wax ─────────────────────────────────────────────────────────
void burn::distribute_wax(name to, asset wax_amount) {
    swapcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();

    uint32_t today = current_time_point().sec_since_epoch() / 86400;

    // Reset daily cap counter when day changes
    if (cfg.distribution_day != today) {
        cfg.wax_distributed_today = asset(0, WAX_SYM);
        cfg.distribution_day = today;
    }

    // Fallback to 100% ZOT if treasury below minimum
    if (cfg.treasury_balance < cfg.treasury_minimum) {
        // TODO: issue extra ZOT to cover wax_amount equivalent
        cfg_tbl.set(cfg, get_self());
        return;
    }

    // Enforce daily cap
    asset available_today = cfg.cap_wax_daily - cfg.wax_distributed_today;
    asset actual_wax = (wax_amount > available_today) ? available_today : wax_amount;

    if (actual_wax.amount <= 0) {
        cfg_tbl.set(cfg, get_self());
        return;
    }

    cfg.treasury_balance       -= actual_wax;
    cfg.wax_distributed_today  += actual_wax;
    cfg_tbl.set(cfg, get_self());

    action(
        permission_level{get_self(), "active"_n},
        "eosio.token"_n,
        "transfer"_n,
        std::make_tuple(get_self(), to, actual_wax, std::string("ZOTVERSE burn WAX reward"))
    ).send();
}

// ── update_burnlog ─────────────────────────────────────────────────────────
void burn::update_burnlog(name wallet, uint64_t value_units, uint64_t ram_bytes, uint64_t wax_units) {
    burnlog_t bl_tbl(get_self(), get_self().value);
    uint32_t now_sec = current_time_point().sec_since_epoch();

    auto bl_itr = bl_tbl.find(wallet.value);
    if (bl_itr == bl_tbl.end()) {
        bl_tbl.emplace(get_self(), [&](auto& row) {
            row.wallet                  = wallet;
            row.total_value_burned_units = value_units;
            row.last_burn_ts            = now_sec;
            row.total_ram_freed_bytes   = ram_bytes;
            row.total_wax_earned_units  = wax_units;
            row.total_nfts_burned       = 1;
        });
    } else {
        bl_tbl.modify(bl_itr, get_self(), [&](auto& row) {
            row.total_value_burned_units += value_units;
            row.last_burn_ts             = now_sec;
            row.total_ram_freed_bytes    += ram_bytes;
            row.total_wax_earned_units   += wax_units;
            row.total_nfts_burned        += 1;
        });
    }
}

// ── update_ramlb ───────────────────────────────────────────────────────────
void burn::update_ramlb(name wallet, uint64_t ram_bytes, uint64_t wax_units) {
    ramlb_t lb_tbl(get_self(), get_self().value);
    uint32_t period = current_time_point().sec_since_epoch() / 86400 / 30; // approx monthly

    auto lb_itr = lb_tbl.find(wallet.value);
    if (lb_itr == lb_tbl.end()) {
        lb_tbl.emplace(get_self(), [&](auto& row) {
            row.wallet               = wallet;
            row.total_ram_bytes      = ram_bytes;
            row.total_wax_value_units = wax_units;
            row.rank                 = 0; // updated by admin action
            row.period               = period;
        });
    } else {
        lb_tbl.modify(lb_itr, get_self(), [&](auto& row) {
            row.total_ram_bytes       += ram_bytes;
            row.total_wax_value_units += wax_units;
        });
    }
}

// ── handle_recharge ────────────────────────────────────────────────────────
void burn::handle_recharge(name wallet, asset zot_quantity, std::string asset_id_str) {
    uint64_t asset_id = std::stoull(asset_id_str);

    toolcharges_t tc_tbl(get_self(), get_self().value);
    auto tc_itr = tc_tbl.require_find(asset_id, "Tool not registered");

    check(tc_itr->wallet == wallet, "Not the tool owner");

    // TODO: verify ZOT quantity matches recharge cost from config
    // Reset charge timestamp (linear regen restarts from MAX_CHARGES)
    tc_tbl.modify(tc_itr, get_self(), [&](auto& row) {
        row.current_charges = 12; // MAX_CHARGES
        row.last_used_ts    = current_time_point().sec_since_epoch();
    });

    // ZOT is burned (stays in contract, not re-issued)
}

// ── split_ram_fee ──────────────────────────────────────────────────────────
// 70% treasury (stays in contract), 20% royalty_wallet, 10% sink ZOT purchase
void burn::split_ram_fee(asset ram_wax_value, name royalty_wallet) {
    if (ram_wax_value.amount <= 0) return;

    asset royalty = asset(ram_wax_value.amount * 20 / 100, WAX_SYM);
    // 70% stays in treasury_balance (already there from on_wax_transfer)
    // 10% used to buy + burn ZOT — TODO: Tacos swap inline action

    if (royalty.amount > 0) {
        action(
            permission_level{get_self(), "active"_n},
            "eosio.token"_n,
            "transfer"_n,
            std::make_tuple(get_self(), royalty_wallet, royalty,
                            std::string("ZOTVERSE RAM fee royalty 20%"))
        ).send();
    }
}

// ── setswap ────────────────────────────────────────────────────────────────
ACTION burn::setswap(uint8_t ratio_zot_pct, uint8_t ratio_wax_pct,
                     asset cap_wax_daily, asset treasury_minimum,
                     uint8_t ratio_floor_zot) {
    require_auth(get_self());
    check(ratio_zot_pct + ratio_wax_pct == 100, "Ratios must sum to 100");
    check(ratio_zot_pct >= ratio_floor_zot, "ZOT ratio below floor");

    swapcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    cfg.ratio_zot_pct    = ratio_zot_pct;
    cfg.ratio_wax_pct    = ratio_wax_pct;
    cfg.cap_wax_daily    = cap_wax_daily;
    cfg.treasury_minimum = treasury_minimum;
    cfg.ratio_floor_zot  = ratio_floor_zot;
    cfg_tbl.set(cfg, get_self());
}

// ── setcollection ──────────────────────────────────────────────────────────
ACTION burn::setcollection(name collection_name, asset oracle_floor_price,
                           uint16_t boost_multiplier, uint8_t burn_share_pct,
                           name royalty_wallet, uint8_t source, bool actif) {
    require_auth(get_self());
    check(burn_share_pct <= 30, "burn_share_pct max 30%");

    colregistry_t col_tbl(get_self(), get_self().value);
    auto itr = col_tbl.find(collection_name.value);

    if (itr == col_tbl.end()) {
        col_tbl.emplace(get_self(), [&](auto& row) {
            row.collection_name  = collection_name;
            row.oracle_floor_price = oracle_floor_price;
            row.boost_multiplier = boost_multiplier;
            row.burn_share_pct   = burn_share_pct;
            row.royalty_wallet   = royalty_wallet;
            row.source           = source;
            row.vote_end_ts      = 0;
            row.actif            = actif;
        });
    } else {
        col_tbl.modify(itr, get_self(), [&](auto& row) {
            row.oracle_floor_price = oracle_floor_price;
            row.boost_multiplier = boost_multiplier;
            row.burn_share_pct   = burn_share_pct;
            row.royalty_wallet   = royalty_wallet;
            row.actif            = actif;
        });
    }
}

// ── delcollection ──────────────────────────────────────────────────────────
ACTION burn::delcollection(name collection_name) {
    require_auth(get_self());
    colregistry_t col_tbl(get_self(), get_self().value);
    auto itr = col_tbl.require_find(collection_name.value, "Collection not found");
    col_tbl.erase(itr);
}

// ── approvecol ─────────────────────────────────────────────────────────────
ACTION burn::approvecol(name collection_name, name royalty_wallet,
                        asset oracle_floor_price, uint8_t burn_share_pct) {
    // Only callable by vote.contract
    require_auth("vote.zotverse"_n);

    colregistry_t col_tbl(get_self(), get_self().value);
    auto itr = col_tbl.find(collection_name.value);

    uint32_t now_sec = current_time_point().sec_since_epoch();

    if (itr == col_tbl.end()) {
        col_tbl.emplace(get_self(), [&](auto& row) {
            row.collection_name   = collection_name;
            row.oracle_floor_price = oracle_floor_price;
            row.boost_multiplier  = 100;
            row.burn_share_pct    = burn_share_pct;
            row.royalty_wallet    = royalty_wallet;
            row.source            = static_cast<uint8_t>(CollectionSource::VOTE);
            row.vote_end_ts       = now_sec;
            row.actif             = true;
        });
    } else {
        col_tbl.modify(itr, get_self(), [&](auto& row) {
            row.royalty_wallet    = royalty_wallet;
            row.oracle_floor_price = oracle_floor_price;
            row.burn_share_pct    = burn_share_pct;
            row.source            = static_cast<uint8_t>(CollectionSource::VOTE);
            row.vote_end_ts       = now_sec;
            row.actif             = true;
        });
    }
}

// ── issue_zot ──────────────────────────────────────────────────────────────
void burn::issue_zot(name to, asset quantity, std::string memo) {
    action(
        permission_level{get_self(), "active"_n},
        TOKEN_CONTRACT,
        "issue"_n,
        std::make_tuple(to, quantity, memo)
    ).send();
}

EOSIO_DISPATCH(burn, (setswap)(setcollection)(delcollection)(approvecol))
