#include <market.hpp>

// ── on_zot_transfer ────────────────────────────────────────────────────────
void market::on_zot_transfer(name from, name to, asset quantity, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return;
    check(quantity.symbol == ZOT_SYM && quantity.amount > 0, "Invalid ZOT payment");

    // Memo formats:
    //   "buy:<listing_id>"      → drop purchase
    //   "blend:<recipe_id>"     → finalize blend (NFTs must already be deposited)
    if (memo.rfind("buy:", 0) == 0) {
        uint64_t listing_id = std::stoull(memo.substr(4));
        process_drop_purchase(from, listing_id, quantity, ZOT_SYM);
    } else if (memo.rfind("blend:", 0) == 0) {
        uint64_t recipe_id = std::stoull(memo.substr(6));
        process_blend_payment(from, quantity, recipe_id);
    }
    // All other ZOT → sink (stays in contract)
}

// ── on_wax_transfer ────────────────────────────────────────────────────────
void market::on_wax_transfer(name from, name to, asset quantity, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return;
    check(quantity.symbol == WAX_SYM && quantity.amount > 0, "Invalid WAX payment");

    // Only "buy:<listing_id>" supported for WAX
    if (memo.rfind("buy:", 0) == 0) {
        uint64_t listing_id = std::stoull(memo.substr(4));
        process_drop_purchase(from, listing_id, quantity, WAX_SYM);
    }
}

// ── on_nft_transfer ────────────────────────────────────────────────────────
void market::on_nft_transfer(name from, name to, std::vector<uint64_t> asset_ids, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return;

    // Memo: "open" → pack open | "blend:<recipe_id>" → blend deposit
    if (memo == "open") {
        check(asset_ids.size() == 1, "Open one pack at a time");
        process_pack_open(from, asset_ids[0]);
    } else if (memo.rfind("blend:", 0) == 0) {
        uint64_t recipe_id = std::stoull(memo.substr(6));
        handle_blend_nfts(from, asset_ids, recipe_id);
    } else {
        check(false, "Unknown memo for NFT transfer");
    }
}

// ── process_drop_purchase ──────────────────────────────────────────────────
void market::process_drop_purchase(name wallet, uint64_t listing_id, asset payment, symbol pay_sym) {
    listings_t lst_tbl(get_self(), get_self().value);
    auto lst_itr = lst_tbl.require_find(listing_id, "Listing not found");

    check(lst_itr->actif, "Listing inactive");
    check(lst_itr->type == static_cast<uint8_t>(ListingType::DROP), "Not a drop");

    uint32_t now_sec = current_time_point().sec_since_epoch();
    if (lst_itr->start_ts > 0) check(now_sec >= lst_itr->start_ts, "Drop not started");
    if (lst_itr->end_ts > 0)   check(now_sec <= lst_itr->end_ts, "Drop expired");
    if (lst_itr->max_supply > 0)
        check(lst_itr->minted_count < lst_itr->max_supply, "Sold out");

    // Verify payment matches expected price
    if (pay_sym == ZOT_SYM) {
        check(payment >= lst_itr->price_zot, "Insufficient ZOT");
    } else {
        check(lst_itr->price_wax.amount > 0, "WAX payment not accepted for this drop");
        check(payment >= lst_itr->price_wax, "Insufficient WAX");
    }

    // ZOT payments are sinks — WAX payments go to treasury
    if (pay_sym == WAX_SYM) {
        mktcfg_t cfg_tbl(get_self(), get_self().value);
        auto cfg = cfg_tbl.get_or_default();
        action(
            permission_level{get_self(), "active"_n},
            "eosio.token"_n, "transfer"_n,
            std::make_tuple(get_self(), cfg.treasury_account, payment,
                            std::string("market WAX revenue"))
        ).send();
    }
    // ZOT stays in contract (burn sink)

    lst_tbl.modify(lst_itr, get_self(), [&](auto& row) {
        row.minted_count++;
    });

    mint_nft(wallet, lst_itr->output_template_id, "ZOTVERSE drop");
}

