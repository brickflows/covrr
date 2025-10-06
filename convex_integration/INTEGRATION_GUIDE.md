# COVRR Cover Generation Integration Guide
## Liveblocks Message Nodes + Convex + Railway Backend

---

## 🎯 Architecture Overview

```
User creates message node (Liveblocks)
        ↓
User types book details & clicks "Generate Cover"
        ↓
Frontend → Railway Backend (/generate-cover)
        ↓
Railway: Intelligent Routing (Layers 1-5)
        ↓
Railway: Send to Apiframe/Midjourney
        ↓
Message node shows "Generating..." status
        ↓
[Wait ~20 seconds]
        ↓
Apiframe completes → Webhook → Railway
        ↓
Railway → Updates BOTH:
   ├─→ Liveblocks message node (image displayed)
   └─→ Convex metadata (for analytics/history)
        ↓
Message node shows generated cover! ✨
```

---

## 📦 Files to Create

### 1. **Convex Schema** (`convex/schema.ts`)

Add this to your existing schema:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables (boards, userFavourites, images) ...

  // Add cover generations metadata table
  coverGenerations: defineTable({
    // Message & Board Context
    boardId: v.string(),
    messageId: v.string(),

    // User & Organization
    userId: v.string(),
    orgId: v.optional(v.string()),

    // Book metadata
    bookData: v.object({
      title: v.string(),
      author: v.optional(v.string()),
      genre: v.optional(v.string()),
      description: v.optional(v.string()),
      mood: v.optional(v.string()),
    }),

    // Generation tracking
    prompt: v.string(),
    apiframeTaskId: v.string(),
    mode: v.string(),
    status: v.string(), // "pending", "processing", "completed", "failed"

    // Results
    imageUrls: v.optional(v.array(v.string())),
    selectedImageUrl: v.optional(v.string()),
    error: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    completedAt: v.optional(v.number()),

    // Credits
    creditsUsed: v.optional(v.number()),
  })
    .index("by_board", ["boardId"])
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_board_message", ["boardId", "messageId"]),
});
```

### 2. **Convex Mutations** (`convex/coverGenerations.ts`)

Copy from: `convex_integration/coverGenerations_minimal.ts`

### 3. **Convex HTTP Endpoint** (`convex/http.ts`)

Copy from: `convex_integration/http_minimal.ts`

### 4. **Next.js API Route** (`app/api/webhook/update-message-image/route.ts`)

Copy from: `convex_integration/nextjs_api_liveblocks_update.ts`

---

## 🔧 Environment Variables

### Railway Backend
Add to Railway dashboard:

```bash
# Existing
APIFRAME_API_KEY=your_key
OPENAI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
BACKEND_BASE_URL=https://your-railway-app.up.railway.app

# New - for message node integration
NEXTJS_APP_URL=https://your-nextjs-app.vercel.app
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Next.js App
Add to `.env.local`:

```bash
# Existing
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
LIVEBLOCKS_SECRET_KEY=sk_...

# New - for Railway integration
RAILWAY_BACKEND_URL=https://your-railway-app.up.railway.app
```

---

## 🚀 Frontend Implementation

### Message Component Update

Update your message node component to handle cover generation:

```typescript
// app/board/[boardId]/_components/message.tsx

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRoom, useBroadcastEvent } from "@/liveblocks.config";
import { useState } from "react";

export const Message = ({ id, layer }: MessageProps) => {
  const room = useRoom();
  const [generatingCover, setGeneratingCover] = useState(false);

  // Convex mutation to track generation
  const createGeneration = useMutation(api.coverGenerations.create);

  // Listen for cover updates via Liveblocks events
  useBroadcastEvent((event) => {
    if (event.type === "MESSAGE_IMAGE_UPDATED" && event.messageId === id) {
      // Update layer with generated image
      const liveLayers = room.storage.get("layers");
      const messageLayer = liveLayers.get(id);

      if (messageLayer) {
        messageLayer.set("generatedImage", event.imageUrl);
        messageLayer.set("generationStatus", "completed");
        messageLayer.set("imageUrls", event.imageUrls); // All 4 variants
      }

      setGeneratingCover(false);
    } else if (event.type === "MESSAGE_IMAGE_FAILED" && event.messageId === id) {
      // Handle error
      const liveLayers = room.storage.get("layers");
      const messageLayer = liveLayers.get(id);

      if (messageLayer) {
        messageLayer.set("generationStatus", "failed");
        messageLayer.set("generationError", event.error);
      }

      setGeneratingCover(false);
    }
  });

  const handleGenerateCover = async () => {
    try {
      setGeneratingCover(true);

      // Get book data from message content
      const bookData = {
        title: layer.title || "Untitled",
        genre: layer.genre,
        description: layer.description,
        mood: layer.mood,
      };

      // Create Convex generation record
      const generationId = await createGeneration({
        boardId: room.id,
        messageId: id,
        bookData,
      });

      // Update layer status
      const liveLayers = room.storage.get("layers");
      const messageLayer = liveLayers.get(id);
      if (messageLayer) {
        messageLayer.set("generationStatus", "processing");
        messageLayer.set("generationId", generationId);
      }

      // Call Railway backend
      const railwayUrl = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL!;
      const response = await fetch(`${railwayUrl}/generate-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_data: bookData,
          mode: "fast",
          board_id: room.id,
          message_id: id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Generation failed");
      }

      console.log(`Cover generation started: ${result.task_id}`);

      // Webhook will update the message node automatically

    } catch (error) {
      console.error("Failed to generate cover:", error);
      setGeneratingCover(false);

      // Update layer with error
      const liveLayers = room.storage.get("layers");
      const messageLayer = liveLayers.get(id);
      if (messageLayer) {
        messageLayer.set("generationStatus", "failed");
        messageLayer.set("generationError", String(error));
      }
    }
  };

  return (
    <foreignObject ...>
      <div>
        {/* Message content */}
        <input value={layer.title} ... />
        <textarea value={layer.description} ... />

        {/* Generate Cover Button */}
        <button
          onClick={handleGenerateCover}
          disabled={generatingCover}
        >
          {generatingCover ? "Generating..." : "Generate Cover"}
        </button>

        {/* Display generated cover */}
        {layer.generatedImage && (
          <img src={layer.generatedImage} alt="Generated cover" />
        )}

        {/* Show all 4 variants for selection */}
        {layer.imageUrls?.length > 0 && (
          <div className="cover-variants">
            {layer.imageUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Variant ${i + 1}`}
                onClick={() => {
                  const liveLayers = room.storage.get("layers");
                  const messageLayer = liveLayers.get(id);
                  if (messageLayer) {
                    messageLayer.set("generatedImage", url);
                    messageLayer.set("selectedVariant", i);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Show error */}
        {layer.generationStatus === "failed" && (
          <div className="error">{layer.generationError}</div>
        )}
      </div>
    </foreignObject>
  );
};
```

---

## 🧪 Testing Flow

### 1. Deploy Railway Backend
```bash
cd backend
railway up
```

Add environment variables in Railway dashboard.

### 2. Deploy Convex Functions
```bash
npx convex deploy
```

### 3. Deploy Next.js App
```bash
vercel deploy
```

### 4. Test End-to-End

1. Open board in your app
2. Create a message node
3. Fill in book details (title, genre, description)
4. Click "Generate Cover"
5. Message node shows "Generating..." status
6. Wait ~20 seconds
7. Message node displays generated cover!
8. Click on variants to select different versions

### 5. Check Logs

**Railway logs:**
```
[GENERATE] Received request for: Book Title
[ROUTING] Running intelligent routing system...
[MIDJOURNEY] Sending to API (mode: fast)...
[SUCCESS] Task created: abc-123-xyz
[WEBHOOK MESSAGE] Received callback for message: msg_456 in board: board_789
[WEBHOOK MESSAGE] ✅ Generation complete!
[LIVEBLOCKS] ✅ Message node updated: msg_456
[CONVEX HTTP] ✅ Metadata updated for message msg_456
```

**Convex logs:**
```bash
npx convex logs
```

Look for:
```
[CONVEX WEBHOOK] Message msg_456: completed
```

---

## 📊 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (Next.js + Liveblocks)                          │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  User creates message node                                │
│  Fills in: title, genre, description, mood                │
│  Clicks "Generate Cover"                                  │
│                                                            │
│  ┌────────────────────┐                                  │
│  │ Message Component   │                                  │
│  │ - Creates Convex    │                                  │
│  │   generation record │                                  │
│  │ - Calls Railway API │                                  │
│  └────────┬───────────┘                                  │
│           │                                                │
└───────────┼────────────────────────────────────────────┘
            │
            │ POST /generate-cover
            │ { book_data, board_id, message_id }
            ▼
┌──────────────────────────────────────────────────────────┐
│  Railway Backend                                          │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  1. Intelligent Routing (Layers 1-5)                      │
│     - Extract metadata                                     │
│     - Classify use case                                    │
│     - Search SREF database                                 │
│     - Build Midjourney prompt                              │
│                                                            │
│  2. Send to Apiframe/Midjourney                           │
│     - POST /imagine                                        │
│     - Webhook: /webhook/message/{board_id}/{message_id}   │
│                                                            │
│  3. Return task_id immediately                            │
│                                                            │
└────────────────────────────────────────────────────────┘
            │
            │ [Wait ~20 seconds]
            │
            ▼
┌──────────────────────────────────────────────────────────┐
│  Apiframe → Midjourney → Generation Complete              │
└────────────┬─────────────────────────────────────────────┘
            │
            │ Webhook callback
            │ POST /webhook/message/{board_id}/{message_id}
            │ { image_urls, original_image_url }
            ▼
┌──────────────────────────────────────────────────────────┐
│  Railway Backend - Webhook Handler                        │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Parallel updates:                                         │
│                                                            │
│  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │ Update Liveblocks       │  │ Update Convex        │  │
│  │ Message Node            │  │ Metadata             │  │
│  │                         │  │                      │  │
│  │ POST /api/webhook/      │  │ POST {convex_url}/   │  │
│  │   update-message-image  │  │   cover-generation-  │  │
│  │                         │  │   webhook            │  │
│  │ → Broadcast event       │  │                      │  │
│  │   MESSAGE_IMAGE_UPDATED │  │ → Updates            │  │
│  └─────────────────────────┘  │   coverGenerations   │  │
│                                │   table              │  │
│                                └──────────────────────┘  │
└──────────────────────────────────────────────────────────┘
            │                              │
            │                              │
            ▼                              ▼
┌────────────────────┐       ┌────────────────────────┐
│  Liveblocks        │       │  Convex                 │
│                    │       │                         │
│  Message node      │       │  Metadata record        │
│  receives event    │       │  updated                │
│                    │       │                         │
│  → Updates layer   │       │  → WebSocket push       │
│    generatedImage  │       │    (for analytics UI)   │
│    imageUrls       │       │                         │
│    status          │       │                         │
└────────────────────┘       └────────────────────────┘
            │
            │ Real-time via Liveblocks
            ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend - Message Component                             │
│                                                            │
│  useBroadcastEvent((event) => {                           │
│    if (event.type === "MESSAGE_IMAGE_UPDATED") {         │
│      // Update layer with image                          │
│      messageLayer.set("generatedImage", event.imageUrl)  │
│    }                                                       │
│  })                                                        │
│                                                            │
│  → Message node displays cover! ✨                        │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 Message Node Layer Schema

Update your Liveblocks layer type to include cover generation fields:

```typescript
// types/canvas.ts

export type MessageLayer = {
  type: LayerType.Message;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: Color;

  // Message content
  title?: string;
  description?: string;
  genre?: string;
  mood?: string;

  // Cover generation
  generationStatus?: "idle" | "processing" | "completed" | "failed";
  generationId?: string; // Convex generation ID
  generatedImage?: string; // Selected cover URL
  imageUrls?: string[]; // All 4 variants
  selectedVariant?: number; // 0-3
  generationError?: string;
};
```

---

## 🔐 Security Considerations

1. **Webhook Signature Verification** (TODO):
   - Add signature verification to Railway webhook endpoints
   - Add signature verification to Next.js API route

2. **Rate Limiting**:
   - Limit cover generations per user/org
   - Add cooldown between generations

3. **Authorization**:
   - Verify user has access to board before generating
   - Check org membership in Clerk

---

## 💰 Cost Tracking

Each cover generation uses:
- **Fast mode**: 4 credits (~$0.20)
- **Turbo mode**: 8 credits (~$0.40)

Track in Convex `coverGenerations` table for billing/analytics.

---

## 📈 Analytics Queries

```typescript
// Get user's total generations
const myGenerations = useQuery(api.coverGenerations.getUserHistory);

// Get all generations for a board
const boardGenerations = useQuery(api.coverGenerations.getByBoard, {
  boardId: room.id
});

// Check status of specific message generation
const generation = useQuery(api.coverGenerations.getByMessage, {
  boardId: room.id,
  messageId: messageId
});
```

---

## ✅ Deployment Checklist

- [ ] Update Convex schema with `coverGenerations` table
- [ ] Deploy Convex functions (`npx convex deploy`)
- [ ] Create Next.js API route for Liveblocks updates
- [ ] Deploy Next.js app
- [ ] Update Railway backend with message endpoint
- [ ] Add environment variables to Railway
- [ ] Add environment variables to Next.js
- [ ] Test end-to-end flow
- [ ] Monitor logs for errors
- [ ] Set up error alerting

---

**Ready to implement!** 🚀

