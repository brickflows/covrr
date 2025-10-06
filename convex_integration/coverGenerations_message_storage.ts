/**
 * Convex Mutations for Message-Based Cover Storage
 *
 * Add these to convex/coverGenerations.ts
 */

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

/**
 * Internal mutation: Save images for a message
 *
 * Called by HTTP action when Railway receives webhook
 * Creates or updates record using boardId + messageId
 */
export const saveMessageImages = internalMutation({
  args: {
    boardId: v.string(),
    messageId: v.string(),
    taskId: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    selectedImageUrl: v.optional(v.string()),
    originalImageUrl: v.optional(v.string()),
    components: v.optional(v.array(v.string())),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if record already exists for this board + message
    const existing = await ctx.db
      .query("messageImages")
      .withIndex("by_board_message", (q) =>
        q.eq("boardId", args.boardId).eq("messageId", args.messageId)
      )
      .first();

    const data = {
      boardId: args.boardId,
      messageId: args.messageId,
      taskId: args.taskId,
      imageUrls: args.imageUrls || [],
      selectedImageUrl: args.selectedImageUrl,
      originalImageUrl: args.originalImageUrl,
      components: args.components || [],
      status: args.status,
      updatedAt: Date.now(),
    };

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, data);
      console.log(`[CONVEX] Updated images for message ${args.messageId}`);
    } else {
      // Create new record
      await ctx.db.insert("messageImages", {
        ...data,
        createdAt: Date.now(),
      });
      console.log(`[CONVEX] Created images record for message ${args.messageId}`);
    }

    return { success: true };
  },
});

/**
 * Query: Get images for a specific message
 *
 * Called by frontend to restore images after page refresh
 */
export const getMessageImages = query({
  args: {
    boardId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("messageImages")
      .withIndex("by_board_message", (q) =>
        q.eq("boardId", args.boardId).eq("messageId", args.messageId)
      )
      .first();

    return result;
  },
});

/**
 * Query: Get all images for a board
 */
export const getBoardImages = query({
  args: {
    boardId: v.string(),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("messageImages")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();

    return results;
  },
});
