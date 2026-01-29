# Phase 5: Social & Profiles - Research

**Researched:** 2026-01-28
**Domain:** Web3 Social Features, Off-chain Data Storage, Wallet Authentication
**Confidence:** MEDIUM

## Summary

This phase adds social features to a Web3 prediction markets app: user profiles, follow relationships, comments, and social sharing. The primary challenge is that Ponder (the existing indexer) is designed for on-chain data only and provides read-only database access in API routes. Social features require writeable off-chain storage.

The recommended architecture is a **hybrid approach**: keep Ponder for on-chain market/trade data, add a separate SQLite database (via Drizzle ORM) for off-chain social data, and use Sign-In With Ethereum (SIWE) for authentication. This pattern is well-established in Web3 applications where gas costs make on-chain social storage impractical.

**Primary recommendation:** Add a separate SQLite database with Drizzle ORM for social features (profiles, follows, comments) alongside the existing Ponder indexer, with SIWE authentication via the `siwe` package and `hono-sessions` for session management.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| siwe | 3.0.0 | Sign-In With Ethereum (EIP-4361) | Official reference implementation from SpruceID, 71k weekly downloads |
| drizzle-orm | latest | Type-safe ORM for social data | Already used internally by Ponder, consistent patterns |
| better-sqlite3 | 12.6.2 | SQLite driver for Node.js | Fastest SQLite library for Node.js, synchronous API |
| hono-sessions | latest | Cookie-based session management | Purpose-built for Hono, supports encrypted cookies |
| react-share | 5.2.2 | Social sharing buttons | Tree-shakeable, no external scripts, supports X/Twitter |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | latest | Migration tooling | Schema changes, development |
| viem | existing | Signature verification | Backend SIWE verification |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SQLite + Drizzle | Supabase | External service, more features but vendor lock-in |
| SQLite + Drizzle | Postgres | More setup, better for large-scale but overkill for MVP |
| siwe | @web3modal/siwe | Tied to specific wallet modal |
| hono-sessions | JWT tokens | Stateless but nonces harder to track |

**Installation:**
```bash
# In indexer-api directory
npm install siwe drizzle-orm better-sqlite3 hono-sessions
npm install -D drizzle-kit @types/better-sqlite3

# In web directory
npm install react-share
```

## Architecture Patterns

### Recommended Project Structure

Extend the existing structure to add social features:

```
indexer-api/
├── ponder.schema.ts          # Existing: on-chain tables (markets, trades, positions)
├── src/
│   ├── api/
│   │   ├── index.ts          # Existing: Hono app with GraphQL
│   │   ├── auth.ts           # NEW: SIWE auth routes
│   │   └── social.ts         # NEW: Social feature routes
│   └── social/
│       ├── db.ts             # NEW: Drizzle instance for social DB
│       ├── schema.ts         # NEW: Social tables (profiles, follows, comments)
│       └── middleware.ts     # NEW: Auth middleware

web/
├── src/
│   ├── features/
│   │   ├── social/           # NEW: Social feature components
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── FollowButton.tsx
│   │   │   ├── FollowerList.tsx
│   │   │   ├── CommentList.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── ShareButton.tsx
│   │   └── auth/             # NEW: Auth components
│   │       └── SignInButton.tsx
│   ├── hooks/
│   │   ├── useAuth.ts        # NEW: SIWE authentication
│   │   ├── useProfile.ts     # NEW: Profile CRUD
│   │   ├── useFollow.ts      # NEW: Follow/unfollow
│   │   └── useComments.ts    # NEW: Comments
│   └── lib/
│       └── api.ts            # NEW: Social API client
```

### Pattern 1: Dual Database Architecture

**What:** Ponder manages on-chain data (read-only in API), separate SQLite handles social data (read-write)

**When to use:** When you need writeable off-chain storage alongside Ponder's indexed on-chain data

**Example:**
```typescript
// src/social/db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('social.db');
export const socialDb = drizzle(sqlite, { schema });

// src/social/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  address: text('address').primaryKey(),  // Wallet address (lowercase)
  displayName: text('display_name'),
  bio: text('bio'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const follows = sqliteTable('follows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  followerAddress: text('follower_address').notNull(),
  followingAddress: text('following_address').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  marketId: text('market_id').notNull(),  // Links to Ponder market
  authorAddress: text('author_address').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const predictions = sqliteTable('predictions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  marketId: text('market_id').notNull(),
  authorAddress: text('author_address').notNull(),
  explanation: text('explanation').notNull(),  // PREDICT-01
  isYes: integer('is_yes', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### Pattern 2: SIWE Authentication Flow

**What:** Sign-In With Ethereum for wallet-based authentication

**When to use:** Any authenticated API endpoint

**Example:**
```typescript
// src/api/auth.ts
import { Hono } from 'hono';
import { SiweMessage, generateNonce } from 'siwe';
import { sessionMiddleware, CookieStore } from 'hono-sessions';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const auth = new Hono();

