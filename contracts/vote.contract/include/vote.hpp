#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/singleton.hpp>
#include <vector>

using namespace eosio;

static constexpr name TOKEN_CONTRACT = "zot.token"_n;
static constexpr name BURN_CONTRACT  = "burn.zotverse"_n;
static constexpr symbol ZOT_SYM      = symbol("ZOT", 4);

// Vote weight per Profil rarity (brief v4)
// Common=1, Rare=2, Epic=3, Legendary=5, Pionnier=7
static constexpr uint8_t VOTE_WEIGHTS[] = {1, 2, 3, 5, 7};

// Proposal status
enum class ProposalStatus : uint8_t {
    SUBMISSION = 0,
    VOTING     = 1,
    APPROVED   = 2,
    REJECTED   = 3,
};

CONTRACT vote : public contract {
public:
    using contract::contract;

    // ── Actions ────────────────────────────────────────────────────────────

    // ZOT transfer notification — 50 ZOT submission fee (anti-spam sink)
    [[eosio::on_notify("zot.token::transfer")]]
    void on_zot_transfer(name from, name to, asset quantity, std::string memo);

    // Cast a vote on an active proposal
    [[eosio::action]]
    void castvote(name wallet, uint64_t proposal_id, bool approve);

    // Close a proposal when vote_end_ts has passed
    [[eosio::action]]
    void closevote(uint64_t proposal_id);

    // Admin: activate the vote contract (disabled at MVP)
    [[eosio::action]]
    void setactive(bool active);

    // Admin: configure vote parameters
    [[eosio::action]]
    void setconfig(uint32_t submission_period_sec, uint32_t voting_period_sec,
                   uint8_t approval_threshold_pct, asset submission_fee,
                   uint32_t min_resubmit_cycles);

    // ── Tables ─────────────────────────────────────────────────────────────

    // Proposals
    TABLE proposal_s {
        uint64_t proposal_id;
        name     collection_name;
        name     submitter;
        uint32_t submit_ts;
        uint32_t vote_start_ts;
        uint32_t vote_end_ts;
        uint64_t votes_for;       // weighted vote units
        uint64_t votes_against;   // weighted vote units
        uint8_t  status;          // ProposalStatus enum
        asset    burn_value_proposed; // WAX floor price proposed by submitter
        name     royalty_wallet;
        uint8_t  burn_share_pct;

        uint64_t primary_key()      const { return proposal_id; }
        uint64_t by_collection()    const { return collection_name.value; }
        uint64_t by_status()        const { return status; }
    };
    typedef multi_index<"proposals"_n, proposal_s,
        indexed_by<"bycollection"_n, const_mem_fun<proposal_s, uint64_t, &proposal_s::by_collection>>,
        indexed_by<"bystatus"_n,     const_mem_fun<proposal_s, uint64_t, &proposal_s::by_status>>
    > proposals_t;

    // Individual vote records
    TABLE voterecord_s {
        uint64_t record_id;
        name     wallet;
        uint64_t proposal_id;
        bool     approve;
        uint8_t  weight;          // vote weight (profil rarity based)
        uint32_t voted_ts;

        uint64_t primary_key()    const { return record_id; }
        uint64_t by_wallet()      const { return wallet.value; }
        uint64_t by_proposal()    const { return proposal_id; }

        // Composite index: wallet + proposal — for duplicate vote check
        uint128_t by_wallet_proposal() const {
            return (static_cast<uint128_t>(wallet.value) << 64) | proposal_id;
        }
    };
    typedef multi_index<"voterecords"_n, voterecord_s,
        indexed_by<"bywallet"_n,    const_mem_fun<voterecord_s, uint64_t, &voterecord_s::by_wallet>>,
        indexed_by<"byproposal"_n,  const_mem_fun<voterecord_s, uint64_t, &voterecord_s::by_proposal>>,
        indexed_by<"bywalletprop"_n, const_mem_fun<voterecord_s, uint128_t, &voterecord_s::by_wallet_proposal>>
    > voterecords_t;

    // Global vote config (singleton)
    TABLE votecfg_s {
        bool     active                  = false; // disabled at MVP
        uint32_t submission_period_sec   = 259200;  // 3 days
        uint32_t voting_period_sec       = 604800;  // 7 days
        uint8_t  approval_threshold_pct  = 60;
        asset    submission_fee          = asset(500000, ZOT_SYM); // 50 ZOT
        uint32_t min_resubmit_cycles     = 2;
        uint64_t next_proposal_id        = 1;
        uint64_t next_record_id          = 1;
    };
    typedef singleton<"votecfg"_n, votecfg_s> votecfg_t;

    // Resubmission cooldown tracker (per collection)
    TABLE resubcool_s {
        name     collection_name;
        uint32_t last_rejected_ts;
        uint8_t  rejected_cycles;

        uint64_t primary_key() const { return collection_name.value; }
    };
    typedef multi_index<"resubcool"_n, resubcool_s> resubcool_t;

private:
    // Create a proposal after submission fee payment
    void create_proposal(name submitter, name collection_name,
                         asset burn_value_proposed, name royalty_wallet,
                         uint8_t burn_share_pct);

    // Determine vote weight from submitter's equipped Profil NFT rarity
    uint8_t get_vote_weight(name wallet);

    // Notify burn.contract of approval via inline action
    void notify_burn_approval(const proposal_s& proposal);
};
