cmake_minimum_required(VERSION 3.16)
project(zotverse_contracts)

# Requires CDT (Contract Development Toolkit) — install via:
#   apt: sudo apt install eosio.cdt
#   or:  https://github.com/AntelopeIO/cdt/releases

find_package(cdt REQUIRED)

# ── Helper macro ─────────────────────────────────────────────────────────────
macro(add_contract CONTRACT_NAME)
    add_contract_target(${CONTRACT_NAME}
        ${CONTRACT_NAME}.contract/src/${CONTRACT_NAME}.cpp
    )
    target_include_directories(${CONTRACT_NAME}
        PUBLIC ${CONTRACT_NAME}.contract/include
    )
endmacro()

# ── Contracts ─────────────────────────────────────────────────────────────────
add_contract(token)
add_contract(faucet)
add_contract(burn)
add_contract(farming)
add_contract(market)
add_contract(vote)