// ── process_pack_open ──────────────────────────────────────────────────────
void market::process_pack_open(name wallet, uint64_t asset_id) {
    // TODO: fetch template_id from atomicassets for this asset_id
    uint32_t pack_template_id = 0; // placeholder

    packcfgs_t pc_tbl(get_self(), get_self().value);
    auto pc_itr = pc_tbl.require_find(pack_template_id, "Pack config not found");

    // Mint guaranteed NFTs
    for (uint32_t tid : pc_itr->guaranteed_template_ids) {
        mint_nft(wallet, tid, "ZOTVERSE pack open guaranteed");
    }

    // Roll for slot outcomes (internal pseudo-RNG — TODO: oracle for rare+)
    // Simplified: mint first slot_template_id
    if (!pc_itr->slot_template_ids.empty()) {
        mint_nft(wallet, pc_itr->slot_template_ids[0], "ZOTVERSE pack open slot");
    }

    // Burn pack NFT
    // action(..., ATOMIC_CONTRACT, "burnasset"_n, ...).send();
}

// ── process_blend_payment ──────────────────────────────────────────────────
void market::process_blend_payment(name wallet, asset zot_quantity, uint64_t recipe_id) {
    blends_t bl_tbl(get_self(), get_self().value);
    auto bl_itr = bl_tbl.require_find(recipe_id, "Blend recipe not found");

    check(zot_quantity >= bl_itr->token_cost, "Insufficient ZOT for blend");

    // Find pending blend intent for this wallet + recipe
    blendbuf_t buf_tbl(get_self(), get_self().value);
    auto wallet_idx = buf_tbl.get_index<"bywallet"_n>();
    auto buf_itr = wallet_idx.lower_bound(wallet.value);

    while (buf_itr != wallet_idx.upper_bound(wallet.value) &&
           buf_itr->recipe_id != recipe_id) {
        ++buf_itr;
    }
    check(buf_itr != wallet_idx.upper_bound(wallet.value), "No pending blend intent");

    check(buf_itr->deposited_asset_ids.size() == bl_itr->input_template_ids.size(),
          "Wrong number of NFTs deposited");

    // Burn all input NFTs
    for (uint64_t aid : buf_itr->deposited_asset_ids) {
        // action(..., ATOMIC_CONTRACT, "burnasset"_n, ...).send();
        (void)aid;
    }

    // Mint output NFT
    mint_nft(wallet, bl_itr->output_template_id, "ZOTVERSE blend output");

    // ZOT token_cost stays in contract (sink)
    wallet_idx.erase(buf_itr);
}

// ── handle_blend_nfts ──────────────────────────────────────────────────────
void market::handle_blend_nfts(name wallet, std::vector<uint64_t> asset_ids, uint64_t recipe_id) {
    blends_t bl_tbl(get_self(), get_self().value);
    auto bl_itr = bl_tbl.require_find(recipe_id, "Blend recipe not found");

    check(asset_ids.size() == bl_itr->input_template_ids.size(),
          "Wrong number of NFTs for recipe");

    // TODO: verify template IDs match recipe requirements via atomicassets lookup

    mktcfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();

    blendbuf_t buf_tbl(get_self(), get_self().value);
    buf_tbl.emplace(get_self(), [&](auto& row) {
        row.intent_id          = cfg.next_intent_id++;
        row.wallet             = wallet;
        row.recipe_id          = recipe_id;
        row.deposited_asset_ids = asset_ids;
        row.created_ts         = current_time_point().sec_since_epoch();
    });

    cfg_tbl.set(cfg, get_self());
}

// ── Admin actions ──────────────────────────────────────────────────────────
ACTION market::setlisting(uint64_t listing_id, uint8_t type,
                          asset price_zot, asset price_wax,
                          uint64_t max_supply, uint32_t start_ts, uint32_t end_ts,
                          uint32_t output_template_id, uint8_t fee_pct, bool actif) {
    require_auth(get_self());
    listings_t lst_tbl(get_self(), get_self().value);
    auto itr = lst_tbl.find(listing_id);
    if (itr == lst_tbl.end()) {
        lst_tbl.emplace(get_self(), [&](auto& row) {
            row.listing_id          = listing_id;
            row.type                = type;
            row.price_zot           = price_zot;
            row.price_wax           = price_wax;
            row.max_supply          = max_supply;
            row.minted_count        = 0;
            row.start_ts            = start_ts;
            row.end_ts              = end_ts;
            row.output_template_id  = output_template_id;
            row.fee_pct             = fee_pct;
            row.actif               = actif;
        });
    } else {
        lst_tbl.modify(itr, get_self(), [&](auto& row) {
            row.price_zot           = price_zot;
            row.price_wax           = price_wax;
            row.max_supply          = max_supply;
            row.start_ts            = start_ts;
            row.end_ts              = end_ts;
            row.output_template_id  = output_template_id;
            row.fee_pct             = fee_pct;
            row.actif               = actif;
        });
    }
}

