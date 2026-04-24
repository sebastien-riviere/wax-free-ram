#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/singleton.hpp>

using namespace eosio;

static constexpr name TOKEN_CONTRACT  = "zot.token"_n;
static constexpr name ATOMIC_CONTRACT = "atomicassets"_n;
static constexpr symbol ZOT_SYM       = symbol("ZOT", 4);
static constexpr symbol WAX_SYM       = symbol("WAX", 8);

// source: how the collection entered the registry
enum class CollectionSource : uint8_t { ADMIN = 0, VOTE = 1 };

CONTRACT burn : public contract {
public:
    using contract::contract;

    // ── Actions ────────────────────────────────────────────────────────────

    // Notification handler — called when AtomicAssets NFT is transferred to this contract
    [[eosio::on_notify("atomicassets::transfer")]]
    void on_nft_transfer(name from, name to, std::vector<uint64_t> asset_ids, std::string memo);

    // Payable recharge of a Tool's charges (ZOT transferred to this contract)
    [[eosio::on_notify("zot.token::transfer")]]
    void on_zot_transfer(name from, name to, asset quantity, std::string memo);

    // Payable WAX — received from treasury refills or direct WAX payments
    [[eosio::on_notify("eosio.token::transfer")]]
    void on_wax_transfer(name from, name to, asset quantity, std::string memo);

    // Admin: set or update swap configuration
    [[eosio::action]]
    void setswap(uint8_t ratio_zot_pct, uint8_t ratio_wax_pct,
                 asset cap_wax_daily, asset treasury_minimum,
                 uint8_t ratio_floor_zot);

    // Admin: register/update a collection in collection_registry
    [[eosio::action]]
    void setcollection(name collection_name, asset oracle_floor_price,
                       uint16_t boost_multiplier, uint8_t burn_share_pct,
                       name royalty_wallet, uint8_t source, bool actif);

    // Admin: remove a collection
    [[eosio::action]]
    void delcollection(name collection_name);

    // vote.contract delegate: activate an approved collection
    [[eosio::action]]
    void approvecol(name collection_name, name royalty_wallet,
                    asset oracle_floor_price, uint8_t burn_share_pct);

    // ── Tables ─────────────────────────────────────────────────────────────

    // Tool charge tracking (per tool asset)
    TABLE toolcharge_s {
        uint64_t tool_asset_id;
        name     wallet;
        uint8_t  current_charges;
        uint32_t last_used_ts;     // epoch seconds — for linear regen calculation

        uint64_t primary_key() const { return tool_asset_id; }
        uint64_t by_wallet()   const { return wallet.value; }
    };
    typedef multi_index<"toolcharges"_n, toolcharge_s,
        indexed_by<"bywallet"_n, const_mem_fun<toolcharge_s, uint64_t, &toolcharge_s::by_wallet>>
    > toolcharges_t;

    // Cumulative burn stats per wallet
    TABLE burnlog_s {
        name     wallet;
        uint64_t total_value_burned_units; // ZOT units (4 decimals)
        uint32_t last_burn_ts;
        uint64_t total_ram_freed_bytes;
        uint64_t total_wax_earned_units;   // WAX units (8 decimals)
        uint32_t total_nfts_burned;

        uint64_t primary_key() const { return wallet.value; }
    };
    typedef multi_index<"burnlog"_n, burnlog_s> burnlog_t;

    // Swap configuration singleton
    TABLE swapcfg_s {
        uint8_t ratio_zot_pct    = 80;
        uint8_t ratio_wax_pct    = 20;
        asset   cap_wax_daily    = asset(5000000000, WAX_SYM); // 50 WAX
        asset   treasury_minimum = asset(20000000000, WAX_SYM); // 200 WAX
        uint8_t ratio_floor_zot  = 60;  // cannot go below 60% ZOT
        asset   treasury_balance = asset(0, WAX_SYM);
        asset   wax_distributed_today = asset(0, WAX_SYM);
        uint32_t distribution_day  = 0; // epoch day (ts / 86400)
    };
    typedef singleton<"swapcfg"_n, swapcfg_s> swapcfg_t;

    // Approved collections for burn engine
    TABLE collection_s {
        name     collection_name;
        asset    oracle_floor_price;    // floor WAX value per NFT
        uint16_t boost_multiplier;      // e.g. 100 = 1.0x, 120 = 1.2x
        uint8_t  burn_share_pct;        // % of RAM fee going to royalty_wallet
        name     royalty_wallet;
        uint8_t  source;                // CollectionSource enum
        uint32_t vote_end_ts;           // 0 if admin-approved
        bool     actif;

        uint64_t primary_key() const { return collection_name.value; }
    };
    typedef multi_index<"colregistry"_n, collection_s> colregistry_t;

    // RAM leaderboard (monthly period)
    TABLE ramlb_s {
        name     wallet;
        uint64_t total_ram_bytes;
        uint64_t total_wax_value_units;
        uint32_t rank;
        uint32_t period;   // YYYYMM e.g. 202604

        uint64_t primary_key()  const { return wallet.value; }
        uint64_t by_ram()       const { return UINT64_MAX - total_ram_bytes; } // desc
        uint64_t by_period()    const { return period; }
    };
    typedef multi_index<"ramlb"_n, ramlb_s,
        indexed_by<"byram"_n,    const_mem_fun<ramlb_s, uint64_t, &ramlb_s::by_ram>>,
        indexed_by<"byperiod"_n, const_mem_fun<ramlb_s, uint64_t, &ramlb_s::by_period>>
    > ramlb_t;

private:
    // Core burn logic — called from on_nft_transfer
    void process_burn(name wallet, uint64_t asset_id);

    // Compute dual reward split and dispatch
    // Returns {zot_amount, wax_amount}
    std::pair<asset, asset> compute_rewards(uint64_t base_value_units,
                                            uint16_t boost_multiplier);

    // Distribute WAX from treasury (with daily cap + minimum floor fallback)
    void distribute_wax(name to, asset wax_amount);

    // Update burn_log for wallet
    void update_burnlog(name wallet, uint64_t value_units,
                        uint64_t ram_bytes, uint64_t wax_units);

    // Update RAM leaderboard
    void update_ramlb(name wallet, uint64_t ram_bytes, uint64_t wax_units);

    // Handle ZOT payment for tool recharge
    void handle_recharge(name wallet, asset zot_quantity, std::string memo);

    // Issue ZOT via token.contract
    void issue_zot(name to, asset quantity, std::string memo);

    // Split RAM fee for partner collections: 70% treasury / 20% royalty / 10% sink ZOT
    void split_ram_fee(asset ram_wax_value, name royalty_wallet);
};
