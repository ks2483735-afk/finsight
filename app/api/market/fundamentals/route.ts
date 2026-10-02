import { NextResponse } from "next/server";
import { marketDataService } from "@/lib/market-data/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  try {
    const result = await marketDataService.getFundamentals(symbol);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fundamentals unavailable" },
      { status: 503 },
    );
  }
}