ACTION market::dellisting(uint64_t listing_id) {
    require_auth(get_self());
    listings_t lst_tbl(get_self(), get_self().value);
    lst_tbl.erase(lst_tbl.require_find(listing_id, "Listing not found"));
}

ACTION market::setpackcfg(uint32_t pack_template_id,
                          std::vector<uint32_t> slot_template_ids,
                          std::vector<uint16_t> weights,
                          std::vector<uint32_t> guaranteed_template_ids) {
    require_auth(get_self());
    check(slot_template_ids.size() == weights.size(), "slots/weights size mismatch");

    packcfgs_t pc_tbl(get_self(), get_self().value);
    auto itr = pc_tbl.find(pack_template_id);
    if (itr == pc_tbl.end()) {
        pc_tbl.emplace(get_self(), [&](auto& row) {
            row.pack_template_id           = pack_template_id;
            row.slot_template_ids          = slot_template_ids;
            row.weights                    = weights;
            row.guaranteed_template_ids    = guaranteed_template_ids;
        });
    } else {
        pc_tbl.modify(itr, get_self(), [&](auto& row) {
            row.slot_template_ids       = slot_template_ids;
            row.weights                 = weights;
            row.guaranteed_template_ids = guaranteed_template_ids;
        });
    }
}

ACTION market::setblend(uint64_t recipe_id, std::vector<uint32_t> input_template_ids,
                        uint32_t output_template_id, asset token_cost) {
    require_auth(get_self());
    check(token_cost.symbol == ZOT_SYM && token_cost.amount > 0, "Invalid token cost");
    check(!input_template_ids.empty(), "No inputs defined");

    blends_t bl_tbl(get_self(), get_self().value);
    auto itr = bl_tbl.find(recipe_id);
    if (itr == bl_tbl.end()) {
        bl_tbl.emplace(get_self(), [&](auto& row) {
            row.recipe_id           = recipe_id;
            row.input_template_ids  = input_template_ids;
            row.output_template_id  = output_template_id;
            row.token_cost          = token_cost;
        });
    } else {
        bl_tbl.modify(itr, get_self(), [&](auto& row) {
            row.input_template_ids  = input_template_ids;
            row.output_template_id  = output_template_id;
            row.token_cost          = token_cost;
        });
    }
}

ACTION market::delblend(uint64_t recipe_id) {
    require_auth(get_self());
    blends_t bl_tbl(get_self(), get_self().value);
    bl_tbl.erase(bl_tbl.require_find(recipe_id, "Recipe not found"));
}

// ── Helpers ────────────────────────────────────────────────────────────────
void market::mint_nft(name to, uint32_t template_id, std::string memo) {
    // Inline mintasset call to atomicassets
    // Requires this contract to be authorized as minter for the collection
    // action(permission_level{get_self(), "active"_n}, ATOMIC_CONTRACT, "mintasset"_n,
    //   std::make_tuple(get_self(), collection_name, schema_name, template_id,
    //                   to, immutable_data, mutable_data, tokens_to_back)).send();
    (void)to; (void)template_id; (void)memo; // TODO
}

void market::sink_zot(asset quantity, std::string memo) {
    // ZOT stays in contract — permanently locked (burn sink)
    (void)quantity; (void)memo;
}

asset market::apply_fee(asset amount) {
    int64_t fee = amount.amount * FEE_PCT / 100;
    return asset(amount.amount - fee, amount.symbol);
}

EOSIO_DISPATCH(market, (setlisting)(dellisting)(setpackcfg)(setblend)(delblend))
