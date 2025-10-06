# Convex Integration Guide - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Convex Setup & Configuration](#convex-setup--configuration)
4. [Data Model & Schema](#data-model--schema)
5. [Frontend Integration](#frontend-integration)
6. [Query & Mutation Patterns](#query--mutation-patterns)
7. [Real-time Synchronization](#real-time-synchronization)
8. [Authentication Flow](#authentication-flow)
9. [File Storage System](#file-storage-system)
10. [Real-time Message Nodes System](#real-time-message-nodes-system)
11. [Webhook Integration Guide](#webhook-integration-guide)

---

## Overview

Your Miro clone application uses **Convex** as a real-time backend database with automatic reactivity. Convex provides:

- **Real-time database** with automatic subscriptions
- **Type-safe queries and mutations** with TypeScript
- **Authentication integration** with Clerk
- **File storage** for images and assets
- **Server-side functions** with automatic API generation

The frontend uses **Liveblocks** for collaborative canvas features (cursor positions, selection states), while **Convex** handles persistent data storage (boards, favorites, images).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐          ┌──────────────────┐             │
│  │  React Components│          │  ConvexProvider  │             │
│  │                  │◄─────────┤  (with Clerk)    │             │
│  │  - BoardList     │          │                  │             │
│  │  - Message       │          └────────┬─────────┘             │
│  │  - Canvas        │                   │                       │
│  └─────────────────┘                   │                       │
│           │                             │                       │
│           ▼                             ▼                       │
│  ┌─────────────────┐          ┌──────────────────┐             │
│  │  Convex Hooks   │          │  WebSocket       │             │
│  │  - useQuery     │◄─────────┤  Connection      │             │
│  │  - useMutation  │          │                  │             │
│  └─────────────────┘          └──────────────────┘             │
│                                                                   │
└───────────────────┬───────────────────────────────────────────┘
                    │ HTTPS/WebSocket
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Convex Backend Cloud                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Queries    │  │  Mutations   │  │   Actions    │          │
│  │              │  │              │  │              │          │
│  │ - boards.get │  │ - board.     │  │ - HTTP       │          │
│  │ - board.get  │  │   create     │  │   handlers   │          │
│  │ - images.    │  │ - board.     │  │              │          │
│  │   getUrl     │  │   update     │  │              │          │
│  │              │  │ - images.    │  │              │          │
│  │              │  │   storeImage │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │           Convex Database Tables                  │           │
│  │                                                    │           │
│  │  ┌─────────┐  ┌──────────────┐  ┌───────────┐   │           │
│  │  │ boards  │  │userFavourites│  │  images   │   │           │
│  │  └─────────┘  └──────────────┘  └───────────┘   │           │
│  │                                                    │           │
│  │  ┌─────────────────────────────────────────┐    │           │
│  │  │      File Storage (_storage)             │    │           │
│  │  │  - User uploaded images                  │    │           │
│  │  │  - Message attachments                   │    │           │
│  │  └─────────────────────────────────────────┘    │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  Your Webhook    │
          │  Backend Service │
          └──────────────────┘
```

---

## Convex Setup & Configuration

### 1. Installation & Dependencies

Your project includes these Convex-related packages:

```json
{
  "convex": "^1.9.0",
  "convex-helpers": "^0.1.23"
}
```

### 2. Environment Variables

Located in [.env.example](.env.example):

```bash
# Convex deployment identifier
CONVEX_DEPLOYMENT=dev:convex-app-name

# Public Convex API URL (used by frontend)
NEXT_PUBLIC_CONVEX_URL=https://convex-app-name.convex.cloud

# Clerk authentication (integrated with Convex)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Convex Client Initialization

**Location:** [providers/convex-client-provider.tsx](providers/convex-client-provider.tsx)

```typescript
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";

// Initialize Convex client with your deployment URL
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const ConvexClientProvider = ({ children }) => {
  return (
    <ClerkProvider>
      {/* ConvexProviderWithClerk integrates Clerk auth with Convex */}
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <Authenticated>{children}</Authenticated>
        <AuthLoading><Loading /></AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
```

### 4. Root Layout Integration

**Location:** [app/layout.tsx](app/layout.tsx:30)

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<Loading />}>
          {/* Wraps entire app with Convex provider */}
          <ConvexClientProvider>
            <Toaster />
            <ModalProvider />
            {children}
          </ConvexClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
```

---

## Data Model & Schema

**Location:** [convex/schema.ts](convex/schema.ts)

Convex uses a strongly-typed schema definition:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Boards table - stores whiteboard/canvas metadata
  boards: defineTable({
    title: v.string(),
    orgId: v.string(),           // Clerk organization ID
    authorId: v.string(),         // Clerk user ID
    authorName: v.string(),
    imageUrl: v.string(),         // Thumbnail/preview image
  })
    .index("by_org", ["orgId"])           // Query boards by organization
    .searchIndex("search_title", {         // Full-text search on title
      searchField: "title",
      filterFields: ["orgId"],
    }),

  // User favorites - many-to-many relationship
  userFavourites: defineTable({
    orgId: v.string(),
    userId: v.string(),
    boardId: v.id("boards"),      // Foreign key to boards table
  })
    .index("by_board", ["boardId"])
    .index("by_user_org", ["userId", "orgId"])
    .index("by_user_board", ["userId", "boardId"])
    .index("by_user_board_org", ["userId", "boardId", "orgId"]),

  // Images table - metadata for uploaded files
  images: defineTable({
    boardId: v.string(),
    storageId: v.id("_storage"),  // Reference to Convex file storage
    name: v.string(),              // Original filename
    size: v.number(),              // File size in bytes
    uploadedBy: v.string(),        // User ID who uploaded
    uploadedAt: v.number(),        // Unix timestamp
  })
    .index("by_board", ["boardId"])
    .index("by_storage", ["storageId"]),
});
```

### Generated TypeScript Types

Convex automatically generates TypeScript types in [convex/_generated/](convex/_generated/):

- **`dataModel.d.ts`** - Type definitions for all tables
- **`api.d.ts`** - Type-safe function references
- **`server.d.ts`** - Server-side utilities

Example usage:

```typescript
import { Id, Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

// Type-safe document ID
type BoardId = Id<"boards">;

// Type for a board document
type Board = Doc<"boards">;
```

---

## Frontend Integration

### How Components Use Convex

Convex provides React hooks for real-time data access:

#### 1. **useQuery** - Subscribe to Real-time Data

**Location:** [app/(dashboard)/_components/board-list.tsx](app/(dashboard)/_components/board-list.tsx:22)

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export const BoardList = ({ orgId, query }) => {
  // Automatically subscribes to data changes
  // When boards are created/updated/deleted in Convex,
  // this component re-renders with new data
  const data = useQuery(api.boards.get, {
    orgId,
    search: query.search,
    favourites: query.favourites
  });

  // undefined = loading, null/[] = no data
  if (data === undefined) return <LoadingSkeleton />;
  if (!data?.length) return <EmptyState />;

  return (
    <div>
      {data.map((board) => (
        <BoardCard key={board._id} {...board} />
      ))}
    </div>
  );
};
```

**Key Points:**
- `useQuery` creates a **WebSocket subscription** to Convex
- Component **automatically re-renders** when data changes
- Returns `undefined` during initial load
- No manual refetching needed - updates are pushed from server

#### 2. **useMutation** - Modify Data

**Location:** [app/board/[boardId]/_components/message.tsx](app/board/[boardId]/_components/message.tsx:46-47)

```typescript
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export const Message = ({ boardId }) => {
  // Get mutation functions
  const generateUploadUrl = useConvexMutation(api.images.generateUploadUrl);
  const storeImage = useConvexMutation(api.images.storeImage);

  const handleFileUpload = async (file: File) => {
    // Step 1: Get temporary upload URL from Convex
    const uploadUrl = await generateUploadUrl({ boardId });

    // Step 2: Upload file directly to Convex storage
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    const { storageId } = await result.json();

    // Step 3: Store metadata and get public URL
    const imageData = await storeImage({
      boardId,
      storageId: storageId as Id<"_storage">,
      name: file.name,
      size: file.size,
    });

    // imageData.url is now a public CDN URL
    return imageData.url;
  };
};
```

**Mutation Flow:**
1. Call mutation function (returns Promise)
2. Convex executes server-side function
3. Database is updated
4. All subscribed `useQuery` hooks receive updates automatically
5. UI re-renders with new data

---

## Query & Mutation Patterns

### Queries (Read Operations)

**Location:** [convex/boards.ts](convex/boards.ts:6-72) and [convex/board.ts](convex/board.ts:146-153)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

// Query with authentication and complex filtering
export const get = query({
  args: {
    orgId: v.string(),
    search: v.optional(v.string()),
    favourites: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authentication check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized.");

    // 2. Handle favourites filter
    if (args.favourites) {
      const favouritedBoards = await ctx.db
        .query("userFavourites")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", identity.subject).eq("orgId", args.orgId)
        )
        .order("desc")
        .collect();

      const ids = favouritedBoards.map((b) => b.boardId);
      const boards = await getAllOrThrow(ctx.db, ids);

      return boards.map((board) => ({
        ...board,
        isFavourite: true,
      }));
    }

    // 3. Handle search
    if (args.search) {
      return await ctx.db
        .query("boards")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.search).eq("orgId", args.orgId)
        )
        .collect();
    }

    // 4. Default: get all boards for org
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .collect();

    // 5. Enrich with favourite status
    return Promise.all(
      boards.map(async (board) => {
        const favourite = await ctx.db
          .query("userFavourites")
          .withIndex("by_user_board", (q) =>
            q.eq("userId", identity.subject).eq("boardId", board._id)
          )
          .unique();

        return { ...board, isFavourite: !!favourite };
      })
    );
  },
});

// Simple query by ID
export const get = query({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
```

### Mutations (Write Operations)

**Location:** [convex/board.ts](convex/board.ts:18-144)

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new board
export const create = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized.");

    // 2. Generate random image
    const randomImage = images[Math.floor(Math.random() * images.length)];

    // 3. Insert into database
    const board = await ctx.db.insert("boards", {
      title: args.title,
      orgId: args.orgId,
      authorId: identity.subject,
      authorName: identity.name!,
      imageUrl: randomImage,
    });

    return board; // Returns new document ID
  },
});

// Update board title
export const update = mutation({
  args: {
    id: v.id("boards"),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized.");

    // Validation
    const title = args.title.trim();
    if (!title) throw new Error("Title is required.");
    if (title.length > 60) throw new Error("Title too long.");

    // Update document
    await ctx.db.patch(args.id, { title: args.title });
  },
});

// Delete board (with cleanup)
export const remove = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized.");

    const userId = identity.subject;

    // Clean up related data
    const existingFavourite = await ctx.db
      .query("userFavourites")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", userId).eq("boardId", args.id)
      )
      .unique();

    if (existingFavourite) {
      await ctx.db.delete(existingFavourite._id);
    }

    // Delete the board
    await ctx.db.delete(args.id);
  },
});

