# HH Goa 2026 · Frame / ID Card Generator

Live tool for [Hacker House Goa 2026](https://hhgoa.com/) shortlisting Task #1.

**Live Demo:** [https://hhgoa-id.netlify.app](https://hhgoa-id.netlify.app)

Upload a photo → get a branded **Builder ID** or **PFP frame** in seconds → download PNG → **Share to X** with a pre-filled caption including `#FrameInGoa` and an OG preview of your exact graphic.

## Features

- **Format A — PFP Frame**: square overlay ready for an X profile picture
- **Format B — Builder ID**: name, stack/role, generated builder class
- HEIC/HEIF (iPhone), JPG, PNG, WEBP
- Cover-crop handles portrait, landscape, and off-center photos
- No login / signup wall
- Share page with Open Graph + Twitter card image = your generated PNG

## Quick start

```bash
npm install
npm install gsap
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `NEXT_PUBLIC_SITE_URL` to your public URL before sharing (needed for correct OG / tweet links).

## Deploy

Works on any Node host (Vercel, Railway, Render, Fly).

1. Push this repo
2. Set `NEXT_PUBLIC_SITE_URL` to the production origin (e.g. `https://your-app.vercel.app`)
3. Deploy

> On Vercel, share images are stored under `/tmp` (ephemeral). For durable shares on serverless, point storage at a blob store or deploy on a host with persistent disk. Local / long-running Node keeps files in `data/shares/`.

## Share flow

1. Generate graphic in the browser (canvas)
2. **Share to X** uploads the PNG to `POST /api/share`
3. Opens X intent with caption + `/s/{id}`
4. `/s/{id}` serves OG/Twitter meta whose `og:image` is `/api/share/{id}`

## Stack

- Next.js 15 (App Router)
- Canvas generation client-side
- Imbue + Victor Mono (official HH Goa type pairing)
- Brand colors from [hhgoa.com](https://hhgoa.com/): green `#0B6839`, yellow `#FEE101`, pink `#FF0080`

## Submit checklist

- [x] Live link: [hhgoa-id.netlify.app](hhgoa-id.netlify.app)
- [ ] Post on X with `#FrameInGoa`
- [ ] Form: https://forms.gle/jM5hTaGvsrfEfixPA
- Deadline: **11:59 pm, 13 August 2026**
