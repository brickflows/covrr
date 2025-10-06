import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convex = new ConvexHttpClient("https://formal-chihuahua-916.convex.cloud");

async function testSave() {
  try {
    console.log("Testing Convex mutation...");
    
    const result = await convex.mutation(api.coverGenerations.saveMessageImages, {
      boardId: "test-board-123",
      messageId: "test-message-456",
      taskId: "test-task-789",
      imageUrls: [
        "https://example.com/test1.png",
        "https://example.com/test2.png",
        "https://example.com/test3.png",
        "https://example.com/test4.png"
      ],
      selectedImageUrl: "https://example.com/test1.png",
      originalImageUrl: "https://example.com/test-grid.png",
      components: ["upsample1", "upsample2", "upsample3", "upsample4", "reroll"],
      status: "completed"
    });
    
    console.log("✅ SUCCESS! Convex mutation worked:", result);
    
    // Now query it back
    const saved = await convex.query(api.coverGenerations.getMessageImages, {
      boardId: "test-board-123",
      messageId: "test-message-456"
    });
    
    console.log("✅ Data retrieved from Convex:");
    console.log("   - Board ID:", saved?.boardId);
    console.log("   - Message ID:", saved?.messageId);
    console.log("   - Task ID:", saved?.taskId);
    console.log("   - Images:", saved?.imageUrls?.length || 0);
    console.log("   - Status:", saved?.status);
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

testSave();