// Toggle favourite status
export const favourite = mutation({
  args: {
    id: v.id("boards"),
    orgId: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized.");

    const board = await ctx.db.get(args.id);
    if (!board) throw new Error("Board not found.");

    const userId = identity.subject;

    // Check if already favourited
    const existingFavourite = await ctx.db
      .query("userFavourites")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", userId).eq("boardId", board._id)
      )
      .unique();

    if (existingFavourite) {
      throw new Error("Board already favourited.");
    }

    // Create favourite
    await ctx.db.insert("userFavourites", {
      userId,
      boardId: board._id,
      orgId: args.orgId,
    });

    return board;
  },
});
```

---

## Real-time Synchronization

### How Real-time Updates Work

```
┌──────────────┐                    ┌──────────────┐
│  Component A │                    │  Component B │
│  (User 1)    │                    │  (User 2)    │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ useQuery(api.boards.get)          │ useQuery(api.boards.get)
       │                                   │
       ▼                                   ▼
┌────────────────────────────────────────────────────┐
│           Convex WebSocket Server                  │
│  (Maintains subscriptions for both users)          │
└────────────────────────────────────────────────────┘
       │                                   │
       │ User 1 calls mutation             │
       ▼                                   │
┌────────────────────┐                    │
│  update({ title }) │                    │
│  Database updated  │                    │
└────────────────────┘                    │
       │                                   │
       │ Convex detects change             │
       │ Pushes update to ALL subscribers  │
       │                                   │
       ├───────────────────────────────────┤
       ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│  Component A │                    │  Component B │