// Session middleware
auth.use('*', sessionMiddleware({
  store: new CookieStore(),
  encryptionKey: process.env.SESSION_SECRET!, // Must be 32+ chars
  expireAfterSeconds: 86400, // 24 hours
  cookieOptions: {
    sameSite: 'Lax',
    path: '/',
    httpOnly: true,
  },
}));

// Get nonce for SIWE message
auth.get('/nonce', (c) => {
  const session = c.get('session');
  const nonce = generateNonce();
  session.set('nonce', nonce);
  return c.json({ nonce });
});

// Verify signature and create session
auth.post('/verify', async (c) => {
  const session = c.get('session');
  const { message, signature } = await c.req.json();

  const siweMessage = new SiweMessage(message);
  const storedNonce = session.get('nonce');

  // Verify nonce matches
  if (siweMessage.nonce !== storedNonce) {
    return c.json({ error: 'Invalid nonce' }, 401);
  }

  // Verify signature
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  const valid = await client.verifyMessage({
    address: siweMessage.address as `0x${string}`,
    message: message,
    signature: signature as `0x${string}`,
  });

  if (!valid) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Create session
  session.set('address', siweMessage.address.toLowerCase());
  session.forget('nonce'); // Prevent nonce reuse

  return c.json({ address: siweMessage.address });
});

// Get current session
auth.get('/session', (c) => {
  const session = c.get('session');
  const address = session.get('address');
  return c.json({ address: address || null });
});

// Logout
auth.post('/logout', (c) => {
  const session = c.get('session');
  session.forget('address');
  return c.json({ success: true });
});

export default auth;
```

### Pattern 3: Frontend SIWE Hook

**What:** React hook for wallet authentication with SIWE

**When to use:** Components that need authenticated user state

**Example:**
```typescript
// src/hooks/useAuth.ts
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = 'http://localhost:42069';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();

  // Check current session
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/auth/session`, { credentials: 'include' });
      return res.json();
    },
  });

  // Sign in mutation
  const signIn = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Not connected');

      // Get nonce
      const nonceRes = await fetch(`${API_URL}/auth/nonce`, { credentials: 'include' });
      const { nonce } = await nonceRes.json();

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Weather Man',
        uri: window.location.origin,
        version: '1',
        chainId: 84532, // Base Sepolia
        nonce,
      });
      const messageString = message.prepareMessage();

      // Sign message
      const signature = await signMessageAsync({ message: messageString });

      // Verify on backend
      const verifyRes = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageString, signature }),
      });

      if (!verifyRes.ok) throw new Error('Verification failed');
      return verifyRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
  });

  // Sign out mutation
  const signOut = useMutation({
    mutationFn: async () => {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
  });

  return {
    isConnected,
    isAuthenticated: !!session?.address,
    address: session?.address,
    signIn: signIn.mutate,
    signOut: signOut.mutate,
    isSigningIn: signIn.isPending,
  };
}
```

### Pattern 4: Twitter/X Share Integration

**What:** Share predictions to Twitter/X using web intents

**When to use:** SOCIAL-04 requirement

**Example:**
```typescript
// src/features/social/ShareButton.tsx
import { TwitterShareButton, XIcon } from 'react-share';

interface SharePredictionProps {
  marketQuestion: string;
  prediction: 'YES' | 'NO';
  explanation?: string;
  marketUrl: string;
}

export function SharePrediction({
  marketQuestion,
  prediction,
  explanation,
  marketUrl
}: SharePredictionProps) {
  const shareText = explanation
    ? `My prediction: ${prediction} on "${marketQuestion}"\n\n${explanation}`
    : `I predicted ${prediction} on "${marketQuestion}"`;

  return (
    <TwitterShareButton
      url={marketUrl}
      title={shareText}
      hashtags={['WeatherMan', 'PredictionMarkets']}
    >
      <XIcon size={32} round />
    </TwitterShareButton>
  );
}

// Alternative: Simple URL-based approach (no library needed)
export function shareToTwitter(text: string, url: string) {
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(tweetUrl, '_blank', 'width=550,height=420');
}
```

### Anti-Patterns to Avoid

