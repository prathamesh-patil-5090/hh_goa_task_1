import { NextRequest, NextResponse } from "next/server";
import { getShareImage } from "@/lib/storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const image = await getShareImage(id);
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(image), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
