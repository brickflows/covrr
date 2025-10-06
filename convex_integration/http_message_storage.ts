/**
 * Convex HTTP Router for Message-Based Storage
 *
 * This endpoint allows the backend to save cover generation results
 * using boardId and messageId (without requiring frontend to create records first)
 *
 * Add this to convex/http.ts
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Endpoint: POST /webhook/save-message-images
 *
 * Saves cover generation images using boardId + messageId
 * Creates or updates record - no pre-creation needed
 */
http.route({
  path: "/webhook/save-message-images",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      const {
        boardId,
        messageId,
        taskId,
        imageUrls,
        selectedImageUrl,
        originalImageUrl,
        components,
        status
      } = body;

      // Validate required fields
      if (!boardId || !messageId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing boardId or messageId" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Save to Convex using internal mutation
      await ctx.runMutation(internal.coverGenerations.saveMessageImages, {
        boardId,
        messageId,
        taskId,
        imageUrls,
        selectedImageUrl,
        originalImageUrl,
        components,
        status: status || "completed"
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Images saved successfully",
          boardId,
          messageId
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("[WEBHOOK] Error saving message images:", error);
      return new Response(
        JSON.stringify({ success: false, error: String(error) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
