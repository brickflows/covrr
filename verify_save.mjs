import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convex = new ConvexHttpClient("https://formal-chihuahua-916.convex.cloud");

async function verify() {
  try {
    const data = await convex.query(api.coverGenerations.getMessageImages, {
      boardId: "j57cs9q78j629zxxeyp6wfnd3d7r8mg4",
      messageId: "test-message-final"
    });
    
    if (data) {
      console.log("✅ SUCCESS! Data saved to Convex:");
      console.log("   Board ID:", data.boardId);
      console.log("   Message ID:", data.messageId);
      console.log("   Task ID:", data.taskId);
      console.log("   Images saved:", data.imageUrls.length);
      console.log("   Status:", data.status);
      console.log("\nImage URLs:");
      data.imageUrls.forEach((url, i) => {
        console.log(`   ${i + 1}. ${url}`);
      });
      console.log("\n🎉 Images will persist after page refresh!");
    } else {
      console.log("❌ No data found");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

verify();
