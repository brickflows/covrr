import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const messageId = searchParams.get('messageId');

    if (!boardId || !messageId) {
      return NextResponse.json(
        { error: "Missing boardId or messageId" },
        { status: 400 }
      );
    }

    const result = await convex.query(api.coverGenerations.getMessageImages, {
      boardId,
      messageId,
    });

    return NextResponse.json(result || { imageUrls: [] });
  } catch (error) {
    console.error("[API] Error fetching message images:", error);
    return NextResponse.json(
      { error: String(error), imageUrls: [] },
      { status: 500 }
    );
  }
}
