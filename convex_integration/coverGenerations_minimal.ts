/**
 * Cover Generations - Minimal Convex Mutations (Metadata Only)
 *
 * Place this in convex/coverGenerations.ts
 *
 * Actual images are stored in Liveblocks message nodes
 * This just tracks metadata for analytics/history
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Create generation metadata when message is sent
 *
 * Called from frontend when user sends message with cover request
 */
export const create = mutation({
  args: {
    boardId: v.string(),
    messageId: v.string(),
    bookData: v.object({
      title: v.string(),
      author: v.optional(v.string()),
      genre: v.optional(v.string()),
      description: v.optional(v.string()),
      mood: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized. Please sign in.");
    }

    const generationId = await ctx.db.insert("coverGenerations", {
      boardId: args.boardId,
      messageId: args.messageId,
      userId: identity.subject,
      bookData: args.bookData,
      prompt: "", // Will be filled by Railway
      apiframeTaskId: "", // Will be filled by Railway
      mode: "fast",
      status: "pending",
      createdAt: Date.now(),
    });

    return generationId;
  },
});

/**
 * Update with Railway response (after routing completes)
 *
 * Called by Railway backend after routing and sending to Midjourney
 */
export const updateWithRailwayResponse = mutation({
  args: {
    generationId: v.id("coverGenerations"),
    prompt: v.string(),
    apiframeTaskId: v.string(),
    mode: v.string(),
    creditsUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const generation = await ctx.db.get(args.generationId);
    if (!generation) throw new Error("Generation not found");
    if (generation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.generationId, {
      prompt: args.prompt,
      apiframeTaskId: args.apiframeTaskId,
      mode: args.mode,
      creditsUsed: args.creditsUsed,
      status: "processing",
    });
  },
});

/**
 * Internal mutation: Update from webhook (when generation completes)
 *
 * Called by Railway webhook after apiframe completes
 * Note: Actual image is updated in Liveblocks, this just tracks metadata
 */
export const updateFromWebhook = internalMutation({
  args: {
    messageId: v.string(),
    boardId: v.string(),
    status: v.string(),
    imageUrls: v.optional(v.array(v.string())),
    selectedImageUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find generation by message ID
    const generation = await ctx.db
      .query("coverGenerations")
      .withIndex("by_board_message", (q) =>
        q.eq("boardId", args.boardId).eq("messageId", args.messageId)
      )
      .first();

    if (!generation) {
      console.error(
        `[WEBHOOK] Generation not found for message ${args.messageId} in board ${args.boardId}`
      );
      return;
    }

    const updates: any = {
      status: args.status,
    };

    if (args.imageUrls) {
      updates.imageUrls = args.imageUrls;
    }

    if (args.selectedImageUrl) {
      updates.selectedImageUrl = args.selectedImageUrl;
    }

    if (args.error) {
      updates.error = args.error;
    }

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(generation._id, updates);

    console.log(
      `[WEBHOOK] Updated generation for message ${args.messageId}: ${args.status}`
    );
  },
});

/**
 * Get generation by message ID (for status checking)
 */
export const getByMessage = query({
  args: {
    boardId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const generation = await ctx.db
      .query("coverGenerations")
      .withIndex("by_board_message", (q) =>
        q.eq("boardId", args.boardId).eq("messageId", args.messageId)
      )
      .first();

    if (!generation) return null;

    // Verify access (must be in same org or be the creator)
    if (generation.userId !== identity.subject) {
      // TODO: Add org check if needed
      throw new Error("Unauthorized");
    }

    return generation;
  },
});

/**
 * Get all generations for a board (for analytics)
 */
export const getByBoard = query({
  args: { boardId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const generations = await ctx.db
      .query("coverGenerations")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .collect();

    return generations;
  },
});

/**
 * Get user's generation history (for user dashboard)
 */
export const getUserHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const generations = await ctx.db
      .query("coverGenerations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(50);

    return generations;
  },
});
