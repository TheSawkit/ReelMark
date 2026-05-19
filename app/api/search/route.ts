import { NextRequest, NextResponse } from "next/server"
import { searchMulti } from "@/lib/tmdb"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query")?.trim().slice(0, 200)

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchMulti(query)
    return NextResponse.json({ results })
  } catch (error) {
    console.error("[api/search] TMDB search failed:", error)
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 })
  }
}
