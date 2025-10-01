import { NextResponse } from "next/server";
import { testStorageBucket } from "@/lib/storage-test";

export async function GET() {
  const result = await testStorageBucket();

  if (result.success) {
    return NextResponse.json({
      message: "Storage test successful",
      ...result
    });
  } else {
    return NextResponse.json({
      message: "Storage test failed",
      ...result
    }, { status: 500 });
  }
}