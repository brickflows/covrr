/**
 * Convex Font Functions
 *
 * API functions for managing fonts in the database
 * (mainly for user-uploaded fonts in the future)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

/**
 * Get all user-uploaded fonts for current user/org
 */
export const listUserFonts = query({
  args: {
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let fontsQuery = ctx.db.query("fonts").filter((q) => q.eq(q.field("isUserUploaded"), true));

    if (args.orgId) {
      fontsQuery = fontsQuery.filter((q) => q.eq(q.field("orgId"), args.orgId));
    } else {
      fontsQuery = fontsQuery.filter((q) => q.eq(q.field("uploadedBy"), identity.subject));
    }

    return await fontsQuery.collect();
  },
});

/**
 * Get font by ID
 */
export const getFont = query({
  args: { fontId: v.id("fonts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fontId);
  },
});

/**
 * Search fonts by name
 */
export const searchFonts = query({
  args: {
    query: v.string(),
    source: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("fonts")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .collect();

    // Additional filtering
    if (args.source) {
      results = results.filter((f) => f.source === args.source);
    }
    if (args.category) {
      results = results.filter((f) => f.category === args.category);
    }

    return results;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Upload a new custom font
 * (To be used when user upload feature is implemented)
 */
export const uploadFont = mutation({
  args: {
    name: v.string(),
    family: v.string(),
    displayName: v.string(),
    category: v.string(),
    storageId: v.id("_storage"),
    orgId: v.optional(v.string()),
    variants: v.object({
      weights: v.array(v.number()),
      styles: v.array(v.string()),
      hasVariable: v.boolean(),
      variableAxes: v.optional(v.array(v.string())),
    }),
    tags: v.object({
      styles: v.array(v.string()),
      moods: v.array(v.string()),
      languages: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get file URL from storage
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error("Failed to get file URL");
    }

    return await ctx.db.insert("fonts", {
      name: args.name,
      family: args.family,
      displayName: args.displayName,
      category: args.category,
      source: "user-upload",
      storageId: args.storageId,
      fileUrl,
      variants: args.variants,
      tags: args.tags,
      isPremium: false,
      isUserUploaded: true,
      uploadedBy: identity.subject,
      orgId: args.orgId,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a user-uploaded font
 */
export const deleteFont = mutation({
  args: { fontId: v.id("fonts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const font = await ctx.db.get(args.fontId);
    if (!font) {
      throw new Error("Font not found");
    }

    // Check ownership
    if (font.uploadedBy !== identity.subject) {
      throw new Error("Unauthorized - not font owner");
    }

    // Delete from storage if exists
    if (font.storageId) {
      await ctx.storage.delete(font.storageId);
    }

    await ctx.db.delete(args.fontId);
  },
});

/**
 * Track font usage
 */
export const trackFontUsage = mutation({
  args: {
    fontId: v.id("fonts"),
  },
  handler: async (ctx, args) => {
    const font = await ctx.db.get(args.fontId);
    if (!font) return;

    await ctx.db.patch(args.fontId, {
      usageCount: font.usageCount + 1,
      lastUsed: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Generate upload URL for font file
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
