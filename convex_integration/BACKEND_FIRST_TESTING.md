# Backend-First Testing Guide
## Testing COVRR Without Frontend Deployment

Since your frontend is still in development, we can test the entire backend flow independently.

---

## 🎯 Current Status

✅ **Ready:**
- Railway backend (deployed)
- Convex schema & functions (ready to deploy)
- Intelligent routing system (working)
- Midjourney API integration (working)

⏳ **In Development:**
- Next.js frontend
- Liveblocks message components
- UI for cover generation

---

## 🧪 Testing Strategy (Backend Only)

### Phase 1: Test Railway Backend Directly

**Test the `/generate-cover` endpoint with simulated message node data:**

```bash
# Test cover generation for a message node
curl -X POST https://your-railway-app.up.railway.app/generate-cover \
  -H "Content-Type: application/json" \
  -d '{
    "book_data": {
      "title": "The Forgotten Map",
      "genre": "fantasy",
      "description": "A magical adventure through unknown lands",
      "mood": "mysterious"
    },
    "mode": "fast",
    "board_id": "test_board_123",
    "message_id": "test_message_456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "task_id": "abc-123-xyz",
  "message": "Cover generation started",
  "estimated_time": 20,
  "credits_used": 4,
  "cost_usd": 0.20
}
```

### Phase 2: Monitor Webhook Flow

**Check Railway logs** after ~20 seconds:

```bash
railway logs --tail
```

Look for:
```
[WEBHOOK MESSAGE] Received callback for message: test_message_456 in board: test_board_123
[WEBHOOK MESSAGE] ✅ Generation complete!
[LIVEBLOCKS] Notifying message test_message_456 in board test_board_123: completed
[CONVEX HTTP] ✅ Metadata updated for message test_message_456
```

### Phase 3: Test Convex Integration

Deploy Convex functions:

```bash
cd your-frontend-project
npx convex deploy
```

**Query Convex to verify metadata was stored:**

```bash
npx convex run coverGenerations:getByMessage '{
  "boardId": "test_board_123",
  "messageId": "test_message_456"
}'
```

Should return generation metadata with status "completed" and image URLs.

---

## 🔧 Modified Architecture (Without Frontend)

Since the frontend isn't deployed, we can **skip the Liveblocks update** for now and just test:

1. ✅ Railway → Routing → Midjourney
2. ✅ Webhook → Railway → Convex metadata
3. ⏸️ Liveblocks update (will work when frontend is ready)

### Temporary Webhook Configuration

**Option A: Test with Convex Only**

Update Railway backend to skip Liveblocks for now:

Edit `backend/main.py` webhook handler to comment out Liveblocks update:

```python
# Temporarily disable until frontend is deployed
# background_tasks.add_task(
#     notify_liveblocks_message,
#     board_id,
#     message_id,
#     "completed",
#     {...}
# )

# Just update Convex for now
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

**Option B: Mock Liveblocks Endpoint**

Create a simple test endpoint to simulate Liveblocks:

```python
# Add to backend/main.py for testing

@app.post("/test/liveblocks-mock")
async def test_liveblocks_mock(data: dict):
    """
    Mock endpoint to test webhook flow without Liveblocks
    Just logs what would be sent to message node
    """
    logger.info(f"[TEST LIVEBLOCKS] Would update message: {data}")
    return {"success": True, "message": "Mock update received"}
