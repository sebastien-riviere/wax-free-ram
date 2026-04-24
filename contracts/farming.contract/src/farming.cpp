#include <farming.hpp>

// ── on_nft_transfer ────────────────────────────────────────────────────────
void farming::on_nft_transfer(name from, name to, std::vector<uint64_t> asset_ids, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return;

    require_auth(from);

    farmcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();

    // Count existing stakes for this wallet
    farmstakes_t stakes_tbl(get_self(), get_self().value);
    auto wallet_idx = stakes_tbl.get_index<"bywallet"_n>();
    uint64_t current_staked = std::distance(wallet_idx.lower_bound(from.value),
                                            wallet_idx.upper_bound(from.value));
    check(current_staked + asset_ids.size() <= cfg.global_max_nfts,
          "Exceeds max NFTs per wallet");

    for (uint64_t asset_id : asset_ids) {
        // TODO: fetch template_id and rarity from atomicassets
        uint32_t template_id = 0;    // from atomicassets asset row
        uint8_t  rarity      = 0;    // resolved from immutable_data["rarity"]
        uint64_t pool_id     = find_pool(template_id);
        check(pool_id != UINT64_MAX, "NFT template not whitelisted in any pool");

        process_stake(from, asset_id, template_id, rarity, pool_id);
        cfg.total_staked++;
    }

    cfg_tbl.set(cfg, get_self());
}

// ── unstake ────────────────────────────────────────────────────────────────
ACTION farming::unstake(name wallet, uint64_t asset_id) {
    require_auth(wallet);

    farmstakes_t stakes_tbl(get_self(), get_self().value);
    auto asset_idx = stakes_tbl.get_index<"byasset"_n>();
    auto stake_itr = asset_idx.require_find(asset_id, "NFT not staked");

    check(stake_itr->wallet == wallet, "Not the staker");

    uint32_t now_sec = current_time_point().sec_since_epoch();
    check(now_sec >= stake_itr->last_claim_ts + COOLDOWN_UNSTAKE_SEC,
          "Unstake cooldown not elapsed (24h)");

    // Compute and settle pending reward
    uint64_t gross = compute_pending(*stake_itr, now_sec);
    if (gross > 0) {
        settle_reward(wallet, gross, stake_itr->stake_ts);
    }

    // Return NFT to user via AtomicAssets transfer
    action(
        permission_level{get_self(), "active"_n},
        ATOMIC_CONTRACT,
        "transfer"_n,
        std::make_tuple(get_self(), wallet,
                        std::vector<uint64_t>{asset_id},
                        std::string("ZOTVERSE unstake"))
    ).send();

    farmcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    if (cfg.total_staked > 0) cfg.total_staked--;
    cfg_tbl.set(cfg, get_self());

    asset_idx.erase(stake_itr);
}

// ── claimfarm ──────────────────────────────────────────────────────────────
ACTION farming::claimfarm(name wallet) {
    require_auth(wallet);

    farmstakes_t stakes_tbl(get_self(), get_self().value);
    auto wallet_idx = stakes_tbl.get_index<"bywallet"_n>();

    uint32_t now_sec = current_time_point().sec_since_epoch();
    uint64_t total_gross = 0;

    // Collect all stakes for this wallet — must buffer modifications
    std::vector<uint64_t> stake_ids;
    for (auto itr = wallet_idx.lower_bound(wallet.value);
         itr != wallet_idx.upper_bound(wallet.value); ++itr) {
        stake_ids.push_back(itr->stake_id);
        total_gross += compute_pending(*itr, now_sec);
    }

    check(total_gross > 0, "Nothing to claim");

    // Update last_claim_ts for all staked NFTs
    for (uint64_t sid : stake_ids) {
        auto s_itr = stakes_tbl.require_find(sid, "Stake not found");
        stakes_tbl.modify(s_itr, get_self(), [&](auto& row) {
            row.last_claim_ts = now_sec;
        });
    }

    // Use oldest stake_ts for fee calculation (most favorable to user across batch)
    // Simplified: use first stake's stake_ts — TODO: per-NFT granular fee calculation
    auto first_itr = wallet_idx.lower_bound(wallet.value);
    uint32_t oldest_stake_ts = (first_itr != wallet_idx.upper_bound(wallet.value))
                                ? first_itr->stake_ts : now_sec;

    settle_reward(wallet, total_gross, oldest_stake_ts);
}

