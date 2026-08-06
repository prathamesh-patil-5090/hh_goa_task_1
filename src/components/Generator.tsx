"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { EVENT, generateBuilderTitle, shareCaption } from "@/lib/brand";
import { generateIdCard, generatePfpFrame } from "@/lib/generate";
import { blobToImage, normalizePhotoFile } from "@/lib/photo";

type Format = "id" | "pfp";

export default function Generator() {
  const [format, setFormat] = useState<Format>("id");
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const latestUrl = useRef<string | null>(null);

  const builderTitle = useMemo(
    () => generateBuilderTitle(`${name}|${stack}|${format}`),
    [name, stack, format],
  );

  useEffect(() => {
    return () => {
      if (latestUrl.current) URL.revokeObjectURL(latestUrl.current);
    };
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const normalized = await normalizePhotoFile(file);
      const img = await blobToImage(normalized);
      setPhoto(img);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read photo");
      setPhoto(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      setBlob(null);
      return;
    }

    let cancelled = false;
    startTransition(() => {
      void (async () => {
        setBusy(true);
        setError(null);
        try {
          const out =
            format === "pfp"
              ? await generatePfpFrame(photo)
              : await generateIdCard({
                  photo,
                  name,
                  stack,
                  builderTitle,
                });
          if (cancelled) return;
          if (latestUrl.current) URL.revokeObjectURL(latestUrl.current);
          const url = URL.createObjectURL(out);
          latestUrl.current = url;
          setBlob(out);
          setPreviewUrl(url);
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Generation failed");
          }
        } finally {
          if (!cancelled) setBusy(false);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [photo, format, name, stack, builderTitle]);

  function download() {
    if (!blob || !previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download =
      format === "pfp"
        ? `hh-goa-2026-pfp.png`
        : `hh-goa-2026-id-${(name || "builder").toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  async function shareToX() {
    if (!blob) return;
    setSharing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", blob, "frame.png");
      form.append("format", format);
      form.append("name", name);
      form.append("title", format === "id" ? builderTitle : "PFP Frame");

      const res = await fetch("/api/share", { method: "POST", body: form });
      const data = (await res.json()) as {
        shareUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.shareUrl) {
        throw new Error(data.error || "Share upload failed");
      }

      const text = shareCaption(
        name || undefined,
        format === "id" ? builderTitle : undefined,
      );
      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.shareUrl)}`;
      window.open(intent, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed");
    } finally {
      setSharing(false);
    }
  }

  return (
    <section className="generator" id="make">
      <div className="gen-panel">
        <div className="format-toggle" role="tablist" aria-label="Output format">
          <button
            type="button"
            role="tab"
            aria-selected={format === "id"}
            className={format === "id" ? "active" : ""}
            onClick={() => setFormat("id")}
          >
            Builder ID
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={format === "pfp"}
            className={format === "pfp" ? "active" : ""}
            onClick={() => setFormat("pfp")}
          >
            PFP Frame
          </button>
        </div>

        <label className="upload" htmlFor="photo">
          <input
            id="photo"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <span className="upload-kicker">Drop a selfie or pick from camera roll</span>
          <strong>{photo ? "Photo locked in — swap anytime" : "Upload photo"}</strong>
          <span className="upload-hint">JPG · PNG · WEBP · HEIC</span>
        </label>

        {format === "id" ? (
          <div className="fields">
            <label>
              <span>Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                autoComplete="name"
              />
            </label>
            <label>
              <span>Stack / role</span>
              <input
                value={stack}
                onChange={(e) => setStack(e.target.value)}
                placeholder="AI eng · designer · founder"
                maxLength={48}
              />
            </label>
            <div className="assigned">
              <span>Assigned builder class</span>
              <p>{builderTitle}</p>
            </div>
          </div>
        ) : (
          <p className="pfp-note">
            Square crop, ready for your X profile. Your photo stays center-stage —
            HH Goa branding wraps the edge.
          </p>
        )}

        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="preview-panel">
        <div className={`preview-frame ${format}`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Generated HH Goa graphic preview" />
          ) : (
            <div className="preview-empty">
              <p>Your {format === "id" ? "builder ID" : "PFP frame"} appears here</p>
              <span>{busy || isPending ? "Rendering…" : "Upload to start"}</span>
            </div>
          )}
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn accent"
            disabled={!blob || busy}
            onClick={download}
          >
            Download PNG
          </button>
          <button
            type="button"
            className="btn pink"
            disabled={!blob || sharing || busy}
            onClick={() => void shareToX()}
          >
            {sharing ? "Preparing…" : "Share to X"}
          </button>
        </div>
        <p className="share-note">
          Share opens a pre-filled post with {EVENT.hashtag} and a link whose preview
          is your exact graphic.
        </p>
      </div>
    </section>
  );
}