│  Re-renders  │                    │  Re-renders  │
│  (new data)  │                    │  (new data)  │
└──────────────┘                    └──────────────┘
```

### Subscription Lifecycle

```typescript
// 1. Component mounts
const data = useQuery(api.boards.get, { orgId: "org_123" });

// Behind the scenes:
// - Convex client opens WebSocket
// - Subscribes to query results
// - Initial data fetched and returned

// 2. Another user updates data
// - Mutation executes on server
// - Database updated
// - Convex detects affected queries
// - Pushes new data over WebSocket

// 3. Component receives update
// - React state updated automatically
// - Component re-renders
// - UI shows new data

// 4. Component unmounts
// - Subscription cleaned up
// - WebSocket connection released
```

---

## Authentication Flow

### Clerk + Convex Integration

**Location:** [app/api/liveblocks-auth/route.ts](app/api/liveblocks-auth/route.ts:8)

```typescript
import { ConvexHttpClient } from "convex/browser";
import { auth, currentUser } from "@clerk/nextjs";

// Create HTTP client for server-side Convex calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  // 1. Get Clerk authentication
  const authorization = auth();
  const user = await currentUser();

  if (!authorization || !user) {
    return new NextResponse("Unauthorized.", { status: 403 });
  }

  // 2. Verify board access using Convex query
  const { room } = await req.json();
  const board = await convex.query(api.board.get, { id: room });

  // 3. Check organization membership
  if (board?.orgId !== authorization.orgId) {
    return new NextResponse("Unauthorized.", { status: 403 });
  }

  // 4. Grant Liveblocks access
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.firstName || "Teammate",
      picture: user.imageUrl,
    },
  });

  session.allow(room, session.FULL_ACCESS);
  return await session.authorize();
}
```

### How Auth Works in Convex Functions

Every Convex function has access to `ctx.auth`:

```typescript
export const myMutation = mutation({
  handler: async (ctx, args) => {
    // Get authenticated user info from Clerk
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized.");
    }

    // Identity object structure:
    // {
    //   subject: "user_abc123",        // Clerk user ID
    //   name: "John Doe",
    //   email: "john@example.com",
    //   tokenIdentifier: "...",
    //   issuer: "https://clerk.com/..."
    // }

    const userId = identity.subject;
    const userName = identity.name;

    // Use in queries
    await ctx.db.insert("boards", {
      authorId: userId,
      authorName: userName,
      // ...
    });
  },
});
```

---

## File Storage System

**Location:** [convex/images.ts](convex/images.ts)

### Upload Flow

```typescript
// Step 1: Generate upload URL (mutation)
export const generateUploadUrl = mutation({
  args: { boardId: v.string() },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Returns temporary upload URL (valid for ~1 hour)
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 2: Client uploads file
const uploadUrl = await generateUploadUrl({ boardId });

const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file, // File blob
});

const { storageId } = await result.json();
// storageId example: "kg2h4i5j6k7l8m9n0o1p2q3r"

// Step 3: Store metadata (mutation)
export const storeImage = mutation({
  args: {
    boardId: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Save metadata to images table
    const imageId = await ctx.db.insert("images", {
      boardId: args.boardId,
      storageId: args.storageId,
      name: args.name,
      size: args.size,
      uploadedBy: identity.subject,
      uploadedAt: Date.now(),
    });

    // Get public CDN URL
    const url = await ctx.storage.getUrl(args.storageId);

    return {
      id: imageId,
      url: url, // https://convex-cdn.com/...
      name: args.name,
      size: args.size,
    };
  },
});

