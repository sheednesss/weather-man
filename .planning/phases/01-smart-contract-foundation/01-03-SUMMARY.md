---
phase: 01-smart-contract-foundation
plan: 03
subsystem: contracts
tags: [deployment, foundry, scripts, base-sepolia]

# Dependency graph
requires: [01-02]
provides:
  - Deployment scripts for testnet and local
  - SimpleConditionalTokens for MVP testing
affects: [phase-2, frontend-integration]

# Tech tracking
tech-stack:
  added: [SimpleConditionalTokens]
  patterns: [forge-script, ERC1155]

key-files:
  created:
    - contracts/script/Deploy.s.sol
    - contracts/script/DeployLocal.s.sol
    - contracts/src/SimpleConditionalTokens.sol
  modified:
    - contracts/foundry.toml

key-decisions:
  - "Testnet deployment deferred - can be done later when wallet is funded"
  - "SimpleConditionalTokens created as MVP alternative to Gnosis CTF"

# Metrics
duration: 3min
completed: 2026-01-28
status: partial
---

# Phase 01 Plan 03: Deployment Scripts Summary

**Deployment scripts created; testnet deployment deferred to later**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-28
- **Completed:** 2026-01-28
- **Tasks:** 1/3 (deployment skipped by user)
- **Files modified:** 4 created

## Accomplishments

- Deploy.s.sol script for Base Sepolia deployment
- DeployLocal.s.sol script for local Anvil testing
- SimpleConditionalTokens.sol as MVP CTF alternative
- foundry.toml updated with etherscan/basescan config

## Task Commits

1. **Task 1: Create deployment script** - `13a711b` (feat)

## Files Created/Modified

- `contracts/script/Deploy.s.sol` - Testnet deployment script with USDC and CTF config
- `contracts/script/DeployLocal.s.sol` - Local Anvil deployment with mocks
- `contracts/src/SimpleConditionalTokens.sol` - Simplified ERC-1155 CTF for MVP
- `contracts/foundry.toml` - Added etherscan config for Base Sepolia verification

## Deferred Work

### Testnet Deployment (User Skipped)

**Reason:** User chose to skip testnet deployment for now
**What's needed to complete:**
1. Create `.env` with PRIVATE_KEY and BASE_SEPOLIA_RPC
2. Fund wallet with Base Sepolia ETH from faucet
3. Run: `cd contracts && forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify`
4. Record deployed addresses in `contracts/deployments/base-sepolia.json`

**Impact:**
- Contracts are fully functional locally (41 tests passing)
- Frontend development can proceed with local Anvil
- Testnet deployment can be done anytime before production

## Next Phase Readiness

- All contracts implemented and tested locally
- Deployment scripts ready for when user wants to deploy
- Phase 2 (Oracle Infrastructure) can proceed with local development
- Frontend can develop against local Anvil deployment

---
*Phase: 01-smart-contract-foundation*
*Completed: 2026-01-28 (partial - deployment deferred)*
