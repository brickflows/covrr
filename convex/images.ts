import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store image metadata in database and get storage URL
export const generateUploadUrl = mutation({
  args: {
    boardId: v.string(),
  },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Generate a storage URL for uploading the image
    const storageUrl = await ctx.storage.generateUploadUrl();

    return storageUrl;
  },
});

// Store image metadata after upload
export const storeImage = mutation({
  args: {
    boardId: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Store image metadata in database
    const imageId = await ctx.db.insert("images", {
      boardId: args.boardId,
      storageId: args.storageId,
      name: args.name,
      size: args.size,
      uploadedBy: identity.subject,
      uploadedAt: Date.now(),
    });

    // Get the public URL for the stored image
    const url = await ctx.storage.getUrl(args.storageId);

    return {
      id: imageId,
      url: url,
      name: args.name,
      size: args.size,
    };
  },
});

// Get image URL by storage ID
export const getImageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete an image
export const deleteImage = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Delete from storage
    await ctx.storage.delete(args.storageId);

    // Delete metadata from database
    const image = await ctx.db
      .query("images")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();

    if (image) {
      await ctx.db.delete(image._id);
    }
  },
});