// Get image URL by storage ID (query)
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // Returns public URL or null if deleted
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete image (mutation)
export const deleteImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Delete from storage
    await ctx.storage.delete(args.storageId);

    // Delete metadata
    const image = await ctx.db
      .query("images")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();

    if (image) {
      await ctx.db.delete(image._id);
    }
  },
});
```

---

## Real-time Message Nodes System

Your application features a sophisticated **real-time message node system** that combines **Liveblocks** (for collaborative canvas state) with **Convex** (for persistent storage). This creates a powerful workflow where users can create message nodes, connect them, attach images, and trigger AI-generated responses.

### Architecture: Liveblocks + Convex Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                  Real-time Message System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │   Liveblocks     │         │     Convex       │             │
│  │   (Ephemeral)    │         │   (Persistent)   │             │
│  │                  │         │                  │             │
│  │ • Canvas layers  │         │ • Image storage  │             │
│  │ • Message nodes  │         │ • File metadata  │             │
│  │ • Connections    │◄───────►│ • User data      │             │
│  │ • Cursor pos     │         │ • Board info     │             │
│  │ • Selections     │         │                  │             │
│  └──────────────────┘         └──────────────────┘             │
│          │                             │                         │
│          │   Real-time sync via        │                         │
│          │   WebSocket                 │                         │
│          ▼                             ▼                         │
│  ┌────────────────────────────────────────────┐                 │
│  │   Canvas Component (React)                 │                 │
│  │   - Message nodes render                   │                 │
│  │   - Connection lines between nodes         │                 │
│  │   - Collaborative editing                  │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Liveblocks for Message Nodes?

**Liveblocks** handles the canvas layer data (NOT Convex) because:

1. **Ultra-low latency** - Canvas interactions need <50ms response time
2. **Collaborative editing** - Multiple users can move/edit nodes simultaneously
3. **Conflict resolution** - Built-in CRDT (Conflict-free Replicated Data Types)
4. **Presence awareness** - See other users' cursors and selections in real-time
5. **Undo/Redo** - Automatic history management for canvas operations

**Convex** is used for:
- **Image uploads** (persistent file storage)
- **Board metadata** (titles, authors, favorites)
- **Authentication** (via Clerk integration)

### Message Node Data Structure

**Location:** [types/canvas.ts](types/canvas.ts:90-102)

```typescript
// Message image attachment
export type MessageImage = {
  url: string;           // Public CDN URL from Convex storage
  name: string;          // Original filename
  size: number;          // File size in bytes
  storageId?: string;    // Convex storage ID for deletion
};

// Message node layer definition
export type MessageLayer = {
  type: LayerType.Message;
  x: number;             // Canvas X position
  y: number;             // Canvas Y position
  height: number;        // Node height (default: 200px)
  width: number;         // Node width (default: 280px)
  fill: Color;           // Background color
  value?: string;        // Message text content
  negativePrompt?: string; // AI generation negative prompt
  images?: MessageImage[]; // Attached images (max 5)
  author?: string;       // User who created the message
  timestamp?: number;    // Creation timestamp
};
```

### Connection System

Messages can be connected to show workflow relationships:

```typescript
// Connection between two nodes
export type ConnectionLayer = {
  type: LayerType.Connection;
  startId: string;       // ID of source message node
  endId: string;         // ID of destination message node
  startPoint?: Point;    // Optional override for start position
  endPoint?: Point;      // Optional override for end position
  fill: Color;           // Connection line color
};
```

**Visual States:**
- **Active (blue)** - Connection to unsent message
- **Sent (gray)** - Connection to sent message (immutable)

**Location:** [app/board/[boardId]/_components/connection.tsx](app/board/[boardId]/_components/connection.tsx:43-62)

```typescript
const endLayer = useStorage((root) => {
  if (layer.endId) {
    return root.layers.get(layer.endId);
  }
  return null;
});

// Connection is "sent" if the message has a value
const isSent = endLayer?.type === LayerType.Message &&
               (endLayer as any)?.value;

// Can only disconnect unsent connections
const canDisconnect = endLayer?.type === LayerType.Message &&
                      !(endLayer as any)?.value;

const connectionColor = isSent ? "#94a3b8" : "#3b82f6";
```

### How Message Nodes Work

#### 1. Creating a Message Node

**Location:** [app/board/[boardId]/_components/canvas.tsx](app/board/[boardId]/_components/canvas.tsx:91-139)

```typescript
const insertLayer = useMutation(
  ({ storage, setMyPresence }, layerType, position: Point) => {
    const liveLayers = storage.get("layers");
    if (liveLayers.size >= MAX_LAYERS) return;

    const liveLayerIds = storage.get("layerIds");
    const layerId = nanoid();

    // Message nodes have larger default size
    const defaultSize = layerType === LayerType.Message
      ? { width: 280, height: 200 }
      : { width: 100, height: 100 };

    const layerData: any = {
      type: layerType,
      x: position.x,
      y: position.y,
      height: defaultSize.height,
      width: defaultSize.width,
      fill: lastUsedColor,
    };

    // Add Message-specific fields
    if (layerType === LayerType.Message) {
      layerData.images = [];
      layerData.value = "";
      layerData.negativePrompt = "";
    }

    // Create LiveObject (Liveblocks storage)
    const layer = new LiveObject(layerData);

    liveLayerIds.push(layerId);
    liveLayers.set(layerId, layer);

    setMyPresence({ selection: [layerId] }, { addToHistory: true });
  },
  [lastUsedColor]
);
```

**Key Points:**
- Stored in **Liveblocks storage** (not Convex database)
- Automatically synced to all connected users via WebSocket
- Supports undo/redo through Liveblocks history
- Unique ID generated with `nanoid()`

#### 2. Real-time Collaboration on Messages

**Location:** [app/board/[boardId]/_components/message.tsx](app/board/[boardId]/_components/message.tsx:76-87)

```typescript
// Update message content (Liveblocks mutation)
const updateValue = useMutation(
  ({ storage }, newValue: string, newNegativePrompt: string, newImages: MessageImage[]) => {
    const liveLayers = storage.get("layers");
    const layer = liveLayers.get(id);

    if (layer) {
      // These updates sync to all users in real-time
      layer.set("value", newValue);
      layer.set("negativePrompt", newNegativePrompt);
      layer.set("images", newImages);
    }
  },
  []
);
```

**Real-time Sync Flow:**

```
User A edits message
    ↓
