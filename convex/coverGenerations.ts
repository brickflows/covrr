/**
 * Cover Generations - Message-based storage for Railway backend
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Public mutation: Save images for a message
 * Called by Next.js API route when Railway backend sends webhook
 */
export const saveMessageImages = mutation({
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
    // Check if record already exists
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
 * Call this from frontend on page load to restore images
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
