import { NextRequest, NextResponse } from "next/server";
import { saveShare } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    const format = String(form.get("format") || "id") as "id" | "pfp";
    const name = String(form.get("name") || "");
    const title = String(form.get("title") || "");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const meta = await saveShare(buffer, {
      format: format === "pfp" ? "pfp" : "id",
      name: name || undefined,
      title: title || undefined,
    });

    const origin = req.nextUrl.origin;
    const site = process.env.NEXT_PUBLIC_SITE_URL || origin;
    const shareUrl = `${site.replace(/\/$/, "")}/s/${meta.id}`;
    const imageUrl = `${site.replace(/\/$/, "")}/api/share/${meta.id}`;

    return NextResponse.json({
      id: meta.id,
      shareUrl,
      imageUrl,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save share" }, { status: 500 });
  }
}