updateValue() called (Liveblocks mutation)
    ↓
LiveObject.set() modifies layer
    ↓
Liveblocks broadcasts change via WebSocket
    ↓
User B, C, D receive update instantly
    ↓
Message component re-renders with new data
```

#### 3. Image Upload Integration (Convex)

**Location:** [app/board/[boardId]/_components/message.tsx](app/board/[boardId]/_components/message.tsx:104-158)

```typescript
const generateUploadUrl = useConvexMutation(api.images.generateUploadUrl);
const storeImage = useConvexMutation(api.images.storeImage);

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  const imageFiles = files.filter(file => file.type.startsWith('image/'));

  // Limit: 5 images per message
  if (tempImages.length + imageFiles.length > 5) {
    setShowImageLimitAlert(true);
    return;
  }

  setUploadingImage(true);

  try {
    for (const file of imageFiles) {
      // Step 1: Get upload URL from Convex
      const uploadUrl = await generateUploadUrl({ boardId });

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Step 3: Store metadata in Convex database
      const imageData = await storeImage({
        boardId,
        storageId: storageId as Id<"_storage">,
        name: file.name,
        size: file.size,
      });

      // Step 4: Add to Liveblocks layer (local state)
      if (imageData) {
        const newImage: MessageImage = {
          url: imageData.url || "",
          name: imageData.name,
          size: imageData.size,
          storageId: storageId,
        };
        setTempImages(prev => [...prev, newImage]);
      }
    }
  } catch (error) {
    console.error("Error uploading image:", error);
  } finally {
    setUploadingImage(false);
  }
};
```

**Dual Storage Pattern:**

```
┌─────────────────┐
│  User uploads   │
│  image file     │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Convex File Storage                 │
│  - Stores actual file binary         │
│  - Returns storageId & public URL    │
│  - Metadata saved to images table    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Liveblocks Layer                    │
│  - Stores { url, name, size }        │
│  - No binary data (just reference)   │
│  - Syncs to all users instantly      │
└──────────────────────────────────────┘
```

#### 4. Drag-and-Drop Image Sharing

Users can drag images between message nodes:

**Location:** [app/board/[boardId]/_components/message.tsx](app/board/[boardId]/_components/message.tsx:193-229)

```typescript
const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragOver(false);

  // Get image data from drag event
  const imageData = e.dataTransfer.getData('application/x-miro-image');

  if (imageData) {
    try {
      const image: MessageImage = JSON.parse(imageData);

      // Switch to editing mode if needed
      if (!isEditing) {
        setIsEditing(true);
      }

      // Check 5-image limit
      if (tempImages.length >= 5) {
        setShowImageLimitAlert(true);
        return;
      }

      // Check if image already exists
      const imageExists = tempImages.some(img => img.url === image.url);
      if (!imageExists) {
        setTempImages(prev => [...prev, image]);
      }
    } catch (error) {
      console.error("Error handling dropped image:", error);
    }
  }
};
```

**Key Features:**
- Images can be dragged from one message to another
- No re-upload needed (references same Convex storage)
- Prevents duplicate images
- Enforces 5-image limit per message

#### 5. Incoming Connection Counter

Messages display how many connections point to them:

**Location:** [app/board/[boardId]/_components/message.tsx](app/board/[boardId]/_components/message.tsx:49-61)

```typescript
// Count incoming connections to this message node
const incomingConnectionCount = useStorage((root) => {
  const layers = root.layers;
  let count = 0;

  layers.forEach((layer) => {
    if (layer.type === LayerType.Connection && layer.endId === id) {
      count++;
    }
  });

  return count;
});

// Display in UI
{!isEditing && incomingConnectionCount > 0 && (
  <div className="absolute bottom-3 right-3">
    {incomingConnectionCount}
  </div>
)}
```

This creates a visual indicator showing how many messages feed into each node.

### Liveblocks Storage Structure

**Location:** [liveblocks.config.ts](liveblocks.config.ts:66-73)

```typescript
type Storage = {
  layers: LiveMap<string, LiveObject<Layer>>;  // All canvas objects
  layerIds: LiveList<string>;                  // Render order
};

// Layer union type includes MessageLayer
type Layer =
  | RectangleLayer
  | EllipseLayer
  | PathLayer
  | TextLayer
  | NoteLayer
  | ConnectionLayer
  | MessageLayer;  // ← Message nodes stored here
```

**How it works:**

```typescript
// Accessing message data
const messageNode = useStorage((root) => {
  return root.layers.get("messageId123");
});

