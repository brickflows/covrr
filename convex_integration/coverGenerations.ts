/**
 * Cover Generations - Convex Mutations & Queries
 *
 * Place this in convex/coverGenerations.ts
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new cover generation request
 *
 * Called from frontend when user initiates cover generation
 */
export const create = mutation({
  args: {
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
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized. Please sign in.");
    }

    // Create generation record
    const generationId = await ctx.db.insert("coverGenerations", {
      userId: identity.subject,
      orgId: args.orgId,
      bookData: args.bookData,
      prompt: "", // Will be filled by Railway backend
      apiframeTaskId: "", // Will be filled by Railway backend
      mode: "fast",
      status: "pending",
      createdAt: Date.now(),
    });

    return generationId;
  },
});

/**
 * Update generation with Railway backend response
 *
 * Called after Railway routing completes and sends to Midjourney
 */
export const updateWithRailwayResponse = mutation({
  args: {
    generationId: v.id("coverGenerations"),
    prompt: v.string(),
    apiframeTaskId: v.string(),
    mode: v.string(),
    routingInfo: v.optional(v.any()),
    creditsUsed: v.optional(v.number()),
    estimatedCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify ownership
    const generation = await ctx.db.get(args.generationId);
    if (!generation) throw new Error("Generation not found");
    if (generation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Update with Railway response
    await ctx.db.patch(args.generationId, {
      prompt: args.prompt,
      apiframeTaskId: args.apiframeTaskId,
      mode: args.mode,
      routingInfo: args.routingInfo,
      creditsUsed: args.creditsUsed,
      estimatedCost: args.estimatedCost,
      status: "processing",
      startedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation: Update from webhook
 *
 * Called by HTTP action when Railway receives apiframe webhook
 */
export const updateFromWebhook = internalMutation({
  args: {
    convexTaskId: v.id("coverGenerations"),
    apiframeTaskId: v.optional(v.string()),
    status: v.string(),
    percentage: v.optional(v.number()),
    imageUrls: v.optional(v.array(v.string())),
    originalImageUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.convexTaskId);
    if (!generation) {
      console.error(`[WEBHOOK] Generation ${args.convexTaskId} not found`);
      return;
    }

    const updates: any = {
      status: args.status,
    };

    if (args.percentage !== undefined) {
      updates.percentage = args.percentage;
    }

    if (args.imageUrls) {
      updates.imageUrls = args.imageUrls;
    }

    if (args.originalImageUrl) {
      updates.originalImageUrl = args.originalImageUrl;
    }

    if (args.error) {
      updates.error = args.error;
    }

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.convexTaskId, updates);

    console.log(`[WEBHOOK] Updated generation ${args.convexTaskId}: ${args.status}`);
  },
});

/**
 * Get user's cover generations
 */
export const getUserGenerations = query({
  args: {
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let generations;

    if (args.orgId) {
      // Get generations for org
      generations = await ctx.db
        .query("coverGenerations")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", identity.subject).eq("orgId", args.orgId)
        )
        .order("desc")
        .collect();
    } else {
      // Get all user's generations
      generations = await ctx.db
        .query("coverGenerations")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();
    }

    return generations;
  },
});

/**
 * Get single generation by ID
 */
export const get = query({
  args: { id: v.id("coverGenerations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const generation = await ctx.db.get(args.id);
    if (!generation) return null;

    // Verify ownership
    if (generation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    return generation;
  },
});

/**
 * Mark an image as selected for upscaling
 */
export const selectImage = mutation({
  args: {
    generationId: v.id("coverGenerations"),
    imageIndex: v.number(), // 1-4
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const generation = await ctx.db.get(args.generationId);
    if (!generation) throw new Error("Generation not found");
    if (generation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    if (args.imageIndex < 1 || args.imageIndex > 4) {
      throw new Error("Image index must be between 1 and 4");
    }

    await ctx.db.patch(args.generationId, {
      selectedImageIndex: args.imageIndex,
    });
  },
});

/**
 * Update with upscaled image URL
 */
export const updateUpscaledImage = mutation({
  args: {
    generationId: v.id("coverGenerations"),
    upscaledImageUrl: v.string(),
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
      upscaledImageUrl: args.upscaledImageUrl,
    });
  },
});

/**
 * Delete a generation
 */
export const remove = mutation({
  args: { id: v.id("coverGenerations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const generation = await ctx.db.get(args.id);
    if (!generation) throw new Error("Generation not found");
    if (generation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
