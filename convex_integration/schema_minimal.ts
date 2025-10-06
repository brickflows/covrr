/**
 * COVRR Cover Generations - Minimal Schema for Metadata Tracking
 *
 * Add this to your existing convex/schema.ts
 *
 * This stores lightweight metadata while actual images go to Liveblocks message nodes
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";

// Add to your schema.ts defineSchema({...})
export const coverGenerationsTable = defineTable({
  // Message & Board Context
  boardId: v.string(),              // Liveblocks room ID
  messageId: v.string(),            // Liveblocks message layer ID

  // User & Organization (from Clerk)
  userId: v.string(),               // Clerk user ID
  orgId: v.optional(v.string()),    // Clerk organization ID

  // Book metadata (from message node)
  bookData: v.object({
    title: v.string(),
    author: v.optional(v.string()),
    genre: v.optional(v.string()),
    description: v.optional(v.string()),
    mood: v.optional(v.string()),
    // ... other fields as needed
  }),

  // Generation tracking
  prompt: v.string(),                // Generated Midjourney prompt
  apiframeTaskId: v.string(),        // Task ID from apiframe
  mode: v.string(),                  // "fast" or "turbo"
  status: v.string(),                // "pending", "processing", "completed", "failed"

  // Results (for analytics/history - actual image shown in Liveblocks)
  imageUrls: v.optional(v.array(v.string())),
  selectedImageUrl: v.optional(v.string()),

  // Error handling
  error: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  completedAt: v.optional(v.number()),

  // Credits
  creditsUsed: v.optional(v.number()),
})
  .index("by_board", ["boardId"])
  .index("by_message", ["messageId"])
  .index("by_user", ["userId"])
  .index("by_apiframe_task", ["apiframeTaskId"])
  .index("by_board_message", ["boardId", "messageId"]);

/**
 * Example usage in your schema.ts:
 *
 * import { defineSchema } from "convex/server";
 *
 * export default defineSchema({
 *   boards: defineTable({...}),
 *   userFavourites: defineTable({...}),
 *   images: defineTable({...}),
 *
 *   // Add cover generations for metadata tracking
 *   coverGenerations: coverGenerationsTable,
 * });
 */
