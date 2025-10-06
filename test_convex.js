const { ConvexHttpClient } = require("convex/browser");

const convex = new ConvexHttpClient("https://formal-chihuahua-916.convex.cloud");

async function testSave() {
  try {
    console.log("Testing Convex mutation...");
    
    const result = await convex.mutation(
      { type: "mutation", path: "coverGenerations:saveMessageImages" },
      {
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
      }
    );
    
    console.log("✅ SUCCESS! Convex mutation worked:", result);
    
    // Now query it back
    const saved = await convex.query(
      { type: "query", path: "coverGenerations:getMessageImages" },
      {
        boardId: "test-board-123",
        messageId: "test-message-456"
      }
    );
    
    console.log("✅ Data retrieved:", saved);
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

testSave();