// messageNode structure in Liveblocks:
{
  type: LayerType.Message,
  x: 450,
  y: 300,
  width: 280,
  height: 200,
  fill: { r: 255, g: 255, b: 255 },
  value: "Generate a sunset landscape",
  negativePrompt: "blurry, low quality",
  images: [
    {
      url: "https://convex-cdn.com/abc123",
      name: "reference.jpg",
      size: 245678,
      storageId: "kg2h4i5j6k7l8m9n"
    }
  ]
}
```

### Message Node UI States

**Location:** [app/board/[boardId]/_components/message.tsx](app/board/[boardId]/_components/message.tsx:298-472)

#### Editing State (Before Send)

```
┌────────────────────────────────────┐
│  Message Node (Editing)            │
├────────────────────────────────────┤
│                                    │
│  [Text Input Area]                 │
│  "Type your message..."            │
│                                    │
│  📎 [image1.jpg] [image2.png] ❌   │
│                                    │
├────────────────────────────────────┤
│ 📎  [Negative prompt...] [Send]    │
└────────────────────────────────────┘
```

Features:
- Textarea for message input
- File attachment button (max 5 images)
- Negative prompt field
- Send button
- Image drag-and-drop support

#### Display State (After Send)

```
┌────────────────────────────────────────────┐
│  Message Node (Sent)                       │
├────────────────────────┬───────────────────┤
│  Message (40%)         │  Response (60%)   │
│                        │                   │
│  "Generate a sunset    │  ┌─────────────┐ │
│   landscape"           │  │             │ │
│                        │  │  Generated  │ │
│  📎 ref1.jpg           │  │   Image     │ │
│  📎 ref2.png           │  │             │ │
│                        │  └─────────────┘ │
│  [Negative: blurry]    │                   │
│                        │        [2]        │
└────────────────────────┴───────────────────┘
                                  ↑
                        Incoming connection count