// ── setpool ────────────────────────────────────────────────────────────────
ACTION farming::setpool(uint64_t pool_id, std::vector<uint32_t> template_ids,
                        uint32_t daily_rate_common, uint32_t daily_rate_rare,
                        uint32_t daily_rate_epic, uint32_t daily_rate_legendary,
                        uint32_t daily_rate_mythic, uint32_t cooldown_unstake,
                        uint8_t max_nft_wallet, bool actif) {
    require_auth(get_self());

    farmpools_t pools_tbl(get_self(), get_self().value);
    auto itr = pools_tbl.find(pool_id);

    std::vector<uint32_t> rates = {
        daily_rate_common, daily_rate_rare, daily_rate_epic,
        daily_rate_legendary, daily_rate_mythic
    };

    if (itr == pools_tbl.end()) {
        pools_tbl.emplace(get_self(), [&](auto& row) {
            row.pool_id          = pool_id;
            row.template_ids     = template_ids;
            row.daily_rates      = rates;
            row.cooldown_unstake = cooldown_unstake;
            row.max_nft_wallet   = max_nft_wallet;
            row.actif            = actif;
        });
    } else {
        pools_tbl.modify(itr, get_self(), [&](auto& row) {
            row.template_ids     = template_ids;
            row.daily_rates      = rates;
            row.cooldown_unstake = cooldown_unstake;
            row.max_nft_wallet   = max_nft_wallet;
            row.actif            = actif;
        });
    }
}

// ── delpool ────────────────────────────────────────────────────────────────
ACTION farming::delpool(uint64_t pool_id) {
    require_auth(get_self());
    farmpools_t pools_tbl(get_self(), get_self().value);
    auto itr = pools_tbl.require_find(pool_id, "Pool not found");
    pools_tbl.erase(itr);
}

// ── Helpers ────────────────────────────────────────────────────────────────
void farming::process_stake(name wallet, uint64_t asset_id, uint32_t template_id,
                            uint8_t rarity, uint64_t pool_id) {
    farmcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();

    farmstakes_t stakes_tbl(get_self(), get_self().value);
    uint32_t now_sec = current_time_point().sec_since_epoch();

    stakes_tbl.emplace(get_self(), [&](auto& row) {
        row.stake_id      = cfg.next_stake_id++;
        row.wallet        = wallet;
        row.asset_id      = asset_id;
        row.template_id   = template_id;
        row.rarity        = rarity;
        row.pool_id       = pool_id;
        row.stake_ts      = now_sec;
        row.last_claim_ts = now_sec;
    });

    cfg_tbl.set(cfg, get_self());
}

uint64_t farming::compute_pending(const farmstake_s& stake, uint32_t now_sec) {
    farmpools_t pools_tbl(get_self(), get_self().value);
    auto pool_itr = pools_tbl.find(stake.pool_id);
    if (pool_itr == pools_tbl.end() || !pool_itr->actif) return 0;

    uint8_t rarity_idx = stake.rarity < pool_itr->daily_rates.size()
                         ? stake.rarity : 0;
    uint64_t daily_rate = pool_itr->daily_rates[rarity_idx];

    uint32_t elapsed_sec = now_sec - stake.last_claim_ts;
    // pending_gross = elapsed_days * daily_rate (in ZOT units, 4 decimals)
    uint64_t pending = static_cast<uint64_t>(elapsed_sec) * daily_rate / 86400;

    // TODO: apply NFT Profil boost (read from equipped Profil via atomicassets)
    return pending;
}

uint16_t farming::get_fee_bps(uint32_t stake_ts, uint32_t now_sec) {
    uint32_t duration = now_sec - stake_ts;
    if (duration < 86400)          return FEE_TIER_0; // < 24h
    if (duration < 7 * 86400)     return FEE_TIER_1; // 24h – 7j
    if (duration < 30 * 86400)    return FEE_TIER_2; // 7j – 30j
    return FEE_TIER_3;                                // > 30j
}

void farming::settle_reward(name wallet, uint64_t gross_units, uint32_t stake_ts) {
    uint32_t now_sec = current_time_point().sec_since_epoch();
    uint16_t fee_bps = get_fee_bps(stake_ts, now_sec);

    uint64_t fee_units  = gross_units * fee_bps / 10000;
    uint64_t net_units  = gross_units - fee_units;

    if (net_units == 0) return;

    // Issue net reward to user
    asset net_reward(static_cast<int64_t>(net_units), ZOT_SYM);
    action(
        permission_level{get_self(), "active"_n},
        TOKEN_CONTRACT,
        "issue"_n,
        std::make_tuple(wallet, net_reward, std::string("ZOTVERSE farming yield"))
    ).send();

    // Fee portion is burned (not issued — permanent sink)
    // In production: issue fee to eosio.null or keep unissued
}

uint64_t farming::find_pool(uint32_t template_id) {
    farmpools_t pools_tbl(get_self(), get_self().value);
    for (const auto& pool : pools_tbl) {
        if (!pool.actif) continue;
        for (uint32_t tid : pool.template_ids) {
            if (tid == template_id) return pool.pool_id;
        }
    }
    return UINT64_MAX; // not found
}

uint8_t farming::rarity_to_idx(const std::string& rarity_str) {
    if (rarity_str == "common")    return 0;
    if (rarity_str == "rare")      return 1;
    if (rarity_str == "epic")      return 2;
    if (rarity_str == "legendary") return 3;
    if (rarity_str == "mythic")    return 4;
    return 0;
}

EOSIO_DISPATCH(farming, (unstake)(claimfarm)(setpool)(delpool))