```

Then temporarily set:
```bash
NEXTJS_APP_URL=https://your-railway-app.up.railway.app
```

And the webhook will call `/test/liveblocks-mock` instead.

---

## 📊 Testing Checklist

### Backend Tests

- [ ] **Railway Health Check**
  ```bash
  curl https://your-railway-app.up.railway.app/health
  ```

- [ ] **Generate Cover (without message context)**
  ```bash
  curl -X POST https://your-railway-app.up.railway.app/generate-cover \
    -H "Content-Type: application/json" \
    -d '{
      "book_data": {
        "title": "Test Book",
        "genre": "fantasy"
      },
      "mode": "fast"
    }'
  ```

- [ ] **Generate Cover (with message context)**
  ```bash
  curl -X POST https://your-railway-app.up.railway.app/generate-cover \
    -H "Content-Type: application/json" \
    -d '{
      "book_data": {
        "title": "Test Book",
        "genre": "fantasy"
      },
      "mode": "fast",
      "board_id": "board_123",
      "message_id": "msg_456"
    }'
  ```

- [ ] **Poll Task Status**
  ```bash
  curl https://your-railway-app.up.railway.app/task/{task_id}
  ```

- [ ] **Check Webhook Received** (wait 20s, check logs)

### Convex Tests

- [ ] **Deploy Convex Functions**
  ```bash
  npx convex deploy
  ```

- [ ] **Verify Schema Created**
  ```bash
  npx convex run schema:status
  ```

- [ ] **Query Generations** (after test generation)
  ```bash
  npx convex dashboard
  ```
  Navigate to `coverGenerations` table, verify records exist

- [ ] **Test Convex HTTP Endpoint**
  ```bash
  curl -X POST https://your-convex.convex.cloud/cover-generation-webhook \
    -H "Content-Type: application/json" \
    -d '{
      "boardId": "test_board",
      "messageId": "test_msg",
      "status": "completed",
      "imageUrls": ["url1", "url2", "url3", "url4"],
      "selectedImageUrl": "url1"
    }'
  ```

---

## 🐛 Debugging Without Frontend

### View All Logs in One Place

**Railway logs:**
```bash
railway logs --tail
```

**Convex logs:**
```bash
npx convex logs
```

**Combined testing script:**

Create `test_backend.sh`:

```bash
#!/bin/bash

RAILWAY_URL="https://your-railway-app.up.railway.app"

echo "🧪 Testing COVRR Backend (No Frontend)"
echo "======================================="
echo ""

echo "1️⃣ Health Check..."
curl -s $RAILWAY_URL/health | jq '.'
echo ""

echo "2️⃣ Generating Cover..."
RESPONSE=$(curl -s -X POST $RAILWAY_URL/generate-cover \
  -H "Content-Type: application/json" \
  -d '{
    "book_data": {
      "title": "The Shadow Prince",
      "genre": "fantasy",
      "description": "A dark fantasy tale of betrayal and magic",
      "mood": "dark"
    },
    "mode": "fast",
    "board_id": "test_board_'$(date +%s)'",
    "message_id": "test_msg_'$(date +%s)'"
  }')

echo $RESPONSE | jq '.'
TASK_ID=$(echo $RESPONSE | jq -r '.task_id')
echo ""

echo "3️⃣ Polling Status (every 5s)..."
for i in {1..6}; do
  echo "Poll #$i..."
  curl -s $RAILWAY_URL/task/$TASK_ID | jq '.'
  sleep 5
done

echo ""
echo "4️⃣ Check Convex (npx convex dashboard)"
echo "   Look for new record in coverGenerations table"
echo ""
echo "✅ Test Complete!"
```

Run:
```bash
chmod +x test_backend.sh
./test_backend.sh
```

---

## 🎨 Simulating Frontend Behavior

Until the frontend is ready, you can simulate the entire user flow with curl:

### Scenario: User Creates Message & Generates Cover

```bash
#!/bin/bash
# simulate_user_flow.sh

RAILWAY_URL="https://your-railway-app.up.railway.app"
BOARD_ID="board_$(uuidgen)"
MESSAGE_ID="msg_$(uuidgen)"

echo "📋 Simulating User Flow"
echo "======================="
echo ""
echo "Board ID: $BOARD_ID"
echo "Message ID: $MESSAGE_ID"
echo ""

# Step 1: User creates message node (in your app, this would be Liveblocks)
echo "1️⃣ User creates message node..."
echo "   (In real app: Liveblocks creates layer)"
echo ""

# Step 2: User fills in book details
echo "2️⃣ User fills in book details..."
BOOK_DATA='{
  "title": "Echoes of Eternity",
  "author": "Jane Smith",
  "genre": "science fiction",
  "description": "A time-traveling adventure across parallel universes",
  "mood": "epic",
  "setting": "future Earth"
}'
echo $BOOK_DATA | jq '.'
echo ""

