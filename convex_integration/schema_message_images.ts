/**
 * Convex Schema Addition for Message Images Storage
 *
 * Add this table to your convex/schema.ts
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... your existing tables ...

  // Message-based cover image storage
  messageImages: defineTable({
    boardId: v.string(),
    messageId: v.string(),
    taskId: v.optional(v.string()), // Apiframe/Midjourney task ID
    imageUrls: v.array(v.string()), // 4 individual images
    selectedImageUrl: v.optional(v.string()), // Currently selected image
    originalImageUrl: v.optional(v.string()), // 2x2 grid collage
    components: v.array(v.string()), // Available actions (upsample, variations, etc)
    status: v.string(), // "completed", "processing", "failed"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_message", ["messageId"])
    .index("by_board_message", ["boardId", "messageId"]), // For quick lookups
});
