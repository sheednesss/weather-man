---
phase: 05-social-profiles
plan: 01
subsystem: auth
tags: [siwe, drizzle-orm, sqlite, better-sqlite3, hono-sessions, viem]

# Dependency graph
requires:
  - phase: 03-indexing-backend
    provides: Ponder API server with Hono routes
provides:
  - SQLite social database with profiles, follows, comments, predictions tables
  - SIWE authentication with nonce/verify/session/logout endpoints
  - requireAuth middleware for protected routes
  - CORS configuration for frontend credentials
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: [siwe, drizzle-orm, better-sqlite3, hono-sessions, drizzle-kit]
  patterns: [SIWE wallet authentication, Drizzle ORM for social data, encrypted cookie sessions]

key-files:
  created:
    - indexer-api/src/social/schema.ts
    - indexer-api/src/social/db.ts
    - indexer-api/src/social/middleware.ts
    - indexer-api/src/api/auth.ts
    - indexer-api/drizzle.config.ts
  modified:
    - indexer-api/src/api/index.ts
    - indexer-api/package.json
    - indexer-api/.env.example

key-decisions:
  - "Drizzle ORM over raw SQL for type-safe queries and schema management"
  - "SQLite via better-sqlite3 for simple social data (separate from Ponder's internal DB)"
  - "SIWE with viem verifyMessage for signature verification (already available from Ponder)"
  - "Encrypted cookie sessions via hono-sessions for stateless auth"
  - "All addresses stored lowercase for consistency"

patterns-established:
  - "SIWE auth flow: nonce -> sign message -> verify -> session"
  - "requireAuth middleware pattern for protected routes"
  - "Social data separate from indexed blockchain data"

# Metrics
duration: 5min
completed: 2026-01-29
---

# Phase 5 Plan 1: Database & Auth Foundation Summary

**SQLite social database with Drizzle ORM and SIWE wallet authentication via encrypted cookie sessions**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-29T05:06:25Z
- **Completed:** 2026-01-29T05:11:57Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created SQLite database with profiles, follows, comments, predictions tables
- Implemented SIWE authentication with nonce generation and signature verification
- Added requireAuth middleware for protecting routes
- Configured CORS to allow credentials from frontend

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create social database schema** - `0788533` (feat)
2. **Task 2: Implement SIWE authentication routes** - `d311c74` (feat)

## Files Created/Modified
- `indexer-api/src/social/schema.ts` - Drizzle schema for profiles, follows, comments, predictions
- `indexer-api/src/social/db.ts` - Drizzle database instance with better-sqlite3
- `indexer-api/src/social/middleware.ts` - requireAuth middleware for protected routes
- `indexer-api/src/api/auth.ts` - SIWE auth routes (nonce, verify, session, logout)
- `indexer-api/drizzle.config.ts` - Drizzle-kit configuration for migrations
- `indexer-api/src/api/index.ts` - Added CORS and auth route mounting
- `indexer-api/package.json` - Added siwe, drizzle-orm, better-sqlite3, hono-sessions
- `indexer-api/.env.example` - Added SESSION_SECRET documentation

## Decisions Made
- Used Drizzle ORM for type-safe queries and easy schema management
- Chose SQLite (better-sqlite3) for simplicity - social data is low-volume and read-heavy
- Used viem's verifyMessage from Ponder dependencies for SIWE signature verification
- Stored sessions in encrypted cookies for stateless server (no session store needed)
- All Ethereum addresses normalized to lowercase for consistent lookups

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- better-sqlite3 requires Node 20+ (prebuilt binaries not available for Node 18)
- Used fnm to switch to Node 20.20.0 which was already installed from Phase 3
- Pre-existing TypeScript errors in ponder.config.ts (unrelated to this plan, Ponder still runs)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Social database ready for profile and follow operations
- Auth endpoints ready for frontend integration
- requireAuth middleware ready for protected routes in upcoming plans
- No blockers for plan 05-02 (Profile API)

---
*Phase: 05-social-profiles*
*Completed: 2026-01-29*
