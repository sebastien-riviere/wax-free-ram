#include <vote.hpp>

// ── on_zot_transfer ────────────────────────────────────────────────────────
// Memo: "submit:<collection_name>:<royalty_wallet>:<burn_share_pct>"
void vote::on_zot_transfer(name from, name to, asset quantity, std::string memo) {
    if (to != get_self()) return;
    if (from == get_self()) return;

    votecfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    check(cfg.active, "Vote contract is not active yet (post-MVP)");
    check(quantity.symbol == ZOT_SYM && quantity.amount > 0, "Invalid payment");

    if (memo.rfind("submit:", 0) != 0) return; // not a submission — ZOT is sunk

    // Parse memo: "submit:<collection>:<royalty_wallet>:<burn_share_pct>"
    std::string params = memo.substr(7);
    size_t p1 = params.find(':');
    size_t p2 = params.find(':', p1 + 1);
    check(p1 != std::string::npos && p2 != std::string::npos, "Invalid memo format");

    name     collection_name  = name(params.substr(0, p1));
    name     royalty_wallet   = name(params.substr(p1 + 1, p2 - p1 - 1));
    uint8_t  burn_share_pct   = static_cast<uint8_t>(std::stoul(params.substr(p2 + 1)));

    check(quantity >= cfg.submission_fee, "Submission fee insufficient (50 ZOT)");
    check(burn_share_pct <= 20, "burn_share_pct max 20%");

    // ZOT submission_fee stays in contract — permanent sink
    create_proposal(from, collection_name, asset(0, symbol("WAX", 8)),
                    royalty_wallet, burn_share_pct);
}

// ── castvote ───────────────────────────────────────────────────────────────
ACTION vote::castvote(name wallet, uint64_t proposal_id, bool approve) {
    require_auth(wallet);

    votecfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    check(cfg.active, "Vote contract not active");

    proposals_t prop_tbl(get_self(), get_self().value);
    auto prop_itr = prop_tbl.require_find(proposal_id, "Proposal not found");
    check(prop_itr->status == static_cast<uint8_t>(ProposalStatus::VOTING),
          "Proposal not in voting phase");

    uint32_t now_sec = current_time_point().sec_since_epoch();
    check(now_sec <= prop_itr->vote_end_ts, "Voting period has ended");
    check(now_sec >= prop_itr->vote_start_ts, "Voting not started");

    // Check duplicate vote
    voterecords_t vr_tbl(get_self(), get_self().value);
    auto wp_idx = vr_tbl.get_index<"bywalletprop"_n>();
    uint128_t key = (static_cast<uint128_t>(wallet.value) << 64) | proposal_id;
    check(wp_idx.find(key) == wp_idx.end(), "Already voted on this proposal");

    uint8_t weight = get_vote_weight(wallet);

    // Record vote
    vr_tbl.emplace(get_self(), [&](auto& row) {
        row.record_id   = cfg.next_record_id++;
        row.wallet      = wallet;
        row.proposal_id = proposal_id;
        row.approve     = approve;
        row.weight      = weight;
        row.voted_ts    = now_sec;
    });
    cfg_tbl.set(cfg, get_self());

    // Update tally
    prop_tbl.modify(prop_itr, get_self(), [&](auto& row) {
        if (approve) row.votes_for     += weight;
        else         row.votes_against += weight;
    });
}

// ── closevote ──────────────────────────────────────────────────────────────
ACTION vote::closevote(uint64_t proposal_id) {
    // No auth required — anyone can close an expired vote
    votecfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    check(cfg.active, "Vote contract not active");

    proposals_t prop_tbl(get_self(), get_self().value);
    auto prop_itr = prop_tbl.require_find(proposal_id, "Proposal not found");
    check(prop_itr->status == static_cast<uint8_t>(ProposalStatus::VOTING),
          "Not in voting phase");

    uint32_t now_sec = current_time_point().sec_since_epoch();
    check(now_sec > prop_itr->vote_end_ts, "Voting period not over");

    uint64_t total_weight = prop_itr->votes_for + prop_itr->votes_against;
    bool approved = (total_weight > 0) &&
                    (prop_itr->votes_for * 100 / total_weight >= cfg.approval_threshold_pct);

    if (approved) {
        prop_tbl.modify(prop_itr, get_self(), [&](auto& row) {
            row.status = static_cast<uint8_t>(ProposalStatus::APPROVED);
        });
        // Notify burn.contract to activate the collection
        notify_burn_approval(*prop_itr);
    } else {
        prop_tbl.modify(prop_itr, get_self(), [&](auto& row) {
            row.status = static_cast<uint8_t>(ProposalStatus::REJECTED);
        });
        // Track resubmission cooldown
        resubcool_t rc_tbl(get_self(), get_self().value);
        auto rc_itr = rc_tbl.find(prop_itr->collection_name.value);
        if (rc_itr == rc_tbl.end()) {
            rc_tbl.emplace(get_self(), [&](auto& row) {
                row.collection_name   = prop_itr->collection_name;
                row.last_rejected_ts  = now_sec;
                row.rejected_cycles   = 1;
            });
        } else {
            rc_tbl.modify(rc_itr, get_self(), [&](auto& row) {
                row.last_rejected_ts = now_sec;
                row.rejected_cycles++;
            });
        }
    }
}