# Step 3: User clicks "Generate Cover"
echo "3️⃣ User clicks Generate Cover button..."
RESPONSE=$(curl -s -X POST $RAILWAY_URL/generate-cover \
  -H "Content-Type: application/json" \
  -d "{
    \"book_data\": $BOOK_DATA,
    \"mode\": \"fast\",
    \"board_id\": \"$BOARD_ID\",
    \"message_id\": \"$MESSAGE_ID\"
  }")

echo $RESPONSE | jq '.'
TASK_ID=$(echo $RESPONSE | jq -r '.task_id')
echo ""

# Step 4: Frontend shows "Generating..."
echo "4️⃣ Message node shows 'Generating...' status"
echo "   (In real app: useBroadcastEvent listening)"
echo ""

# Step 5: Wait for webhook
echo "5️⃣ Waiting for generation to complete..."
echo "   (Estimated: 20 seconds)"
for i in {1..4}; do
  echo "   ⏱️  ${i}0 seconds..."
  sleep 5
done
echo ""

# Step 6: Check result
echo "6️⃣ Checking final result..."
RESULT=$(curl -s $RAILWAY_URL/task/$TASK_ID)
echo $RESULT | jq '.'
echo ""

# Step 7: Verify Convex
echo "7️⃣ Verifying Convex metadata..."
echo "   Run: npx convex run coverGenerations:getByMessage '{"
echo "     \"boardId\": \"$BOARD_ID\","
echo "     \"messageId\": \"$MESSAGE_ID\""
echo "   }'"
echo ""

echo "✅ Simulation Complete!"
echo ""
echo "Expected outcome:"
echo "  - Railway logs show webhook received"
echo "  - Convex has generation record"
echo "  - (When frontend ready) Message node shows cover image"
```

---

## 🚀 Deployment Order (Recommended)

Since frontend isn't ready:

### Current Phase: Backend Infrastructure

1. ✅ **Deploy Railway Backend**
   ```bash
   cd backend
   railway up
   ```

2. ✅ **Deploy Convex Functions**
   ```bash
   cd your-frontend-project
   npx convex deploy
   ```

3. ✅ **Test Backend Flow** (use scripts above)

4. ✅ **Verify Convex Metadata** (check dashboard)

### Future Phase: Frontend Integration

5. ⏳ **Build Message Component** (when ready)
   - Add cover generation button
   - Add useBroadcastEvent listener
   - Display generated images

6. ⏳ **Deploy Next.js App** (when ready)
   - Deploy to Vercel/Railway
   - Add Next.js API route for Liveblocks

7. ⏳ **Test End-to-End** (when ready)
   - User creates message → generates cover → sees image

---

## 📝 What Works Right Now (Without Frontend)

✅ **Cover Generation API**
- `/generate-cover` endpoint works
- Intelligent routing works
- Midjourney generation works
- Task tracking works

✅ **Webhook System**
- Railway receives callbacks
- Convex metadata gets updated
- (Liveblocks update ready but waiting for frontend)

✅ **Data Persistence**
- Convex stores generation history
- Can query past generations
- Analytics ready

❌ **Not Yet Available (Needs Frontend)**
- Visual message nodes
- Real-time cover display
- User interaction with variants
- Liveblocks collaboration

---

## 🎯 Testing Goal (Before Frontend)

**Prove the backend works end-to-end:**

1. Send book data → Railway
2. Railway routes intelligently
3. Midjourney generates covers
4. Webhook updates Convex
5. Can query results from Convex

**When this works**, the frontend just needs to:
- Call the API
- Listen for broadcasts
- Display the images

Simple! 🎉

---

## 🔗 Quick Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Convex Dashboard**: https://dashboard.convex.dev
- **Test Backend**: Use scripts above
- **Check Logs**: `railway logs --tail` and `npx convex logs`

---

**Ready to test?** Start with the health check and work your way through the checklist! 🚀

