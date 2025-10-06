/**
 * Next.js API Route - Webhook for saving cover generation images
 *
 * Called by Railway backend when cover generation completes
 * Saves images to Convex for persistence
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      boardId,
      messageId,
      taskId,
      imageUrls,
      selectedImageUrl,
      originalImageUrl,
      components,
      status
    } = body;

    // Validate required fields
    if (!boardId || !messageId) {
      return NextResponse.json(
        { success: false, error: "Missing boardId or messageId" },
        { status: 400 }
      );
    }

    // Call the Convex internal mutation directly
    // Note: We need to use a public mutation instead of internal
    // since Next.js API routes can't call internal mutations

    // For now, just acknowledge - you'll need to create a public mutation
    // or use Convex actions to save the data

    console.log("[WEBHOOK] Received image save request:", {
      boardId,
      messageId,
      imageCount: imageUrls?.length || 0
    });

    // Save to Convex
    await convex.mutation(api.coverGenerations.saveMessageImages, {
      boardId,
      messageId,
      taskId,
      imageUrls: imageUrls || [],
      selectedImageUrl,
      originalImageUrl,
      components: components || [],
      status: status || "completed"
    });

    console.log("[WEBHOOK] ✅ Images saved to Convex successfully");

    return NextResponse.json({
      success: true,
      message: "Images saved successfully",
      boardId,
      messageId
    });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