// ── setactive ──────────────────────────────────────────────────────────────
ACTION vote::setactive(bool active) {
    require_auth(get_self());
    votecfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    cfg.active = active;
    cfg_tbl.set(cfg, get_self());
}

// ── setconfig ──────────────────────────────────────────────────────────────
ACTION vote::setconfig(uint32_t submission_period_sec, uint32_t voting_period_sec,
                       uint8_t approval_threshold_pct, asset submission_fee,
                       uint32_t min_resubmit_cycles) {
    require_auth(get_self());
    check(approval_threshold_pct <= 100, "Threshold must be <= 100");
    check(submission_fee.symbol == ZOT_SYM && submission_fee.amount > 0, "Invalid fee");

    votecfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();
    cfg.submission_period_sec  = submission_period_sec;
    cfg.voting_period_sec      = voting_period_sec;
    cfg.approval_threshold_pct = approval_threshold_pct;
    cfg.submission_fee         = submission_fee;
    cfg.min_resubmit_cycles    = min_resubmit_cycles;
    cfg_tbl.set(cfg, get_self());
}

// ── Helpers ────────────────────────────────────────────────────────────────
void vote::create_proposal(name submitter, name collection_name,
                           asset burn_value_proposed, name royalty_wallet,
                           uint8_t burn_share_pct) {
    votecfg_t cfg_tbl(get_self(), get_self().value);
    auto cfg = cfg_tbl.get_or_default();

    uint32_t now_sec = current_time_point().sec_since_epoch();

    // Enforce minimum resubmit delay if collection was previously rejected
    resubcool_t rc_tbl(get_self(), get_self().value);
    auto rc_itr = rc_tbl.find(collection_name.value);
    if (rc_itr != rc_tbl.end()) {
        // Approximate cycle = submission + voting period
        uint32_t cycle_sec = cfg.submission_period_sec + cfg.voting_period_sec;
        uint32_t min_wait  = cycle_sec * cfg.min_resubmit_cycles;
        check(now_sec >= rc_itr->last_rejected_ts + min_wait,
              "Collection must wait minimum 2 cycles before resubmission");
    }

    proposals_t prop_tbl(get_self(), get_self().value);
    uint32_t vote_start = now_sec + cfg.submission_period_sec;
    uint32_t vote_end   = vote_start + cfg.voting_period_sec;

    prop_tbl.emplace(get_self(), [&](auto& row) {
        row.proposal_id         = cfg.next_proposal_id++;
        row.collection_name     = collection_name;
        row.submitter           = submitter;
        row.submit_ts           = now_sec;
        row.vote_start_ts       = vote_start;
        row.vote_end_ts         = vote_end;
        row.votes_for           = 0;
        row.votes_against       = 0;
        row.status              = static_cast<uint8_t>(ProposalStatus::SUBMISSION);
        row.burn_value_proposed = burn_value_proposed;
        row.royalty_wallet      = royalty_wallet;
        row.burn_share_pct      = burn_share_pct;
    });

    cfg_tbl.set(cfg, get_self());
}

uint8_t vote::get_vote_weight(name wallet) {
    // TODO: query atomicassets to find equipped NFT Profil rarity for this wallet
    // Rarity → weight: Common=1, Rare=2, Epic=3, Legendary=5, Pionnier=7
    // Return 1 (Common default) until AtomicAssets integration is complete
    return 1;
}

void vote::notify_burn_approval(const proposal_s& proposal) {
    action(
        permission_level{get_self(), "active"_n},
        BURN_CONTRACT,
        "approvecol"_n,
        std::make_tuple(
            proposal.collection_name,
            proposal.royalty_wallet,
            proposal.burn_value_proposed,
            proposal.burn_share_pct
        )
    ).send();
}

EOSIO_DISPATCH(vote, (castvote)(closevote)(setactive)(setconfig))
