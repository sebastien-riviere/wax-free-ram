#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/singleton.hpp>
#include <map>
#include <vector>

using namespace eosio;

static constexpr name TOKEN_CONTRACT  = "zot.token"_n;
static constexpr name ATOMIC_CONTRACT = "atomicassets"_n;
static constexpr symbol ZOT_SYM       = symbol("ZOT", 4);

// Fee tiers in basis points (bps): < 24h, 24h–7j, 7j–30j, > 30j
// Applied as integer: 2000 = 20%, 1000 = 10%, 500 = 5%, 200 = 2%
static constexpr uint16_t FEE_TIER_0 = 2000; // < 24h
static constexpr uint16_t FEE_TIER_1 = 1000; // 24h – 7j
static constexpr uint16_t FEE_TIER_2 =  500; // 7j – 30j
static constexpr uint16_t FEE_TIER_3 =  200; // > 30j

static constexpr uint32_t COOLDOWN_UNSTAKE_SEC = 86400; // 24h

CONTRACT farming : public contract {
public:
    using contract::contract;

    // ── Actions ────────────────────────────────────────────────────────────

    // NFT received via AtomicAssets transfer → stake it
    [[eosio::on_notify("atomicassets::transfer")]]
    void on_nft_transfer(name from, name to, std::vector<uint64_t> asset_ids, std::string memo);

    // Unstake a single NFT — returns NFT + claims net reward
    [[eosio::action]]
    void unstake(name wallet, uint64_t asset_id);

    // Claim accumulated yield for all staked NFTs (no unstake)
    [[eosio::action]]
    void claimfarm(name wallet);

    // Admin: configure a farming pool
    [[eosio::action]]
    void setpool(uint64_t pool_id, std::vector<uint32_t> template_ids,
                 uint32_t daily_rate_common, uint32_t daily_rate_rare,
                 uint32_t daily_rate_epic, uint32_t daily_rate_legendary,
                 uint32_t daily_rate_mythic, uint32_t cooldown_unstake,
                 uint8_t max_nft_wallet, bool actif);

    // Admin: delete a pool
    [[eosio::action]]
    void delpool(uint64_t pool_id);

    // ── Tables ─────────────────────────────────────────────────────────────

    // Farming pool configuration
    // daily_rates stored as flat uint32 (ZOT units, 4 decimals) by rarity index
    // rarity index: 0=common, 1=rare, 2=epic, 3=legendary, 4=mythic
    TABLE farmpool_s {
        uint64_t pool_id;
        std::vector<uint32_t> template_ids;   // whitelisted template IDs for this pool
        std::vector<uint32_t> daily_rates;    // [common, rare, epic, legendary, mythic]
        uint32_t cooldown_unstake;             // seconds
        uint8_t  max_nft_wallet;              // max simultaneous NFTs per wallet
        bool     actif;

        uint64_t primary_key() const { return pool_id; }
    };
    typedef multi_index<"farmpools"_n, farmpool_s> farmpools_t;

    // Individual NFT stake records
    TABLE farmstake_s {
        uint64_t stake_id;       // auto-incremented
        name     wallet;
        uint64_t asset_id;
        uint32_t template_id;
        uint8_t  rarity;         // 0=common … 4=mythic
        uint64_t pool_id;
        uint32_t stake_ts;       // epoch seconds — when staked
        uint32_t last_claim_ts;  // epoch seconds — last reward claim

        uint64_t primary_key() const { return stake_id; }
        uint64_t by_wallet()   const { return wallet.value; }
        uint64_t by_asset()    const { return asset_id; }
    };
    typedef multi_index<"farmstakes"_n, farmstake_s,
        indexed_by<"bywallet"_n, const_mem_fun<farmstake_s, uint64_t, &farmstake_s::by_wallet>>,
        indexed_by<"byasset"_n,  const_mem_fun<farmstake_s, uint64_t, &farmstake_s::by_asset>>
    > farmstakes_t;

    // Global farming config singleton
    TABLE farmcfg_s {
        uint64_t next_stake_id    = 1;
        uint8_t  global_max_nfts  = 10; // max NFTs per wallet across all pools
        uint64_t total_staked     = 0;
    };
    typedef singleton<"farmcfg"_n, farmcfg_s> farmcfg_t;

private:
    // Stake a single NFT (called from on_nft_transfer)
    void process_stake(name wallet, uint64_t asset_id, uint32_t template_id, uint8_t rarity, uint64_t pool_id);

    // Compute pending reward for a stake record (gross, before fee)
    uint64_t compute_pending(const farmstake_s& stake, uint32_t now_sec);

    // Compute withdrawal fee (bps) based on stake duration
    uint16_t get_fee_bps(uint32_t stake_ts, uint32_t now_sec);

    // Issue ZOT and burn fee portion
    void settle_reward(name wallet, uint64_t gross_units, uint32_t stake_ts);

    // Find pool_id for a given template_id
    uint64_t find_pool(uint32_t template_id);

    // Resolve rarity string to uint8 index
    uint8_t rarity_to_idx(const std::string& rarity_str);
};
