import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const result = await getDb().query<{ connection_ok: number }>(
      "SELECT 1 AS connection_ok"
    );

    return NextResponse.json(
      {
        ok: true,
        database: "connected",
        result: result.rows[0]?.connection_ok ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

