#include <faucet.hpp>

// ── claim ──────────────────────────────────────────────────────────────────
ACTION faucet::claim(name wallet) {
    require_auth(wallet);

    faucetcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();

    cooldowns_t cd_tbl(get_self(), get_self().value);
    auto cd_itr = cd_tbl.find(wallet.value);

    uint32_t now_sec = current_time_point().sec_since_epoch();

    if (cd_itr != cd_tbl.end()) {
        check(now_sec >= cd_itr->last_claim_ts + cfg.cooldown_sec,
              "Cooldown not elapsed");
    }

    // TODO: apply NFT Profil boost + Tool Faucet boost (read from atomicassets)
    // TODO: check emission_cap via inline call to token.contract
    uint64_t reward = cfg.base_reward_units;

    uint64_t new_nonce = (cd_itr != cd_tbl.end()) ? cd_itr->nonce + 1 : 1;

    if (cd_itr == cd_tbl.end()) {
        cd_tbl.emplace(get_self(), [&](auto& row) {
            row.wallet       = wallet;
            row.last_claim_ts = now_sec;
            row.nonce        = new_nonce;
        });
    } else {
        cd_tbl.modify(cd_itr, get_self(), [&](auto& row) {
            row.last_claim_ts = now_sec;
            row.nonce        = new_nonce;
        });
    }

    // Roll for NFT loot — internal RNG for Common/Rare, oracle for Epic+
    uint16_t roll = static_cast<uint16_t>(pseudo_rand(wallet, new_nonce) % 10000);
    uint32_t loot_template = roll_drop(roll);

    if (loot_template > 0) {
        // TODO: determine rng_type from dropweights table
        // If rng_type == 1: call requestrand() instead of minting directly
        // For now: inline mint via atomicassets (requires authorization setup)
    }

    issue_zot(wallet, reward, "ZOTVERSE faucet claim");
}

// ── requestrand ────────────────────────────────────────────────────────────
ACTION faucet::requestrand(name wallet, uint64_t assoc_id) {
    require_auth(wallet);

    rngqueue_t rng_tbl(get_self(), get_self().value);
    rng_tbl.emplace(get_self(), [&](auto& row) {
        row.request_id = assoc_id;
        row.wallet     = wallet;
        row.pending    = true;
    });

    // Inline action to WAX RNG oracle
    action(
        permission_level{get_self(), "active"_n},
        ORACLE_CONTRACT,
        "requestrand"_n,
        std::make_tuple(assoc_id, get_self())
    ).send();
}

// ── receiverand ────────────────────────────────────────────────────────────
ACTION faucet::receiverand(uint64_t assoc_id, checksum256 random_value) {
    require_auth(ORACLE_CONTRACT);

    rngqueue_t rng_tbl(get_self(), get_self().value);
    auto rng_itr = rng_tbl.require_find(assoc_id, "RNG request not found");

    // Extract first 8 bytes of hash as uint64
    auto hash_arr = random_value.extract_as_byte_array();
    uint64_t rand64 = 0;
    for (int i = 0; i < 8; i++) rand64 = (rand64 << 8) | hash_arr[i];
    uint16_t roll = static_cast<uint16_t>(rand64 % 10000);

    uint32_t loot_template = roll_drop(roll);

    if (loot_template > 0) {
        // TODO: mint NFT via atomicassets mintasset inline action
        // action(..., "mintasset"_n, ...).send();
    }

    rng_tbl.erase(rng_itr);
}

// ── setdropwgt ─────────────────────────────────────────────────────────────
ACTION faucet::setdropwgt(uint32_t template_id, uint16_t weight, bool actif, uint8_t rng_type) {
    require_auth(get_self());

    dropweights_t dw_tbl(get_self(), get_self().value);
    auto itr = dw_tbl.find(template_id);

    if (itr == dw_tbl.end()) {
        dw_tbl.emplace(get_self(), [&](auto& row) {
            row.template_id = template_id;
            row.weight      = weight;
            row.actif       = actif;
            row.rng_type    = rng_type;
        });
    } else {
        dw_tbl.modify(itr, get_self(), [&](auto& row) {
            row.weight   = weight;
            row.actif    = actif;
            row.rng_type = rng_type;
        });
    }
}

// ── deldropwgt ─────────────────────────────────────────────────────────────
ACTION faucet::deldropwgt(uint32_t template_id) {
    require_auth(get_self());
    dropweights_t dw_tbl(get_self(), get_self().value);
    auto itr = dw_tbl.require_find(template_id, "Template not found");
    dw_tbl.erase(itr);
}

// ── setconfig ──────────────────────────────────────────────────────────────
ACTION faucet::setconfig(uint32_t cooldown_sec, uint64_t base_reward_units) {
    require_auth(get_self());
    faucetcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    cfg.cooldown_sec      = cooldown_sec;
    cfg.base_reward_units = base_reward_units;
    cfg_tbl.set(cfg, get_self());
}

// ── Helpers ────────────────────────────────────────────────────────────────
uint64_t faucet::pseudo_rand(name wallet, uint64_t nonce) {
    // Deterministic pseudo-RNG — NOT cryptographically secure
    // Only used for Common/Rare drops (low stakes)
    uint64_t seed = current_block_time().to_time_point().sec_since_epoch()
                  ^ wallet.value
                  ^ nonce;
    // xorshift64
    seed ^= seed << 13;
    seed ^= seed >> 7;
    seed ^= seed << 17;
    return seed;
}

uint32_t faucet::roll_drop(uint16_t roll) {
    dropweights_t dw_tbl(get_self(), get_self().value);
    uint16_t cumulative = 0;
    for (auto& dw : dw_tbl) {
        if (!dw.actif) continue;
        cumulative += dw.weight;
        if (roll < cumulative) return dw.template_id;
    }
    return 0; // no drop
}

void faucet::issue_zot(name to, uint64_t amount_units, std::string memo) {
    // ZOT uses 4 decimal places, symbol "ZOT"
    asset quantity(static_cast<int64_t>(amount_units), symbol("ZOT", 4));
    action(
        permission_level{get_self(), "active"_n},
        TOKEN_CONTRACT,
        "issue"_n,
        std::make_tuple(to, quantity, memo)
    ).send();
}

EOSIO_DISPATCH(faucet, (claim)(requestrand)(receiverand)(setdropwgt)(deldropwgt)(setconfig))
