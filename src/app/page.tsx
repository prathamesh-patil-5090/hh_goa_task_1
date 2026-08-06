import Link from "next/link";
import Generator from "@/components/Generator";
import { EVENT } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="site">
      <header className="topbar">
        <div className="topbar-brand-section">
          <Link className="brand-mark" href="/" aria-label="Hacker House Goa home">
            <span className="brand-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/Hacker_house.png" alt="Hacker House" className="hacker-house-img" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/goa_hindi.svg" alt="गोवा" className="goa-hindi-badge" />
            </span>
          </Link>
          <div className="topbar-sub-text">
            <span>{EVENT.place}</span>
            <span>·</span>
            <span>{EVENT.dates}</span>
          </div>
        </div>
        <div className="topbar-studio-section">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/2-47.svg" alt="2:47pm Studio" className="topbar-studio-img" />
        </div>
      </header>

      <section className="hero">
        <h1>
          Frame in <em>Goa</em>
        </h1>
        <p>
          Upload a photo. Walk away with an official Hacker House Goa 2026 builder
          ID or PFP frame — download it, then post with {EVENT.hashtag}.
        </p>
        <div className="hero-cta">
          <a className="pill" href="#make">
            Make your frame
          </a>
          <a
            className="pill ghost"
            href="https://hhgoa.com/"
            target="_blank"
            rel="noreferrer"
          >
            Event site
          </a>
        </div>
      </section>

      <Generator />

      <footer className="footer">
        <span>
          {EVENT.full} · {EVENT.dates}
        </span>
        <a href="https://hhgoa.com/" target="_blank" rel="noreferrer">
          hhgoa.com
        </a>
      </footer>
    </div>
  );
}
