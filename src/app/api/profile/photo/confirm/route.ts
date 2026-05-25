import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.objectKey) {
      return NextResponse.json(
        { error: "objectKey is required" },
        { status: 400 }
      );
    }

    // In production, this would update the user's profile photo URL in the database
    return NextResponse.json({
      success: true,
      objectKey: body.objectKey,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
