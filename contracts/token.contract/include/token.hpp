#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/singleton.hpp>

using namespace eosio;

// Authorized emitters — only these contracts may call issue()
// Set via setissuer admin action
static constexpr name FAUCET_CONTRACT  = "faucet.zotverse"_n;
static constexpr name BURN_CONTRACT    = "burn.zotverse"_n;
static constexpr name FARMING_CONTRACT = "farm.zotverse"_n;

// market.contract is intentionally excluded — sink only
static constexpr symbol ZOT_SYM        = symbol("ZOT", 4);
static constexpr int64_t SUPPLY_CAP    = 1000000000000; // 100,000,000.0000 ZOT

CONTRACT token : public contract {
public:
    using contract::contract;

    // ── Actions ────────────────────────────────────────────────────────────

    // One-time initialization — creates currency stat with zero supply
    [[eosio::action]]
    void create(name issuer, asset maximum_supply);

    // Issue new tokens — caller must be in authorized issuers list
    [[eosio::action]]
    void issue(name to, asset quantity, std::string memo);

    // Retire (burn) tokens from circulation
    [[eosio::action]]
    void retire(asset quantity, std::string memo);

    // Standard P2P transfer — cannot be restricted (EOSIO invariant)
    [[eosio::action]]
    void transfer(name from, name to, asset quantity, std::string memo);

    // Admin: add or remove an authorized issuer
    [[eosio::action]]
    void setissuer(name account, bool authorized);

    // Admin: trigger halving if double condition met
    [[eosio::action]]
    void checkhalving();

    // Admin: configure a halving step
    [[eosio::action]]
    void sethalving(uint8_t halving_id, uint64_t seuil_supply_nette,
                    uint32_t plancher_ts_min, uint64_t faucet_rate_new,
                    uint8_t burn_rate_pct, uint8_t farming_rate_pct);

    // Admin: configure emission caps (called by governance or owner)
    [[eosio::action]]
    void setemission(uint64_t cap_daily_total, uint64_t cap_faucet,
                     uint64_t cap_burn, uint64_t cap_farming, uint64_t cap_per_claim);

    // ── Tables ─────────────────────────────────────────────────────────────

    // Token currency stat (scoped by symbol code)
    TABLE currency_s {
        asset    supply;          // current circulating supply
        asset    max_supply;      // hard cap = 100,000,000 ZOT
        name     issuer;          // contract owner (not used for issue auth — see issuers_t)

        uint64_t primary_key() const { return supply.symbol.code().raw(); }
    };
    typedef multi_index<"stat"_n, currency_s> stat_t;

    // Token balances (scoped by account name)
    TABLE account_s {
        asset balance;
        uint64_t primary_key() const { return balance.symbol.code().raw(); }
    };
    typedef multi_index<"accounts"_n, account_s> accounts_t;

    // Authorized issuers (only faucet, burn, farming)
    TABLE issuer_s {
        name account;
        bool authorized;
        uint64_t primary_key() const { return account.value; }
    };
    typedef multi_index<"issuers"_n, issuer_s> issuers_t;

    // Emission caps (singleton) — checked before every issue()
    TABLE emissioncap_s {
        uint64_t cap_daily_total  = 4100000000ULL; // 410,000.0000 ZOT/day
        uint64_t cap_faucet       = 4100000000ULL; // allocated to faucet
        uint64_t cap_burn         = 0;             // 0 = not capped separately
        uint64_t cap_farming      = 0;
        uint64_t cap_per_claim    = 100000;        // 10.0000 ZOT max per claim
        uint64_t faucet_today     = 0;
        uint64_t burn_today       = 0;
        uint64_t farming_today    = 0;
        uint64_t total_today      = 0;
        uint32_t emission_day     = 0;             // epoch / 86400
    };
    typedef singleton<"emissioncap"_n, emissioncap_s> emissioncap_t;

    // Halving configuration steps (v4 — 6 halvings)
    TABLE halving_s {
        uint8_t  halving_id;
        uint64_t seuil_supply_nette;    // trigger when net circulation >= this (ZOT units)
        uint32_t plancher_ts_min;       // minimum seconds since last halving
        uint64_t faucet_rate_new;       // new base faucet reward (ZOT units)
        uint8_t  burn_rate_pct;         // new burn multiplier as % of original
        uint8_t  farming_rate_pct;      // new farming multiplier as % of original
        bool     declenche;             // has this halving been triggered?
        uint32_t declenchement_ts;      // timestamp when triggered (0 = not yet)

        uint64_t primary_key() const { return halving_id; }
    };
    typedef multi_index<"halvingcfg"_n, halving_s> halvingcfg_t;

    // Tracks the most recently triggered halving and net supply
    TABLE halvingstate_s {
        uint8_t  last_halving_id    = 0;
        uint32_t last_halving_ts    = 0;
        uint64_t total_issued       = 0;  // gross cumulative
        uint64_t total_sinks        = 0;  // cumulative sinks (burned/locked ZOT)
    };
    typedef singleton<"halvingstate"_n, halvingstate_s> halvingstate_t;

private:
    void sub_balance(name owner, asset value);
    void add_balance(name owner, asset value, name ram_payer);
    bool is_authorized_issuer(name account);
    uint64_t net_supply(); // total_issued - total_sinks
};
