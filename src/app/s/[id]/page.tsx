import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENT, shareCaption, linkedinShareCaption } from "@/lib/brand";
import { getShareMeta } from "@/lib/storage";
import { IconX, IconLinkedin } from "@/components/SocialIcons";

type Props = { params: Promise<{ id: string }> };

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://hhgoa-id.netlify.app"
  ).replace(/\/$/, "");
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
          width: 1080,
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
  const sharePageUrl = `${siteUrl()}/s/${id}`;
  const tweetUrl = `https://x.com/intent/post?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(sharePageUrl)}`;
  const liCaption = linkedinShareCaption(meta.name, meta.title, sharePageUrl);
  const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(liCaption)}`;

  return (
    <main className="share-page">
      <div className="share-inner">
        <p className="eyebrow">{EVENT.full} {EVENT.year}</p>
        <h1>{meta.name || "Builder frame"}</h1>
        {meta.title ? <p className="title-pill">{meta.title}</p> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="share-art" src={imageUrl} alt="Generated HH Goa graphic" />
        <div className="share-actions">
          <a className="btn accent" href={imageUrl} download={`hh-goa-${id}.png`}>
            Download PNG
          </a>
          <div className="share-pill-bar">
            <span className="share-pill-label">Share to</span>
            <div className="share-pill-icons">
              <a
                className="share-icon-btn x-btn"
                href={tweetUrl}
                target="_blank"
                rel="noreferrer"
                title="Share to X"
                aria-label="Share to X"
              >
                <IconX />
              </a>
              <a
                className="share-icon-btn li-btn"
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                title="Share to LinkedIn"
                aria-label="Share to LinkedIn"
              >
                <IconLinkedin />
              </a>
            </div>
          </div>
          <Link className="btn ghost" href="/">
            Make yours
          </Link>
        </div>
        <p className="hashtag">{EVENT.hashtag}</p>
      </div>
    </main>
  );
}
