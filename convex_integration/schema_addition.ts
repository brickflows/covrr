/**
 * COVRR Cover Generations Schema
 *
 * Add this to your existing convex/schema.ts
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";

// Add to your schema.ts defineSchema({...})
export const coverGenerationsTable = defineTable({
  // User & Organization (from Clerk)
  userId: v.string(),              // Clerk user ID
  orgId: v.optional(v.string()),   // Clerk organization ID (if applicable)

  // Book metadata
  bookData: v.object({
    title: v.string(),
    author: v.optional(v.string()),
    genre: v.optional(v.string()),
    subgenre: v.optional(v.string()),
    description: v.optional(v.string()),
    target_audience: v.optional(v.string()),
    mood: v.optional(v.string()),
    setting: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    series_name: v.optional(v.string()),
    book_number: v.optional(v.number()),
    style_preference: v.optional(v.string()),
    color_preference: v.optional(v.string()),
  }),

  // Generation details
  prompt: v.string(),                        // Generated Midjourney prompt
  apiframeTaskId: v.string(),                // Task ID from apiframe
  mode: v.string(),                          // "fast" or "turbo"

  // Routing info (from intelligent routing system)
  routingInfo: v.optional(v.object({
    useCase: v.optional(v.string()),
    selectedSref: v.optional(v.string()),
    parameters: v.optional(v.any()),
  })),

  // Status & Progress
  status: v.string(),                        // "pending", "processing", "completed", "failed"
  percentage: v.optional(v.number()),        // Progress percentage (0-100)

  // Results
  imageUrls: v.optional(v.array(v.string())), // 4 individual cover variants
  originalImageUrl: v.optional(v.string()),   // Grid image URL
  selectedImageIndex: v.optional(v.number()), // Which image user selected (1-4)
  upscaledImageUrl: v.optional(v.string()),   // Upscaled final cover

  // Error handling
  error: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),

  // Credits & Cost
  creditsUsed: v.optional(v.number()),
  estimatedCost: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_org", ["orgId"])
  .index("by_user_org", ["userId", "orgId"])
  .index("by_status", ["status"])
  .index("by_apiframe_task", ["apiframeTaskId"]);

/**
 * Example usage in your schema.ts:
 *
 * import { defineSchema } from "convex/server";
 * import { coverGenerationsTable } from "./cover_generations_schema";
 *
 * export default defineSchema({
 *   boards: defineTable({...}),
 *   userFavourites: defineTable({...}),
 *   images: defineTable({...}),
 *
 *   // Add cover generations
 *   coverGenerations: coverGenerationsTable,
 * });
 */
