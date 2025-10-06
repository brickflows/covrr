import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convex = new ConvexHttpClient("https://formal-chihuahua-916.convex.cloud");

async function checkData() {
  try {
    // Check test data from API route
    const data1 = await convex.query(api.coverGenerations.getMessageImages, {
      boardId: "test-board-999",
      messageId: "test-message-888"
    });
    
    console.log("Data from API route test:", data1 ? "✅ FOUND" : "❌ NOT FOUND");
    
    // Check test data from direct Convex test
    const data2 = await convex.query(api.coverGenerations.getMessageImages, {
      boardId: "test-board-123",
      messageId: "test-message-456"
    });
    
    console.log("Data from Convex direct test:", data2 ? "✅ FOUND" : "❌ NOT FOUND");
    
    // Get all data to see what's saved
    const allData = await convex.query(api.coverGenerations.getBoardImages, {
      boardId: "test-board-123"
    });
    
    console.log("\nAll saved messages:", allData?.length || 0);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkData();
