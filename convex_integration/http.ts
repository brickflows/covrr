/**
 * Convex HTTP Router
 *
 * Add this to convex/http.ts (or create if it doesn't exist)
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Webhook endpoint for cover generation updates from Railway backend
 *
 * Called by Railway when apiframe completes cover generation
 *
 * URL: https://your-deployment.convex.cloud/webhook/cover-generation
 */
http.route({
  path: "/webhook/cover-generation",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Optional: Verify webhook signature for security
      // const signature = request.headers.get("x-webhook-signature");
      // if (!verifySignature(signature, body)) {
      //   return new Response("Unauthorized", { status: 401 });
      // }

      const {
        convexTaskId,
        apiframeTaskId,
        status,
        percentage,
        imageUrls,
        originalImageUrl,
        error
      } = body;

      // Update the cover generation record
      await ctx.runMutation(internal.coverGenerations.updateFromWebhook, {
        convexTaskId,
        apiframeTaskId,
        status,
        percentage,
        imageUrls,
        originalImageUrl,
        error,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Cover generation updated" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("[WEBHOOK] Error processing cover generation update:", error);
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

// Export the router
export default http;
