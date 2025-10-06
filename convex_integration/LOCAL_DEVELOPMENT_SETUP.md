# Local Development Setup
## Frontend (localhost) + Railway Backend (deployed) + Convex

---

## 🎯 Architecture

```
Frontend (localhost:3000)
    ↓
Railway Backend (deployed)
    ↓
Midjourney API
    ↓
Webhook → Railway → Both:
    ├─→ localhost:3000/api/webhook/... (Next.js API route)
    └─→ Convex HTTP endpoint
```

---

## ⚙️ Configuration

### 1. Railway Environment Variables

Set these in Railway dashboard:

```bash
# Required
APIFRAME_API_KEY=your_key
OPENAI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Backend URL
BACKEND_BASE_URL=https://your-railway-app.up.railway.app

# For local frontend development - IMPORTANT!
NEXTJS_APP_URL=http://localhost:3000

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Key Point**: `NEXTJS_APP_URL=http://localhost:3000` makes Railway call your local Next.js app!

### 2. Local `.env.local` (Frontend)

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Liveblocks
LIVEBLOCKS_SECRET_KEY=sk_...
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_...

# Railway backend
NEXT_PUBLIC_RAILWAY_BACKEND_URL=https://your-railway-app.up.railway.app

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 🚀 Setup Steps

### Step 1: Deploy Railway Backend

```bash
cd backend
railway up
```

### Step 2: Set Railway Environment Variables

In Railway dashboard, add:
- `NEXTJS_APP_URL=http://localhost:3000` ← **Critical for local dev!**

### Step 3: Deploy Convex

```bash
cd your-frontend-project
npx convex deploy
```

### Step 4: Run Frontend Locally

```bash
npm run dev
# or
pnpm dev
```

**Make sure your Next.js app is running on `http://localhost:3000`**

### Step 5: Expose Local Server (for webhook testing)

Since Railway needs to call `http://localhost:3000`, you have 2 options:

#### Option A: Use ngrok (Recommended for Testing)

```bash
ngrok http 3000
```

This gives you a public URL like `https://abc123.ngrok.io`

**Update Railway env:**
```bash
NEXTJS_APP_URL=https://abc123.ngrok.io
```

#### Option B: Skip Liveblocks Update (Convex Only)

Temporarily disable Liveblocks webhook in Railway backend until you deploy:

Edit `backend/main.py`:

```python
# In webhook_message_callback function, comment out:

# Temporarily disabled for local dev
# background_tasks.add_task(
#     notify_liveblocks_message,
#     board_id,
#     message_id,
#     "completed",
#     {...}
# )

# Only update Convex for now
convex_url = os.getenv("NEXT_PUBLIC_CONVEX_URL")
if convex_url:
    background_tasks.add_task(
        notify_convex_http,
        convex_url,
        board_id,
        message_id,
        "completed",
        {...}
    )
```

---

## 🧪 Local Testing Flow

### 1. Start Your Local Frontend

```bash
cd your-frontend-project
pnpm dev
```

Visit: `http://localhost:3000`

### 2. Create Message Node in Your App

In your Miro board:
1. Create a new message node
2. Fill in book details
3. Click "Generate Cover"

### 3. Frontend Calls Railway

```typescript
// In your message component
const response = await fetch(
  `${process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL}/generate-cover`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      book_data: bookData,
      mode: "fast",
      board_id: room.id,
      message_id: messageId,
    }),
  }
);
```

### 4. Railway Processes & Sends Webhook

Railway calls:
- `http://localhost:3000/api/webhook/update-message-image` (if using ngrok)
- Or just updates Convex (if Liveblocks disabled)

### 5. Verify Results

**Check Railway logs:**
```bash
railway logs --tail
```

**Check Convex dashboard:**
```bash
npx convex dashboard
```

**Check message node** - should show generated cover!

---

## 📝 Local Development Workflow

```
┌─────────────────────────────────────────────────────┐
│  Your Computer                                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────┐                               │
│  │  localhost:3000   │                               │
│  │  Next.js App      │                               │
│  │                   │                               │
│  │  - Message nodes  │                               │
│  │  - Liveblocks     │                               │
│  │  - Convex queries │                               │
│  └────────┬──────────┘                               │
│           │                                           │
│           │ POST /generate-cover                      │
│           │                                           │
└───────────┼───────────────────────────────────────┘
            │
            │ HTTPS
            ▼
┌─────────────────────────────────────────────────────┐
│  Railway Backend (Deployed)                          │
│  https://your-app.up.railway.app                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  - Receives request                                  │
│  - Runs routing                                      │
│  - Calls Midjourney                                  │
│  - Returns task_id                                   │
│                                                       │
└────────────────────────┬────────────────────────────┘
                         │
                         │ [20 seconds later]
                         ▼
                    Webhook arrives
                         │
         ┌───────────────┴──────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  localhost:3000   │          │  Convex Cloud    │
│  (via ngrok)      │          │  (deployed)      │
│                   │          │                  │
│  Updates          │          │  Updates         │
│  message node     │          │  metadata        │
└──────────────────┘          └──────────────────┘
```

---

## 🔧 Create Next.js API Route

Create this file in your Next.js project:

