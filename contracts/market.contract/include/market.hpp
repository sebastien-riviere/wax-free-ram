#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/singleton.hpp>
#include <vector>

using namespace eosio;

static constexpr name TOKEN_CONTRACT  = "zot.token"_n;
static constexpr name ATOMIC_CONTRACT = "atomicassets"_n;
static constexpr symbol ZOT_SYM       = symbol("ZOT", 4);
static constexpr symbol WAX_SYM       = symbol("WAX", 8);
static constexpr uint8_t FEE_PCT      = 5; // uniform 5% fee on all transactions

// listing_type: 0=drop, 1=pack
enum class ListingType : uint8_t { DROP = 0, PACK = 1 };

CONTRACT market : public contract {
public:
    using contract::contract;

    // ── Actions ────────────────────────────────────────────────────────────

    // User pays ZOT — triggers buydrop / openpack depending on listing type
    [[eosio::on_notify("zot.token::transfer")]]
    void on_zot_transfer(name from, name to, asset quantity, std::string memo);

    // User pays WAX — alternative payment for dual-priced listings
    [[eosio::on_notify("eosio.token::transfer")]]
    void on_wax_transfer(name from, name to, asset quantity, std::string memo);

    // User sends NFTs for blending (AtomicAssets transfer)
    [[eosio::on_notify("atomicassets::transfer")]]
    void on_nft_transfer(name from, name to, std::vector<uint64_t> asset_ids, std::string memo);

    // Admin: create or update a market listing (drop or pack)
    [[eosio::action]]
    void setlisting(uint64_t listing_id, uint8_t type,
                    asset price_zot, asset price_wax,
                    uint64_t max_supply, uint32_t start_ts, uint32_t end_ts,
                    uint32_t output_template_id, uint8_t fee_pct, bool actif);

    // Admin: delete listing
    [[eosio::action]]
    void dellisting(uint64_t listing_id);

    // Admin: configure a pack's slot/weight table
    [[eosio::action]]
    void setpackcfg(uint32_t pack_template_id,
                    std::vector<uint32_t> slot_template_ids,
                    std::vector<uint16_t> weights,
                    std::vector<uint32_t> guaranteed_template_ids);

    // Admin: create or update a blend recipe
    [[eosio::action]]
    void setblend(uint64_t recipe_id,
                  std::vector<uint32_t> input_template_ids,
                  uint32_t output_template_id,
                  asset token_cost);

    // Admin: delete blend recipe
    [[eosio::action]]
    void delblend(uint64_t recipe_id);

    // ── Tables ─────────────────────────────────────────────────────────────

    // Market drops and packs
    TABLE listing_s {
        uint64_t listing_id;
        uint8_t  type;                  // ListingType enum
        asset    price_zot;
        asset    price_wax;             // 0 = ZOT only
        uint64_t max_supply;            // 0 = unlimited
        uint64_t minted_count;
        uint32_t start_ts;              // 0 = immediately active
        uint32_t end_ts;                // 0 = no expiry
        uint32_t output_template_id;    // NFT to mint on purchase
        uint8_t  fee_pct;               // default 5
        bool     actif;

        uint64_t primary_key() const { return listing_id; }
        uint64_t by_template() const { return output_template_id; }
    };
    typedef multi_index<"listings"_n, listing_s,
        indexed_by<"bytemplate"_n, const_mem_fun<listing_s, uint64_t, &listing_s::by_template>>
    > listings_t;

    // Pack slot configuration
    TABLE packcfg_s {
        uint32_t pack_template_id;
        std::vector<uint32_t> slot_template_ids;  // possible outcomes per slot
        std::vector<uint16_t> weights;             // weight per slot (out of 10000)
        std::vector<uint32_t> guaranteed_template_ids; // always included

        uint64_t primary_key() const { return pack_template_id; }
    };
    typedef multi_index<"packcfgs"_n, packcfg_s> packcfgs_t;

    // Blend recipes
    TABLE blend_s {
        uint64_t recipe_id;
        std::vector<uint32_t> input_template_ids;  // required NFT templates
        uint32_t output_template_id;               // NFT minted on success
        asset    token_cost;                       // ZOT cost (sink)

        uint64_t primary_key() const { return recipe_id; }
    };
    typedef multi_index<"blends"_n, blend_s> blends_t;

    // Pending blend intents (NFTs deposited, waiting for token payment)
    TABLE blendbuf_s {
        uint64_t intent_id;
        name     wallet;
        uint64_t recipe_id;
        std::vector<uint64_t> deposited_asset_ids;
        uint32_t created_ts;

        uint64_t primary_key() const { return intent_id; }
        uint64_t by_wallet()   const { return wallet.value; }
    };
    typedef multi_index<"blendbuf"_n, blendbuf_s,
        indexed_by<"bywallet"_n, const_mem_fun<blendbuf_s, uint64_t, &blendbuf_s::by_wallet>>
    > blendbuf_t;

    // Global config singleton
    TABLE mktcfg_s {
        uint64_t next_intent_id = 1;
        name     treasury_account = "zot.treasury"_n;
    };
    typedef singleton<"mktcfg"_n, mktcfg_s> mktcfg_t;

private:
    void process_drop_purchase(name wallet, uint64_t listing_id, asset payment, symbol pay_sym);
    void process_pack_open(name wallet, uint64_t asset_id);
    void process_blend_payment(name wallet, asset zot_quantity, uint64_t recipe_id);
    void handle_blend_nfts(name wallet, std::vector<uint64_t> asset_ids, uint64_t recipe_id);
    void mint_nft(name to, uint32_t template_id, std::string memo);
    void sink_zot(asset quantity, std::string memo);
    asset apply_fee(asset amount); // deducts fee_pct, returns net amount
};
