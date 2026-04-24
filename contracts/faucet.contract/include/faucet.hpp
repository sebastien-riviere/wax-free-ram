#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/singleton.hpp>
#include <eosio/crypto.hpp>

using namespace eosio;

// ─── External contracts ────────────────────────────────────────────────────
static constexpr name TOKEN_CONTRACT  = "zot.token"_n;
static constexpr name ATOMIC_CONTRACT = "atomicassets"_n;
static constexpr name ORACLE_CONTRACT = "orng.wax"_n;

// ─── Constants ─────────────────────────────────────────────────────────────
static constexpr uint32_t FAUCET_COOLDOWN_SEC = 86400; // 24h default
static constexpr uint32_t REGEN_SECONDS       = 7200;  // 1 charge / 2h
static constexpr uint8_t  MAX_CHARGES         = 12;

CONTRACT faucet : public contract {
public:
    using contract::contract;

    // ── Actions ────────────────────────────────────────────────────────────

    // User calls daily claim — checks cooldown, computes reward + NFT loot
    [[eosio::action]]
    void claim(name wallet);

    // Initiates WAX RNG oracle request (Epic+ NFT loot)
    [[eosio::action]]
    void requestrand(name wallet, uint64_t assoc_id);

    // Oracle callback — mints NFT based on drop_weights
    [[eosio::action]]
    void receiverand(uint64_t assoc_id, checksum256 random_value);

    // Admin: configure a drop weight entry
    [[eosio::action]]
    void setdropwgt(uint32_t template_id, uint16_t weight, bool actif, uint8_t rng_type);

    // Admin: delete a drop weight entry
    [[eosio::action]]
    void deldropwgt(uint32_t template_id);

    // Admin: set global config
    [[eosio::action]]
    void setconfig(uint32_t cooldown_sec, uint64_t base_reward_units);

    // ── Tables ─────────────────────────────────────────────────────────────

    // Cooldown per wallet
    TABLE cooldown_s {
        name     wallet;
        uint32_t last_claim_ts;   // epoch seconds
        uint64_t nonce;           // incremented each claim (for internal RNG)

        uint64_t primary_key() const { return wallet.value; }
    };
    typedef multi_index<"cooldowns"_n, cooldown_s> cooldowns_t;

    // Pending oracle RNG requests
    TABLE rngqueue_s {
        uint64_t request_id;      // assoc_id sent to oracle
        name     wallet;
        bool     pending;

        uint64_t primary_key()    const { return request_id; }
        uint64_t by_wallet()      const { return wallet.value; }
    };
    typedef multi_index<"rngqueue"_n, rngqueue_s,
        indexed_by<"bywallet"_n, const_mem_fun<rngqueue_s, uint64_t, &rngqueue_s::by_wallet>>
    > rngqueue_t;

    // Drop probability weights (total must equal 10000)
    // rng_type: 0 = internal hash, 1 = WAX oracle
    TABLE dropweight_s {
        uint32_t template_id;
        uint16_t weight;          // out of 10000
        bool     actif;
        uint8_t  rng_type;        // 0=internal 1=oracle

        uint64_t primary_key() const { return template_id; }
    };
    typedef multi_index<"dropweights"_n, dropweight_s> dropweights_t;

    // Global faucet config (singleton)
    TABLE faucetcfg_s {
        uint32_t cooldown_sec      = FAUCET_COOLDOWN_SEC;
        uint64_t base_reward_units = 50000; // 5.0000 ZOT (4 decimals)
    };
    typedef singleton<"faucetcfg"_n, faucetcfg_s> faucetcfg_t;

private:
    // Compute internal pseudo-random value from block + wallet + nonce
    uint64_t pseudo_rand(name wallet, uint64_t nonce);

    // Select template_id from drop_weights using a random value [0, 10000)
    uint32_t roll_drop(uint16_t roll);

    // Issue ZOT reward via inline action to token.contract
    void issue_zot(name to, uint64_t amount_units, std::string memo);
};
