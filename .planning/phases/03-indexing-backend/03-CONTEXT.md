# Phase 3: Indexing & Backend - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the backend infrastructure that connects the smart contracts to the frontend. This includes:
- Event indexer to track on-chain market activity
- GraphQL API for querying markets, positions, and pricing
- Weather data service integration for current conditions and forecasts
- Market ranking/sorting capabilities (hot markets, volume)

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User has delegated all implementation decisions to Claude. The researcher and planner should make reasonable choices based on:

**API Design:**
- GraphQL schema structure
- Query patterns and pagination approach
- Real-time updates strategy (subscriptions vs polling)
- Authentication/authorization if needed

**Market Ordering & Filtering:**
- How to calculate "hot markets" ranking (volume, activity, recency)
- What sorting and filtering options to expose
- Default ordering for market lists

**Weather Data Integration:**
- How to cache weather data (freshness vs API rate limits)
- How to associate weather with markets (via CityLib coordinates)
- Whether to proxy weather APIs or fetch client-side

**Indexer Architecture:**
- Which chain events to index (MarketCreated, trades, resolutions)
- Data freshness requirements
- Historical data depth
- Database/storage choice

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

Use established patterns for prediction market backends. The oracle service already has weather API clients that can be reused or referenced.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-indexing-backend*
*Context gathered: 2026-01-28*
