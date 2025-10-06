import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    title: v.string(),
    orgId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    imageUrl: v.string(),
    bookDetails: v.optional(v.object({
      title: v.optional(v.string()),
      author: v.optional(v.string()),
      genres: v.optional(v.string()),
      audience: v.optional(v.string()),
      keywords: v.optional(v.string()),
      mood: v.optional(v.string()),
      synopsis: v.optional(v.string()),
      coverRequirements: v.optional(v.string()),
      thingsToAvoid: v.optional(v.string()),
      otherDetails: v.optional(v.string()),
      inspirations: v.optional(v.string()),
    })),
  })
    .index("by_org", ["orgId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId"],
    }),
  userFavourites: defineTable({
    orgId: v.string(),
    userId: v.string(),
    boardId: v.id("boards"),
  })
    .index("by_board", ["boardId"])
    .index("by_user_org", ["userId", "orgId"])
    .index("by_user_board", ["userId", "boardId"])
    .index("by_user_board_org", ["userId", "boardId", "orgId"]),
  images: defineTable({
    boardId: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    uploadedBy: v.string(),
    uploadedAt: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_storage", ["storageId"]),

  // Message-based cover image storage (for Railway backend persistence)
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
    .index("by_board_message", ["boardId", "messageId"]),
});
