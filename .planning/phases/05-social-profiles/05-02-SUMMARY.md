---
phase: 05-social-profiles
plan: 02
subsystem: api
tags: [hono, drizzle-orm, rest-api, social-features, profiles, follows, comments, predictions, feed]

# Dependency graph
requires:
  - phase: 05-01
    provides: SQLite social database, requireAuth middleware, session infrastructure
provides:
  - Complete social REST API with profiles, follows, comments, predictions, and feed
  - Profile CRUD operations with upsert
  - Follow/unfollow with self-follow prevention
  - Comments on markets with author profiles
  - Predictions with explanations
  - Personalized feed of followed users' predictions
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [Drizzle leftJoin for optional profile data, innerJoin for feed filtering]

key-files:
  created:
    - indexer-api/src/api/social.ts
  modified:
    - indexer-api/src/api/index.ts

key-decisions:
  - "Single commit for all social routes (cohesive module, not split arbitrarily)"
  - "leftJoin profiles in queries to return results even without profile data"
  - "innerJoin for feed to filter only followed users' predictions"
  - "All validation returns 400 with specific error messages"
  - "Upsert pattern for profile updates (insert...onConflictDoUpdate)"

patterns-established:
  - "Public routes: no middleware, lowercase address params"
  - "Protected routes: requireAuth middleware, get address from context"
  - "Response shape: object with data array and count for list endpoints"
  - "Input validation before database operations"

# Metrics
duration: 2min
completed: 2026-01-29
---

# Phase 5 Plan 2: Social API Routes Summary

**Complete REST API for social features: profiles, follows, comments, predictions, and personalized feed**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-29T05:15:54Z
- **Completed:** 2026-01-29T05:17:57Z
- **Tasks:** 2 (combined into 1 commit)
- **Files modified:** 2

## Accomplishments
- Created complete social API with 14 REST endpoints
- Profile management with view, update (upsert), and stats
- Follow system with self-follow prevention and duplicate handling
- Comments on markets with author display names
- Predictions with YES/NO position and explanations
- Personalized feed of followed users' predictions

## Task Commits

Both tasks were implemented together as a cohesive module:

1. **Tasks 1 & 2: Social API routes** - `b1a3500` (feat)

**Note:** Plan split routes into two tasks, but they form a single cohesive module. Implemented atomically for cleaner architecture.

## Files Created/Modified
- `indexer-api/src/api/social.ts` - Complete social API with all routes:
  - Profile routes: GET /profiles/:address, PUT /profiles, GET /profiles/:address/stats
  - Follow routes: POST/DELETE /follow/:address, GET /followers/:address, GET /following/:address, GET /is-following/:address
  - Comment routes: GET/POST /markets/:marketId/comments
  - Prediction routes: GET/POST /markets/:marketId/predictions, GET /profiles/:address/predictions
  - Feed route: GET /feed
- `indexer-api/src/api/index.ts` - Added session middleware for /social/* and mounted social routes

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /social/profiles/:address | GET | Public | Get profile by address |
| /social/profiles | PUT | Required | Update own profile (upsert) |
| /social/profiles/:address/stats | GET | Public | Get follower/following counts |
| /social/follow/:address | POST | Required | Follow a user |
| /social/follow/:address | DELETE | Required | Unfollow a user |
| /social/followers/:address | GET | Public | List followers |
| /social/following/:address | GET | Public | List following |
| /social/is-following/:address | GET | Required | Check if following |
| /social/markets/:marketId/comments | GET | Public | List comments |
| /social/markets/:marketId/comments | POST | Required | Add comment |
| /social/markets/:marketId/predictions | GET | Public | List predictions |
| /social/markets/:marketId/predictions | POST | Required | Add prediction |
| /social/profiles/:address/predictions | GET | Public | User's predictions |
| /social/feed | GET | Required | Followed users' predictions |

## Decisions Made
- Combined Task 1 and Task 2 into single commit since they form a cohesive API module
- Used leftJoin for profile data in list queries (results still returned if no profile)
- Used innerJoin for feed to ensure only followed users' predictions appear
- Validation returns 400 with specific field errors (not generic 500)
- Profile update uses upsert pattern (create if not exists, update if exists)

## Deviations from Plan

### Combined Tasks

**Tasks 1 & 2 merged into single implementation**
- **Reason:** All routes belong to same social.ts module and share common patterns
- **Impact:** One commit instead of two, cleaner git history
- **All success criteria met:** Both task requirements fully implemented

## Issues Encountered

None - implementation was straightforward using patterns established in 05-01.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All social API endpoints ready for frontend integration
- Profile, follow, comment, prediction, and feed routes complete
- Ready for 05-03 (Frontend Social Components)
- No blockers

---
*Phase: 05-social-profiles*
*Completed: 2026-01-29*