- **Storing social data on-chain:** Gas costs make this impractical. Comments, follows, and profiles belong off-chain.
- **Using Ponder's database for writes:** Ponder provides read-only access in API routes. Use a separate database.
- **Skipping nonce verification:** Critical for SIWE security. Always generate server-side nonces and validate them.
- **Storing passwords or secrets:** Web3 auth uses signatures, not passwords. Never ask for private keys.
- **Case-sensitive address comparison:** Always lowercase addresses before storing/comparing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wallet authentication | Custom signature verification | siwe package | EIP-4361 compliance, edge cases handled |
| Session management | Custom cookie handling | hono-sessions | Encryption, expiration, security defaults |
| Database migrations | Raw SQL migrations | drizzle-kit | Type safety, rollback support |
| Social sharing | Custom Twitter API integration | react-share or URL intents | No API keys needed, just works |
| SIWE message format | Manual string building | SiweMessage class | Proper formatting, nonce handling |

**Key insight:** Web3 authentication has strict security requirements (nonce handling, message formatting, signature verification). The siwe package from SpruceID handles edge cases that are easy to miss in custom implementations.

## Common Pitfalls

### Pitfall 1: Address Case Sensitivity

**What goes wrong:** Profile lookups fail because `0xABC` !== `0xabc`
**Why it happens:** Ethereum addresses are case-insensitive (except for checksums) but string comparison is case-sensitive
**How to avoid:** Always lowercase addresses before storing and comparing: `address.toLowerCase()`
**Warning signs:** Intermittent profile/follow failures, "user not found" errors

### Pitfall 2: Nonce Reuse Attacks

**What goes wrong:** Attacker replays old SIWE signatures to hijack sessions
**Why it happens:** Server doesn't track/expire nonces properly
**How to avoid:** Generate unique nonce per request, store server-side, delete after use, expire unused nonces
**Warning signs:** Same nonce appearing in multiple verify requests

### Pitfall 3: Missing CORS Configuration

**What goes wrong:** Frontend can't reach API, credentials not included
**Why it happens:** Hono defaults don't include credentials in CORS
**How to avoid:** Configure CORS with `credentials: true` and explicit origin
**Warning signs:** "Credentials flag is true but Access-Control-Allow-Credentials is not true"

```typescript
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
}));
```

### Pitfall 4: Blocking Wallet Connection

**What goes wrong:** Users can't browse without connecting wallet
**Why it happens:** Over-aggressive authentication requirements
**How to avoid:** Only require authentication for write operations (create profile, follow, comment)
**Warning signs:** Users complaining they can't see markets without wallet

### Pitfall 5: Feed Query Performance

**What goes wrong:** Follower feed becomes slow as follow count grows
**Why it happens:** N+1 queries fetching each followed user's predictions
**How to avoid:** Use JOINs or batch queries, add indexes on `followerAddress` and `followingAddress`
**Warning signs:** Feed load time increases linearly with follow count

## Code Examples

### Social API Routes

```typescript
// src/api/social.ts
import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { socialDb } from '../social/db';
import { profiles, follows, comments, predictions } from '../social/schema';
import { requireAuth } from '../social/middleware';

const social = new Hono();

// Get profile (public)
social.get('/profiles/:address', async (c) => {
  const address = c.req.param('address').toLowerCase();
  const profile = await socialDb.query.profiles.findFirst({
    where: eq(profiles.address, address),
  });
  return c.json(profile || { address, displayName: null, bio: null });
});

// Update own profile (authenticated)
social.put('/profiles', requireAuth, async (c) => {
  const address = c.get('address');
  const { displayName, bio } = await c.req.json();

  await socialDb.insert(profiles)
    .values({ address, displayName, bio, createdAt: new Date(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: profiles.address,
      set: { displayName, bio, updatedAt: new Date() },
    });

  return c.json({ success: true });
});

// Follow user (authenticated)
social.post('/follow/:address', requireAuth, async (c) => {
  const followerAddress = c.get('address');
  const followingAddress = c.req.param('address').toLowerCase();

  if (followerAddress === followingAddress) {
    return c.json({ error: 'Cannot follow yourself' }, 400);
  }

  await socialDb.insert(follows)
    .values({ followerAddress, followingAddress, createdAt: new Date() })
    .onConflictDoNothing();

  return c.json({ success: true });
});

// Unfollow user (authenticated)
social.delete('/follow/:address', requireAuth, async (c) => {
  const followerAddress = c.get('address');
  const followingAddress = c.req.param('address').toLowerCase();

  await socialDb.delete(follows).where(
    and(
      eq(follows.followerAddress, followerAddress),
      eq(follows.followingAddress, followingAddress)
    )
  );

  return c.json({ success: true });
});

// Get follower feed (authenticated)
social.get('/feed', requireAuth, async (c) => {
  const address = c.get('address');

  // Get predictions from followed users
  const feed = await socialDb
    .select({
      prediction: predictions,
      profile: profiles,
    })
    .from(predictions)
    .innerJoin(follows, eq(predictions.authorAddress, follows.followingAddress))
    .leftJoin(profiles, eq(predictions.authorAddress, profiles.address))
    .where(eq(follows.followerAddress, address))
    .orderBy(desc(predictions.createdAt))
    .limit(50);

  return c.json(feed);
});

// Add comment to market (authenticated)
social.post('/markets/:marketId/comments', requireAuth, async (c) => {
  const authorAddress = c.get('address');
  const marketId = c.req.param('marketId');
  const { content } = await c.req.json();

  if (!content || content.length > 1000) {
    return c.json({ error: 'Invalid comment' }, 400);
  }

  const [comment] = await socialDb.insert(comments)
    .values({ marketId, authorAddress, content, createdAt: new Date() })
    .returning();

  return c.json(comment);
});

// Get market comments (public)
social.get('/markets/:marketId/comments', async (c) => {
  const marketId = c.req.param('marketId');

  const marketComments = await socialDb
    .select({
      comment: comments,
      profile: profiles,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.authorAddress, profiles.address))
    .where(eq(comments.marketId, marketId))
    .orderBy(desc(comments.createdAt));

  return c.json(marketComments);
});

// Add prediction with explanation (authenticated)
social.post('/markets/:marketId/predictions', requireAuth, async (c) => {
  const authorAddress = c.get('address');
  const marketId = c.req.param('marketId');
  const { explanation, isYes } = await c.req.json();

  const [prediction] = await socialDb.insert(predictions)
    .values({ marketId, authorAddress, explanation, isYes, createdAt: new Date() })
    .returning();

  return c.json(prediction);
});

export default social;
```

