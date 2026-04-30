import { NextResponse } from "next/server";
import { getOperationsSnapshot } from "@/lib/operations";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getOperationsSnapshot());
}
