"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import gsap from "gsap";
import { EVENT, generateBuilderTitle, shareCaption } from "@/lib/brand";
import { generateIdCard, generatePfpFrame } from "@/lib/generate";
import { blobToImage, normalizePhotoFile } from "@/lib/photo";

type Format = "id" | "pfp";

export default function Generator() {
  const [format, setFormat] = useState<Format>("id");
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const latestUrl = useRef<string | null>(null);

  const toggleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const idBtnRef = useRef<HTMLButtonElement>(null);
  const pfpBtnRef = useRef<HTMLButtonElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);

  const builderTitle = useMemo(
    () => generateBuilderTitle(`${name}|${stack}|${teamName}|${teamCode}|${format}`),
    [name, stack, teamName, teamCode, format],
  );

  // GSAP smooth sliding indicator & frame transition
  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = format === "id" ? idBtnRef.current : pfpBtnRef.current;
      if (!activeBtn || !indicatorRef.current) return;

      const leftOffset = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;

      gsap.to(indicatorRef.current, {
        x: leftOffset,
        width: btnWidth,
        duration: 0.38,
        ease: "power3.out",
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    const activeBtn = format === "id" ? idBtnRef.current : pfpBtnRef.current;
    if (activeBtn) {
      gsap.fromTo(
        activeBtn,
        { scale: 0.93 },
        { scale: 1, duration: 0.35, ease: "back.out(2)" },
      );
    }

    if (previewFrameRef.current) {
      gsap.fromTo(
        previewFrameRef.current,
        { scale: 0.97, opacity: 0.85 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    }

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [format]);

  // GSAP smooth animation when generated image preview changes
  useEffect(() => {
    if (previewUrl && imgRef.current) {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.08, opacity: 0, filter: "blur(10px)" },
        { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" },
      );
    }
  }, [previewUrl]);

  // GSAP animation for empty preview state
  useEffect(() => {
    if (!previewUrl && emptyRef.current) {
      gsap.fromTo(
        emptyRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
      );
    }
  }, [previewUrl, format]);

  // GSAP spring animation when download & share buttons become active
  useEffect(() => {
    if (blob) {
      if (downloadBtnRef.current) {
        gsap.fromTo(
          downloadBtnRef.current,
          { scale: 0.9, opacity: 0.6 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)" },
        );
      }
      if (shareBtnRef.current) {
        gsap.fromTo(
          shareBtnRef.current,
          { scale: 0.9, opacity: 0.6 },
          { scale: 1, opacity: 1, duration: 0.4, delay: 0.07, ease: "back.out(1.8)" },
        );
      }
    }
  }, [blob]);

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
                  teamName,
                  teamCode,
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
  }, [photo, format, name, stack, teamName, teamCode, builderTitle]);

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
      const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
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
        <div className="format-toggle" role="tablist" aria-label="Output format" ref={toggleRef}>
          <div className="format-toggle-indicator" ref={indicatorRef} />
          <button
            type="button"
            role="tab"
            ref={idBtnRef}
            aria-selected={format === "id"}
            className={format === "id" ? "active" : ""}
            onClick={() => setFormat("id")}
          >
            Builder ID
          </button>
          <button
            type="button"
            role="tab"
            ref={pfpBtnRef}
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
          <strong>{photo ? "Photo locked in - swap anytime" : "Upload photo"}</strong>
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
            <div className="fields-row">
              <label>
                <span>Team Name</span>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. WaveHackers"
                  maxLength={36}
                />
              </label>
              <label>
                <span>Team Code</span>
                <input
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  placeholder="e.g. HH-GOA-042"
                  maxLength={24}
                />
              </label>
            </div>
            <div className="assigned">
              <span>Assigned builder class</span>
              <p>{builderTitle}</p>
            </div>
          </div>
        ) : (
          <p className="pfp-note">
            Square crop, ready for your X profile. Your photo stays center-stage -
            HH Goa branding wraps the edge.
          </p>
        )}

        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="preview-panel" ref={previewFrameRef}>
        <div className={`preview-frame ${format}`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Generated HH Goa graphic preview" ref={imgRef} />
          ) : (
            <div className="preview-empty" ref={emptyRef}>
              <p>Your {format === "id" ? "builder ID" : "PFP frame"} appears here</p>
              <span>{busy || isPending ? "Rendering…" : "Upload to start"}</span>
            </div>
          )}
        </div>

        <div className="actions">
          <button
            type="button"
            ref={downloadBtnRef}
            className="btn accent"
            disabled={!blob || busy}
            onClick={download}
          >
            Download PNG
          </button>
          <button
            type="button"
            ref={shareBtnRef}
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