### Auth Middleware

```typescript
// src/social/middleware.ts
import { createMiddleware } from 'hono/factory';

export const requireAuth = createMiddleware(async (c, next) => {
  const session = c.get('session');
  const address = session?.get('address');

  if (!address) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('address', address);
  await next();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom signature verification | SIWE (EIP-4361) | 2022 | Standardized, wallet support built-in |
| JWT for Web3 auth | Session cookies with nonces | 2023 | Better nonce handling, simpler implementation |
| On-chain social graphs | Off-chain with wallet signatures | Ongoing | Gas savings, better UX |
| Twitter API for sharing | Web intents (URL-based) | Long-standing | No API keys, simpler implementation |

**Deprecated/outdated:**
- Storing any social data on-chain (except high-value actions like tips)
- Using MetaMask-specific APIs (use EIP-1193 standard via wagmi)

## Open Questions

1. **Database scaling**
   - What we know: SQLite works for MVP, Ponder can use Postgres
   - What's unclear: At what scale do we need to migrate to Postgres?
   - Recommendation: Start with SQLite, plan migration path when active users > 1000

2. **Feed algorithm**
   - What we know: Simple chronological feed is straightforward
   - What's unclear: Should we add ranking/relevance?
   - Recommendation: Start chronological, add engagement signals later if needed

3. **Content moderation**
   - What we know: No built-in moderation in this architecture
   - What's unclear: How to handle spam/abuse?
   - Recommendation: Add report functionality and manual review in Phase 6+

## Sources

### Primary (HIGH confidence)
- [Hono JWT Middleware](https://hono.dev/docs/middleware/builtin/jwt) - Session and auth patterns
- [Ponder API Endpoints](https://ponder.sh/docs/api-reference/ponder/api-endpoints) - Custom route patterns
- [Base SIWE Guide](https://docs.base.org/identity/smart-wallet/guides/siwe) - Full SIWE implementation
- [wagmi useSignMessage](https://wagmi.sh/react/api/hooks/useSignMessage) - Frontend signing

### Secondary (MEDIUM confidence)
- [Supabase Web3 Auth](https://supabase.com/docs/guides/auth/auth-web3) - Architecture patterns verified
- [hono-sessions GitHub](https://github.com/jcs224/hono_sessions) - Session management patterns
- [Drizzle ORM SQLite](https://orm.drizzle.team/docs/get-started-sqlite) - Database patterns

### Tertiary (LOW confidence)
- [react-share GitHub](https://github.com/nygardk/react-share) - Version 5.2.2 confirmed via search
- [siwe npm](https://www.npmjs.com/package/siwe) - Version 3.0.0 confirmed via search (npm blocked direct fetch)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Libraries verified but some versions from search only
- Architecture: HIGH - Patterns from official docs (Hono, wagmi, Ponder)
- Pitfalls: MEDIUM - Drawn from community discussions and official guides

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable domain)