```

Features:
- Split view: 40% message, 60% response
- Images displayed as thumbnails
- Negative prompt shown below
- Generated image on right side
- Connection count indicator

### Creating Connections Between Messages

**Location:** [app/board/[boardId]/_components/canvas.tsx](app/board/[boardId]/_components/canvas.tsx:141-163)

```typescript
const insertConnection = useMutation(
  ({ storage }, startId: string, endId: string, startPoint: Point, endPoint: Point) => {
    const liveLayers = storage.get("layers");
    if (liveLayers.size >= MAX_LAYERS) return;

    const liveLayerIds = storage.get("layerIds");
    const layerId = nanoid();

    const layer = new LiveObject({
      type: LayerType.Connection,
      startId,
      endId,
      startPoint,
      endPoint,
      fill: { r: 59, g: 130, b: 246 }, // Blue
    });

    liveLayerIds.push(layerId);
    liveLayers.set(layerId, layer);
  },
  []
);
```

**User Interaction Flow:**

```
1. User clicks "Connection" tool in toolbar
2. Clicks on source message node
3. Drags to destination message node
4. Releases mouse
5. Connection created and synced to all users
```

### Webhook Integration with Message Nodes

To integrate your webhook backend with the message system:

#### Option 1: Update Message via HTTP Action

Since messages are stored in **Liveblocks** (not Convex), you'll need a different approach:

**Create API Route:** `app/api/webhook/message-response/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { boardId, messageId, generatedImageUrl, status } = await req.json();

    // Verify webhook signature
    const signature = req.headers.get("x-webhook-signature");
    if (!verifySignature(signature, body)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update Liveblocks room storage
    const room = liveblocks.getRoom(boardId);

    // Use Liveblocks Storage API to update message
    await room.updateStorage([
      {
        type: "LiveObject",
        id: messageId,
        data: {
          generatedImage: generatedImageUrl,
          status: status,
          completedAt: Date.now(),
        },
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**Your Webhook Backend Calls:**

```typescript
// After generating image from AI
async function notifyMessageComplete(boardId, messageId, imageUrl) {
  await fetch("https://your-app.com/api/webhook/message-response", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": generateSignature(payload),
    },
    body: JSON.stringify({
      boardId: boardId,
      messageId: messageId,
      generatedImageUrl: imageUrl,
      status: "completed",
    }),
  });
}
```

#### Option 2: Hybrid Approach (Recommended)

Store webhook responses in **Convex**, then reference them in **Liveblocks**:

**1. Add schema for message responses:**

```typescript
// convex/schema.ts
messageResponses: defineTable({
  boardId: v.string(),
  messageId: v.string(),
  generatedImageUrl: v.string(),
  prompt: v.string(),
  negativePrompt: v.optional(v.string()),
  status: v.string(), // "generating", "completed", "failed"
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_board", ["boardId"])
  .index("by_message", ["messageId"]),
```

**2. Webhook stores in Convex:**

```typescript
// convex/http.ts
http.route({
  path: "/webhook/message-complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { boardId, messageId, imageUrl, prompt } = await request.json();

    await ctx.runMutation(internal.messages.storeResponse, {
      boardId,
      messageId,
      generatedImageUrl: imageUrl,
      prompt,
      status: "completed",
    });

    return new Response(JSON.stringify({ success: true }));
  }),
});
```

**3. Frontend fetches response:**

```typescript
// In Message component
const messageResponse = useQuery(
  api.messages.getResponse,
  { messageId: id }
);

useEffect(() => {
  if (messageResponse?.generatedImageUrl) {
    setGeneratedImage(messageResponse.generatedImageUrl);
  }
}, [messageResponse]);
```

### Multi-User Collaboration Example

```
User A                           User B
  │                                │
  │ Creates message node           │
  ├────────────────────────────────┤
  │ Liveblocks sync ──────────────►│ Sees new node appear
  │                                │
  │                                │ Adds image to message
  │ Sees image appear ◄────────────┤ Convex upload + Liveblocks sync
  │                                │
  │ Connects to another node       │
  ├────────────────────────────────┤
  │ Liveblocks sync ──────────────►│ Sees connection appear
  │                                │
  │ Sends message                  │
  ├────────────────────────────────┤
  │ Liveblocks sync ──────────────►│ Node changes to "sent" state
  │                                │
  │                                │ Connection becomes gray
  │                                │ (immutable)
```

### Performance Characteristics

**Liveblocks (Message Nodes):**
- **Write latency:** <50ms (WebSocket)
- **Read latency:** 0ms (local cache)
- **Conflict resolution:** Automatic CRDT
- **Persistence:** Until room closes (ephemeral)
- **History:** Full undo/redo support

**Convex (Images):**
- **Upload latency:** 200-500ms (HTTP)
- **Read latency:** <100ms (CDN cached)
- **Storage limit:** Based on plan
- **Persistence:** Permanent
- **Reliability:** 99.9% uptime

### Best Practices

1. **Use Liveblocks for:**
   - Message node positions
   - Message content (text)
   - Connection state
   - Real-time collaboration

2. **Use Convex for:**
   - Image file uploads
   - AI generation results (optional)
   - Audit logs
   - User analytics

3. **Hybrid Pattern:**
   - Quick updates → Liveblocks
   - Permanent records → Convex
   - Large files → Convex storage
   - Small metadata → Liveblocks

---

## Webhook Integration Guide

### Building a Backend Webhook that Integrates with Convex

When building a webhook backend that needs to update user data in Convex, you have several options:

#### Option 1: Direct Database Updates via HTTP Actions (Recommended)

Create an HTTP endpoint in Convex that your webhook can call:

**Location:** Create `convex/http.ts`

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Define webhook endpoint
http.route({
  path: "/webhook/message-update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Verify webhook signature (important for security!)
    const signature = request.headers.get("x-webhook-signature");
    const body = await request.json();

    if (!verifyWebhookSignature(signature, body)) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Extract webhook data
    const { userId, boardId, message, metadata } = body;

    // 3. Call internal mutation to update data
    await ctx.runMutation(internal.messages.updateFromWebhook, {
      userId,
      boardId,
      message,
      metadata,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

**Create Internal Mutation:** `convex/messages.ts`

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal mutations can only be called by other Convex functions
export const updateFromWebhook = internalMutation({
  args: {
    userId: v.string(),
    boardId: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Update user's message data
    // This will trigger real-time updates to all subscribed clients

    // Example: Create a new message record
    await ctx.db.insert("messages", {
      userId: args.userId,
      boardId: args.boardId,
      content: args.message,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    // Or update existing data
    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", args.userId).eq("boardId", args.boardId)
      )
      .first();

    if (existingMessage) {
      await ctx.db.patch(existingMessage._id, {
        content: args.message,
        metadata: args.metadata,
        updatedAt: Date.now(),
      });
    }
  },
});
```

**Update Schema:** Add to `convex/schema.ts`

```typescript
export default defineSchema({
  // ... existing tables ...

  messages: defineTable({
    userId: v.string(),
    boardId: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user_board", ["userId", "boardId"])
    .index("by_board", ["boardId"]),
});
```

**Your Webhook Backend Calls:**

```typescript
// In your webhook backend (Node.js, Python, etc.)
async function notifyConvex(userId, boardId, message) {
  const response = await fetch(
    "https://your-convex-deployment.convex.cloud/webhook/message-update",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": generateSignature(payload),
      },
      body: JSON.stringify({
        userId,
        boardId,
        message,
        metadata: { source: "webhook", timestamp: Date.now() },
      }),
    }
  );

  return await response.json();
}
```

**Frontend Receives Update Automatically:**

```typescript
// Any component subscribed to messages will auto-update
const messages = useQuery(api.messages.getByBoard, { boardId });

// When webhook calls Convex, this component re-renders automatically
// with the new message data - NO manual refetching needed!
```

#### Option 2: Using ConvexHttpClient from Your Backend

Your webhook backend can act as a Convex client:

```typescript
// In your webhook backend (Node.js)
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api"; // You'll need generated types

const convex = new ConvexHttpClient(process.env.CONVEX_URL);

// Set auth token if needed
convex.setAuth("your-service-account-token");

export async function handleWebhook(webhookData) {
  // Call mutation directly from your backend
  await convex.mutation(api.messages.create, {
    userId: webhookData.userId,
    boardId: webhookData.boardId,
    content: webhookData.message,
  });

  // Or query data
  const boards = await convex.query(api.boards.get, {
    orgId: webhookData.orgId,
  });

  return { success: true };
}
```

#### Option 3: Convex Scheduled Functions (For Polling)

If you need to periodically check external data:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Poll external API every 5 minutes
crons.interval(
  "poll-webhook-updates",
  { minutes: 5 },
  internal.webhooks.pollExternalAPI
);

export default crons;
```

```typescript
// convex/webhooks.ts
import { internalAction } from "./_generated/server";

export const pollExternalAPI = internalAction({
  handler: async (ctx) => {
    // Fetch from external API
    const response = await fetch("https://external-api.com/messages");
    const data = await response.json();

    // Update Convex database
    for (const item of data.messages) {
      await ctx.runMutation(internal.messages.updateFromWebhook, {
        userId: item.userId,
        boardId: item.boardId,
        message: item.content,
      });
    }
  },
});
```

### Security Best Practices for Webhooks

1. **Verify webhook signatures:**

```typescript
function verifyWebhookSignature(signature: string, body: any): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(JSON.stringify(body))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

2. **Use internal mutations for webhook handlers:**

```typescript
// ✅ Good - Can only be called by HTTP actions
export const updateFromWebhook = internalMutation({ ... });

// ❌ Bad - Publicly accessible
export const updateFromWebhook = mutation({ ... });
```

3. **Rate limiting:**

```typescript
http.route({
  path: "/webhook/message-update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const ip = request.headers.get("x-forwarded-for");

    // Check rate limit
    const rateLimitOk = await checkRateLimit(ip);
    if (!rateLimitOk) {
      return new Response("Rate limit exceeded", { status: 429 });
    }

    // Process webhook...
  }),
});
```

### Real-time Updates After Webhook

The beauty of Convex is that webhook updates automatically propagate to all connected clients:

```
┌──────────────────┐
│  Your Webhook    │
│  Backend Service │
└────────┬─────────┘
         │ POST /webhook/message-update
         ▼
┌──────────────────────────────────────┐
│  Convex HTTP Action                  │
│  - Validates signature               │
│  - Calls internal mutation           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Convex Database Updated             │
│  - messages table modified           │
└────────┬─────────────────────────────┘
         │
         │ WebSocket push
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  User 1      │ │  User 2      │ │  User 3      │
│  Browser     │ │  Browser     │ │  Browser     │
│  (auto       │ │  (auto       │ │  (auto       │
│  re-render)  │ │  re-render)  │ │  re-render)  │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Example: Complete Webhook Flow

**1. Define schema for webhook data:**

```typescript
// convex/schema.ts
webhookMessages: defineTable({
  userId: v.string(),
  boardId: v.string(),
  content: v.string(),
  status: v.string(), // "pending", "processed", "failed"
  webhookData: v.any(),
  receivedAt: v.number(),
  processedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_status", ["status"]),
```

**2. Create HTTP endpoint:**

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/webhook/receive",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    // Store webhook payload
    await ctx.runMutation(internal.webhooks.storeWebhook, {
      userId: body.userId,
      boardId: body.boardId,
      content: body.message,
      webhookData: body,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  }),
});

export default http;
```

**3. Create internal mutation:**

```typescript
// convex/webhooks.ts
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeWebhook = internalMutation({
  args: {
    userId: v.string(),
    boardId: v.string(),
    content: v.string(),
    webhookData: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookMessages", {
      userId: args.userId,
      boardId: args.boardId,
      content: args.content,
      status: "pending",
      webhookData: args.webhookData,
      receivedAt: Date.now(),
    });
  },
});

// Query for frontend
export const getWebhookMessages = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db
      .query("webhookMessages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});
```

**4. Frontend displays webhook data:**

```typescript
// app/components/webhook-messages.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function WebhookMessages() {
  const { user } = useUser();

  // Automatically updates when webhook receives new data
  const messages = useQuery(
    api.webhooks.getWebhookMessages,
    user ? { userId: user.id } : "skip"
  );

  if (!messages) return <div>Loading...</div>;

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg._id}>
          <p>{msg.content}</p>
          <span>{msg.status}</span>
          <time>{new Date(msg.receivedAt).toLocaleString()}</time>
        </div>
      ))}
    </div>
  );
}
```

---

## Summary: Key Integration Points

### For Your Webhook Backend

1. **Send webhook data to Convex HTTP endpoint:**
   - Create `convex/http.ts` with HTTP routes
   - Verify webhook signatures
   - Call internal mutations to update database

2. **Database updates propagate automatically:**
   - No need to notify frontend manually
   - All `useQuery` subscriptions receive updates via WebSocket
   - Real-time UI updates happen automatically

3. **Authentication options:**
   - Use internal mutations (no auth required)
   - Or set up service account tokens
   - Or verify webhook signatures

### Frontend Data Flow

```
User Action
    ↓
useMutation called
    ↓
Convex mutation executes
    ↓
Database updated
    ↓
WebSocket push to all subscribers
    ↓
useQuery re-renders automatically
    ↓
UI updates
```

### Debugging Tips

1. **Check Convex logs:**
   - `npx convex logs` - View function execution logs
   - `npx convex dashboard` - Web UI for data inspection

2. **Monitor WebSocket:**
   - Browser DevTools → Network → WS tab
   - See real-time messages

3. **Type safety:**
   - Run `npx convex dev` to regenerate types
   - Import from `_generated/api` for autocomplete

---

## Additional Resources

- **Convex Docs:** https://docs.convex.dev
- **React Hooks Reference:** https://docs.convex.dev/client/react
- **HTTP Actions:** https://docs.convex.dev/functions/http-actions
- **File Storage:** https://docs.convex.dev/file-storage
- **Authentication:** https://docs.convex.dev/auth/clerk

---

**Generated:** 2025-10-05
**For:** Miro Clone Application
**Convex Version:** 1.9.0
