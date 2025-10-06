/**
 * Convex HTTP Router - Minimal for Metadata Updates
 *
 * Add this to convex/http.ts (or create if it doesn't exist)
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Webhook endpoint for cover generation metadata updates
 *
 * Called by Railway when apiframe completes
 * Updates Convex metadata only (actual image goes to Liveblocks)
 *
 * URL: https://your-deployment.convex.cloud/cover-generation-webhook
 */
http.route({
  path: "/cover-generation-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      const {
        boardId,
        messageId,
        status,
        imageUrls,
        selectedImageUrl,
        error,
      } = body;

      console.log(`[CONVEX WEBHOOK] Message ${messageId}: ${status}`);

      // Update Convex metadata
      await ctx.runMutation(internal.coverGenerations.updateFromWebhook, {
        boardId,
        messageId,
        status,
        imageUrls,
        selectedImageUrl,
        error,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Metadata updated",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("[CONVEX WEBHOOK] Error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
