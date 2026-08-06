import Link from "next/link";
import Generator from "@/components/Generator";
import { EVENT } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="site">
      <header className="topbar">
        <Link className="brand-mark" href="/" aria-label="HH Goa home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/Hacker_house.png" alt="" />
          <span>HH Goa {EVENT.year}</span>
        </Link>
        <div className="topbar-meta">
          {EVENT.place}
          <br />
          {EVENT.dates}
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
