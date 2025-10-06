/**
 * Next.js API Route - Update Liveblocks Message Node
 *
 * Place this in: app/api/webhook/update-message-image/route.ts
 *
 * Called by Railway webhook to update message node with generated cover image
 */

import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Liveblocks
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Initialize Convex HTTP client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Webhook endpoint called by Railway when cover generation completes
 *
 * Updates:
 * 1. Liveblocks message node with generated image
 * 2. Convex metadata for tracking
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Optional: Verify webhook signature for security
    // const signature = req.headers.get("x-webhook-signature");
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const {
      boardId,
      messageId,
      status,
      imageUrls, // Array of 4 cover variants
      selectedImageUrl, // The image to display (or first one by default)
      error,
    } = body;

    console.log(`[WEBHOOK] Received update for message ${messageId} in board ${boardId}`);
    console.log(`[WEBHOOK] Status: ${status}`);

    // Step 1: Update Convex metadata (internal mutation via HTTP client)
    // Note: This requires setting up an internal mutation that can be called via HTTP
    // For now, we'll use a regular mutation if the user is authenticated
    // In production, you'd want to use Convex HTTP actions instead

    // For now, skip Convex update here - it will be done via Convex HTTP endpoint

    // Step 2: Update Liveblocks message node
    if (status === "completed" && (selectedImageUrl || imageUrls?.length > 0)) {
      const imageUrl = selectedImageUrl || imageUrls[0];

      console.log(`[WEBHOOK] Updating Liveblocks message node with image: ${imageUrl}`);

      // Get Liveblocks room
      const room = liveblocks.getRoom(boardId);

      // Update the message layer's storage
      // This will vary based on your Liveblocks layer structure
      // You may need to adjust this based on how your message layers are structured

      // Option A: Update via Liveblocks REST API (if available)
      // Option B: Use Liveblocks Storage API
      // Option C: Broadcast event for clients to update locally

      // For now, we'll use a broadcast event approach
      // Clients listening to this event will update the message node locally

      await liveblocks.broadcastEvent(
        boardId,
        {
          type: "MESSAGE_IMAGE_UPDATED",
          messageId: messageId,
          imageUrl: imageUrl,
          status: status,
          imageUrls: imageUrls, // All 4 variants for user selection
        },
        {
          shouldQueueEventIfNotConnected: true,
        }
      );

      console.log(`[WEBHOOK] Broadcast event sent to room ${boardId}`);

      return NextResponse.json({
        success: true,
        message: "Message image updated",
      });
    } else if (status === "failed") {
      // Broadcast error event
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

      console.log(`[WEBHOOK] Error broadcast sent to room ${boardId}`);

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
    console.error("[WEBHOOK] Error updating message:", error);
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

/**
 * Alternative: Direct Storage Update (if your Liveblocks setup supports it)
 *
 * If you have direct access to update storage, you could do:
 *
 * const storage = await room.getStorage();
 * const layers = storage.get("layers");
 * const messageLayer = layers.get(messageId);
 *
 * if (messageLayer) {
 *   messageLayer.set("generatedImage", imageUrl);
 *   messageLayer.set("generationStatus", "completed");
 * }
 *
 * However, Liveblocks storage updates from server-side are limited.
 * Broadcasting an event for clients to update is often more reliable.
 */