**`app/api/webhook/update-message-image/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      boardId,
      messageId,
      status,
      imageUrls,
      selectedImageUrl,
      error,
    } = body;

    console.log(`[WEBHOOK] Received update for message ${messageId}`);

    if (status === "completed" && (selectedImageUrl || imageUrls?.length > 0)) {
      const imageUrl = selectedImageUrl || imageUrls[0];

      console.log(`[WEBHOOK] Broadcasting image update...`);

      // Broadcast event to all clients in the room
      await liveblocks.broadcastEvent(
        boardId,
        {
          type: "MESSAGE_IMAGE_UPDATED",
          messageId: messageId,
          imageUrl: imageUrl,
          imageUrls: imageUrls,
          status: status,
        },
        {
          shouldQueueEventIfNotConnected: true,
        }
      );

      console.log(`[WEBHOOK] ✅ Broadcast sent to room ${boardId}`);

      return NextResponse.json({
        success: true,
        message: "Message image updated",
      });
    } else if (status === "failed") {
      await liveblocks.broadcastEvent(
        boardId,
        {
          type: "MESSAGE_IMAGE_FAILED",
          messageId: messageId,
          error: error || "Generation failed",
        },
        {
          shouldQueueEventIfNotConnected: true,
        }
      );

      return NextResponse.json({
        success: true,
        message: "Error broadcast sent",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}
```

---

## 🧪 Complete Local Test

### Test Script (run from your Next.js project)

```bash
#!/bin/bash
# test_local.sh

RAILWAY_URL="https://your-railway-app.up.railway.app"
BOARD_ID="test_board_$(date +%s)"
MESSAGE_ID="test_msg_$(date +%s)"

echo "🧪 Testing Local Development Setup"
echo "===================================="
echo ""
echo "Board ID: $BOARD_ID"
echo "Message ID: $MESSAGE_ID"
echo ""

echo "1️⃣ Make sure Next.js is running on localhost:3000..."
echo "   pnpm dev"
echo ""

echo "2️⃣ Generating cover..."
RESPONSE=$(curl -s -X POST $RAILWAY_URL/generate-cover \
  -H "Content-Type: application/json" \
  -d '{
    "book_data": {
      "title": "The Crystal Throne",
      "genre": "fantasy",
      "description": "An epic tale of magic and destiny",
      "mood": "epic"
    },
    "mode": "fast",
    "board_id": "'$BOARD_ID'",
    "message_id": "'$MESSAGE_ID'"
  }')

echo $RESPONSE | jq '.'
TASK_ID=$(echo $RESPONSE | jq -r '.task_id')
echo ""

echo "3️⃣ Task ID: $TASK_ID"
echo "   Waiting 20 seconds for generation..."
sleep 20
echo ""

echo "4️⃣ Check your Next.js console for webhook callback"
echo "   Should see: [WEBHOOK] Received update for message $MESSAGE_ID"
echo ""

echo "5️⃣ Check Convex dashboard:"
echo "   npx convex dashboard"
echo "   Look for record with messageId: $MESSAGE_ID"
echo ""

echo "✅ Test Complete!"
```

---

## 🐛 Troubleshooting Local Development

### Problem: Webhook not reaching localhost

**Solution**: Use ngrok

```bash
ngrok http 3000
```

Update Railway: `NEXTJS_APP_URL=https://abc123.ngrok.io`

### Problem: CORS errors

**Solution**: Check Next.js API route has proper headers (already included in example above)

### Problem: Can't see Liveblocks events

**Solution**: Make sure you're listening with `useBroadcastEvent` in your component:

```typescript
import { useBroadcastEvent } from "@/liveblocks.config";

useBroadcastEvent((event) => {
  if (event.type === "MESSAGE_IMAGE_UPDATED") {
    console.log("Received image update:", event);
    // Update your message node here
  }
});
```

### Problem: Convex not updating

**Solution**: Check Convex URL is correct in Railway env vars

---

## ✅ Local Development Checklist

- [ ] Railway backend deployed
- [ ] Railway `NEXTJS_APP_URL` = `http://localhost:3000` or ngrok URL
- [ ] Convex functions deployed (`npx convex deploy`)
- [ ] Next.js API route created (`app/api/webhook/update-message-image/route.ts`)
- [ ] Next.js running locally (`pnpm dev`)
- [ ] ngrok running (if using): `ngrok http 3000`
- [ ] Can generate cover from UI
- [ ] Webhook reaches localhost
- [ ] Message node updates with image
- [ ] Convex metadata is stored

---

## 🎯 What You Should See

1. **Create message node** in your board
2. **Fill in book details**
3. **Click "Generate Cover"**
4. **Message shows "Generating..."**
5. **~20 seconds later**:
   - Next.js console: `[WEBHOOK] Received update for message ...`
   - Message node: Shows generated cover image
   - Convex dashboard: Has metadata record
6. **Success!** 🎉

---

## 🚀 Ready for Production

When you deploy your Next.js app:

1. Deploy to Vercel/Railway
2. Update Railway env: `NEXTJS_APP_URL=https://your-app.vercel.app`
3. Everything else stays the same!

The webhook will automatically switch from localhost to production URL.

---

**Ready to test locally?** Make sure Next.js is running and try the test script above! 🚀

