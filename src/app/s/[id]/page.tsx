import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENT, shareCaption } from "@/lib/brand";
import { getShareMeta } from "@/lib/storage";

type Props = { params: Promise<{ id: string }> };

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meta = await getShareMeta(id);
  if (!meta) {
    return { title: "Frame not found · HH Goa 2026" };
  }

  const title = meta.name
    ? `${meta.name} · HH Goa 2026 ${meta.format === "pfp" ? "PFP" : "Builder ID"}`
    : `HH Goa 2026 ${meta.format === "pfp" ? "PFP Frame" : "Builder ID"}`;
  const description = shareCaption(meta.name, meta.title).slice(0, 180);
  const image = `${siteUrl()}/api/share/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl()}/s/${id}`,
      siteName: "HH Goa Frame Generator",
      images: [
        {
          url: image,
          width: meta.format === "pfp" ? 1080 : 1080,
          height: meta.format === "pfp" ? 1080 : 1350,
          type: "image/png",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const meta = await getShareMeta(id);
  if (!meta) notFound();

  const imageUrl = `/api/share/${id}`;
  const caption = shareCaption(meta.name, meta.title);
  const tweet = `https://x.com/intent/post?text=${encodeURIComponent(caption)}`;

  return (
    <main className="share-page">
      <div className="share-inner">
        <p className="eyebrow">{EVENT.full} {EVENT.year}</p>
        <h1>{meta.name || "Builder frame"}</h1>
        {meta.title ? <p className="title-pill">{meta.title}</p> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="share-art" src={imageUrl} alt="Generated HH Goa graphic" />
        <div className="share-actions">
          <a className="btn pink" href={imageUrl} download={`hh-goa-${id}.png`}>
            Download
          </a>
          <a className="btn accent" href={tweet} target="_blank" rel="noreferrer">
            Share to X
          </a>
          <Link className="btn ghost" href="/">
            Make yours
          </Link>
        </div>
        <p className="hashtag">{EVENT.hashtag}</p>
      </div>
    </main>
  );
}
