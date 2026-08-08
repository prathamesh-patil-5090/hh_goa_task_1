"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { generateBuilderTitle, shareCaption, linkedinShareCaption } from "@/lib/brand";
import { CropAdjust, DEFAULT_CROP } from "@/lib/canvas";
import { generateIdCard, generatePfpFrame } from "@/lib/generate";
import { blobToImage, normalizePhotoFile } from "@/lib/photo";
import PhotoAdjuster from "@/components/PhotoAdjuster";
import { IconX, IconLinkedin } from "@/components/SocialIcons";

type Format = "id" | "pfp";

export default function Generator() {
  const [format, setFormat] = useState<Format>("id");

  // Live state (bound to inputs for real-time syncing)
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropAdjust>(DEFAULT_CROP);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [validationToast, setValidationToast] = useState<{
    missing: string[];
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fileRef = useRef<HTMLInputElement>(null);
  const latestUrl = useRef<string | null>(null);
  const validationToastRef = useRef<HTMLDivElement>(null);
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track initial load / format change to only play subtle fade on fresh photo/format, never on typing
  const isInitialLoadRef = useRef<boolean>(true);
  const lastPhotoRef = useRef<HTMLImageElement | null>(null);
  const lastFormatRef = useRef<Format>(format);

  const toggleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const idBtnRef = useRef<HTMLButtonElement>(null);
  const pfpBtnRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);

  const builderTitle = useMemo(
    () =>
      generateBuilderTitle(
        `${name}|${stack}|${teamName}|${teamCode}|${format}`,
      ),
    [name, stack, teamName, teamCode, format],
  );

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Mark initial load on photo upload or format switch
  if (lastPhotoRef.current !== photo || lastFormatRef.current !== format) {
    lastPhotoRef.current = photo;
    lastFormatRef.current = format;
    isInitialLoadRef.current = true;
  }

  // GSAP minimal & clean format tab indicator animation
  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = format === "id" ? idBtnRef.current : pfpBtnRef.current;
      if (!activeBtn || !indicatorRef.current) return;
      gsap.to(indicatorRef.current, {
        x: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        duration: 0.25,
        ease: "power2.out",
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [format]);

  // Minimal fade-in only when photo/format changes for the first time
  useEffect(() => {
    if (previewUrl && imgRef.current) {
      if (isInitialLoadRef.current) {
        gsap.fromTo(
          imgRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: "power2.out" },
        );
        isInitialLoadRef.current = false;
      }
    }
  }, [previewUrl]);

  // GSAP minimal animation for empty state
  useEffect(() => {
    if (!previewUrl && emptyRef.current) {
      gsap.fromTo(
        emptyRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" },
      );
    }
  }, [previewUrl, format]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (latestUrl.current) URL.revokeObjectURL(latestUrl.current);
    };
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setToast(null);
    setBusy(true);
    try {
      const normalized = await normalizePhotoFile(file);
      const img = await blobToImage(normalized);
      setCrop(DEFAULT_CROP);
      setPhoto(img);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read photo");
      setPhoto(null);
    } finally {
      setBusy(false);
    }
  }

  // Real-time canvas generation & pre-decoded live syncing
  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      setBlob(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const out =
          format === "pfp"
            ? await generatePfpFrame(photo, crop)
            : await generateIdCard({
                photo,
                name,
                stack,
                teamName,
                teamCode,
                builderTitle,
                crop,
                qrUrl:
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "https://hhgoa.com",
              });

        if (cancelled) return;

        const url = URL.createObjectURL(out);

        // Pre-decode image before swapping state to guarantee flicker-free live sync
        const tempImg = new Image();
        tempImg.onload = () => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          if (latestUrl.current) URL.revokeObjectURL(latestUrl.current);
          latestUrl.current = url;
          setBlob(out);
          setPreviewUrl(url);
          setBusy(false);
        };
        tempImg.onerror = () => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          if (latestUrl.current) URL.revokeObjectURL(latestUrl.current);
          latestUrl.current = url;
          setBlob(out);
          setPreviewUrl(url);
          setBusy(false);
        };
        tempImg.src = url;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Generation failed");
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    photo,
    format,
    name,
    stack,
    teamName,
    teamCode,
    builderTitle,
    crop,
  ]);

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

  function resetForm() {
    setPhoto(null);
    setCrop(DEFAULT_CROP);
    setName("");
    setStack("");
    setTeamName("");
    setTeamCode("");
    setPreviewUrl(null);
    setBlob(null);
    setError(null);
    setToast(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function shareToPlatform(platform: "x" | "linkedin") {
    if (!blob) return;
    setSharing(true);
    setError(null);
    setToast(null);

    let createdShareUrl: string | undefined = undefined;

    // Background upload for share page metadata
    try {
      const form = new FormData();
      form.append("image", blob, "frame.png");
      form.append("format", format);
      form.append("name", name);
      form.append("title", format === "id" ? builderTitle : "PFP Frame");
      const res = await fetch("/api/share", { method: "POST", body: form });
      const data = await res.json();
      if (data && data.shareUrl) {
        createdShareUrl = data.shareUrl;
      }
    } catch {
      // metadata upload optional
    }

    if (platform === "linkedin") {
      const liCaption = linkedinShareCaption(
        name || undefined,
        format === "id" ? builderTitle : undefined,
        createdShareUrl,
      );

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(liCaption);
        }
      } catch {
        // clipboard error fallback
      }

      const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(liCaption)}`;
      window.open(linkedinUrl, "_blank", "noopener,noreferrer");
      setToast("Opening LinkedIn! Full caption copied to clipboard — paste if needed.");
    } else {
      const fullCaption = shareCaption(
        name || undefined,
        format === "id" ? builderTitle : undefined,
      );

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fullCaption);
        }
      } catch {
        // clipboard error fallback
      }

      const intent = `https://x.com/intent/post?text=${encodeURIComponent(fullCaption)}`;
      window.open(intent, "_blank", "noopener,noreferrer");
      setToast("Opening X! Caption copied with #FrameInGoa.");
    }

    setSharing(false);
  }

  function checkCompulsoryFields(): string[] {
    const missing: string[] = [];
    if (!photo) missing.push("Image / Photo");
    if (format === "id") {
      if (!name.trim()) missing.push("Name");
      if (!stack.trim()) missing.push("Role / Stack");
      if (!teamName.trim()) missing.push("Team Name");
      if (!teamCode.trim()) missing.push("Team Code");
    }
    return missing;
  }

  function showValidationPopup(missing: string[]) {
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    setValidationToast({ missing });

    validationTimerRef.current = setTimeout(() => {
      dismissValidationPopup();
    }, 5000);
  }

  function dismissValidationPopup() {
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
      validationTimerRef.current = null;
    }
    if (validationToastRef.current) {
      gsap.to(validationToastRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 15,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setValidationToast(null);
        },
      });
    } else {
      setValidationToast(null);
    }
  }

  // GSAP Entrance animation for validation toast popup (Top on mobile, Bottom-Right on desktop)
  useEffect(() => {
    if (validationToast && validationToastRef.current) {
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      gsap.fromTo(
        validationToastRef.current,
        {
          opacity: 0,
          scale: 0.88,
          y: isMobile ? -35 : 35,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.45,
          ease: "back.out(1.7)",
        }
      );
    }
  }, [validationToast]);

  function handleDownload() {
    const missing = checkCompulsoryFields();
    if (missing.length > 0) {
      showValidationPopup(missing);
      return;
    }
    download();
  }

  function handleShare(platform: "x" | "linkedin") {
    const missing = checkCompulsoryFields();
    if (missing.length > 0) {
      showValidationPopup(missing);
      return;
    }
    void shareToPlatform(platform);
  }

  // GSAP silky hover micro-animations
  function onPillMouseEnter(e: React.MouseEvent<HTMLElement>) {
    gsap.to(e.currentTarget, {
      y: -3,
      scale: 1.02,
      duration: 0.28,
      ease: "power2.out",
    });
  }

  function onPillMouseLeave(e: React.MouseEvent<HTMLElement>) {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.35,
      ease: "power2.out",
    });
  }

  function onIconMouseEnter(e: React.MouseEvent<HTMLButtonElement>, rotateDeg: number) {
    const icon = e.currentTarget.querySelector("svg");
    gsap.to(e.currentTarget, {
      scale: 1.22,
      rotation: rotateDeg,
      duration: 0.3,
      ease: "back.out(2)",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1.15,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }

  function onIconMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    const icon = e.currentTarget.querySelector("svg");
    gsap.to(e.currentTarget, {
      scale: 1,
      rotation: 0,
      duration: 0.35,
      ease: "power2.out",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
      });
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

        {photo ? (
          <PhotoAdjuster
            photo={photo}
            shape={format === "id" ? "circle" : "square"}
            value={crop}
            onChange={setCrop}
          />
        ) : null}

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
        {toast ? <div className="toast">{toast}</div> : null}
      </div>

      <div className="preview-panel">
        <div className={`preview-frame ${format}`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Generated HH Goa graphic preview" ref={imgRef} />
          ) : (
            <div className="preview-empty" ref={emptyRef}>
              <p>Your {format === "id" ? "builder ID" : "PFP frame"} appears here</p>
              <span>{busy ? "Rendering..." : "Upload to start"}</span>
            </div>
          )}
        </div>

        <div className="actions">
          <button
            type="button"
            ref={downloadBtnRef}
            className="btn accent"
            disabled={busy}
            onClick={handleDownload}
            onMouseEnter={onPillMouseEnter}
            onMouseLeave={onPillMouseLeave}
          >
            Download PNG
          </button>
          <div
            className="share-pill-bar"
            onMouseEnter={onPillMouseEnter}
            onMouseLeave={onPillMouseLeave}
          >
            <span className="share-pill-label">Share to</span>
            <div className="share-pill-icons">
              <button
                type="button"
                className="share-icon-btn x-btn"
                title="Share to X"
                aria-label="Share to X"
                disabled={sharing || busy}
                onClick={() => handleShare("x")}
                onMouseEnter={(e) => onIconMouseEnter(e, -6)}
                onMouseLeave={onIconMouseLeave}
              >
                <IconX />
              </button>
              <button
                type="button"
                className="share-icon-btn li-btn"
                title="Share to LinkedIn"
                aria-label="Share to LinkedIn"
                disabled={sharing || busy}
                onClick={() => handleShare("linkedin")}
                onMouseEnter={(e) => onIconMouseEnter(e, 6)}
                onMouseLeave={onIconMouseLeave}
              >
                <IconLinkedin />
              </button>
            </div>
          </div>
        </div>
        {blob ? (
          <button type="button" className="btn ghost-reset" onClick={resetForm}>
            <span className="reset-icon">＋</span> Create Another Frame
          </button>
        ) : null}
        <p className="share-note">
          1-click share opens a pre-filled post with #FrameInGoa for X &amp; LinkedIn. Use &apos;Download PNG&apos; to save your graphic anytime.
        </p>

        {mounted && validationToast
          ? createPortal(
              <div className="validation-toast-popup" ref={validationToastRef}>
                <div className="v-toast-header">
                  <span className="v-toast-tag">⚠️ REQUIRED</span>
                  <button
                    type="button"
                    className="v-toast-close"
                    onClick={dismissValidationPopup}
                    aria-label="Close notification"
                  >
                    ✕
                  </button>
                </div>
                <p className="v-toast-body">
                  Complete these fields to share or download:
                </p>
                <div className="v-toast-badges">
                  {validationToast.missing.map((item) => (
                    <span key={item} className="v-toast-badge">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="v-toast-progress-bar" />
              </div>,
              document.body
            )
          : null}
      </div>
    </section>
  );
}