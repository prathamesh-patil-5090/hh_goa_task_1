# 🌴 Hacker House Goa 2026 - Builder ID & PFP Frame Generator

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hhgoa--id.netlify.app-0B6839?style=for-the-badge&logo=netlify)](https://hhgoa-id.netlify.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

An official interactive web app built for [Hacker House Goa 2026](https://hhgoa.com/) shortlisting Task #1. Upload any photo, customize your details, and instantly generate high-resolution, pixel-perfect **Builder ID Cards** and **PFP Frames**.

---

## ✨ Features

- 🎴 **Dual Output Formats**:
  - **Builder ID Card**: Branded ID card with name, role/stack, team info, assigned builder class, and official event details.
  - **PFP Frame**: Square profile frame ready for X (Twitter) profile pictures.
- 📸 **Mobile-First Photo Pipeline**:
  - Auto-converts Apple **HEIC/HEIF** camera roll photos natively in-browser via `heic2any`.
  - Normalizes EXIF image orientation (iOS Safari & Android).
  - Client-side downscaling & memory management for zero canvas lag on mobile devices.
- 🎨 **Official Brand Design System**:
  - Official typography pairing: **Imbue** (Display serif) + **Victor Mono** (Monospace).
  - Brand color palette: Deep Goa Green (`#0B6839`), Sunrise Yellow (`#FEE101`), Vibrant Pink (`#FF0080`), Off-White (`#FFFBE8`).
  - Custom `HACKER [गोवा] HOUSE` branding header with solid Hindi calligraphy.
- ⚡ **Multi-Platform 1-Click Sharing (X & LinkedIn)**:
  - **X (Twitter)**: Opens `x.com/intent/post` directly with a pre-filled caption including `#FrameInGoa` and official live link.
  - **LinkedIn**: One-click sharing with dedicated multi-line caption formatting, live URL, and hashtags (`#FrameInGoa #HackerHouseGoa #BuildInPublic`).
- 🚀 **GSAP Animations & Compulsory Validation**:
  - Silky GSAP spring hover physics (`back.out(2)`) on social icons and action pills.
  - Compulsory field validation for Image, Name, Role/Stack, Team Name, and Team Code.
  - Responsive GSAP popup toast (Docked at **Top Center on Mobile** & **Bottom Right on Laptop/PC**) with 5-second auto-dismiss.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) & React 19 |
| **Styling** | Custom Design Tokens & Vanilla CSS System |
| **Animations** | GSAP 3 (GreenSock) |
| **Graphics Engine** | HTML5 2D Canvas API + Custom Asset Cache |
| **Photo Conversion** | `heic2any` (iPhone HEIC to JPEG) |
| **Storage / Blobs** | `@netlify/blobs` + Node.js `/tmp` Fallback |
| **Language** | TypeScript (Strict Mode) |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/prathamesh-patil-5090/hh_goa_task_1.git
cd hh_goa_task_1

# Install dependencies
npm install
npm install gsap
```

### 2. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

> **Note**: Running `npm run dev` automatically executes `predev` (`scripts/kill-port.js`), clearing port `3000` if occupied, and launches Next.js cleanly on **`http://localhost:3000`**.

---

## 🌐 Deployment

### Netlify Deployment

This repository is optimized out-of-the-box for **Netlify** with `@netlify/blobs` integration:

1. Push your repository to GitHub.
2. Link the repository on Netlify.
3. Set the environment variable:
   ```env
   NEXT_PUBLIC_SITE_URL=https://hhgoa-id.netlify.app
   ```
4. Deploy!

---

## 📋 Task Submission Checklist

- [x] **Live Demo**: [hhgoa-id.netlify.app](https://hhgoa-id.netlify.app)
- [x] **Repository**: [GitHub Repo](https://github.com/prathamesh-patil-5090/hh_goa_task_1)
- [x] **X Post**: [View Announcement Post on X](https://x.com/aniketprsad/status/2086161950757769642?s=20)
- [x] **Submission Form**: Submitted! ([Google Form](https://forms.gle/jM5hTaGvsrfEfixPA))
- ⏰ **Deadline**: **11:59 PM, 13 August 2026**

---

<p center="align">
  Built with ❤️ for <b>Hacker House Goa 2026</b> by <b>2:47 PM STUDIO</b>.
</p>
