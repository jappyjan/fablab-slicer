import { join } from "path";
import { existsSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { nextStreamFile } from "@/utils/stream-file";

export async function GET(req: NextRequest, res: NextResponse) {
  const searchParams = req.nextUrl.searchParams;

  const manufacturer = searchParams.get("manufacturer");
  const model = searchParams.get("model");

  if (!manufacturer || !model) {
    return Response.json(
      { error: "Manufacturer and model are required" },
      { status: 400 }
    );
  }

  const thumbnailPath = join(
    process.cwd(),
    "slicer-configs",
    manufacturer as string,
    model as string,
    "thumbnail.png"
  );

  if (!existsSync(thumbnailPath)) {
    return Response.json({ error: "Thumbnail not found" }, { status: 404 });
  }

  return nextStreamFile(thumbnailPath);
}
