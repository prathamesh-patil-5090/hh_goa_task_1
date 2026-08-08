import type { Metadata, Viewport } from "next";
import { Imbue } from "next/font/google";
import "./globals.css";

const imbue = Imbue({
  subsets: ["latin"],
  variable: "--font-imbue",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HH Goa 2026 · Frame / ID Generator",
  description:
    "Upload a photo and get a branded Hacker House Goa 2026 builder ID or PFP frame - download and share with #FrameInGoa.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "HH Goa 2026 · Frame / ID Generator",
    description:
      "Make your official Hacker House Goa 2026 graphic in seconds.",
    type: "website",
  },
  icons: {
    icon: "/favicon.webp",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B6839",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=victor-mono@1,2,3,4,5,6,7&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={imbue.variable}>
        <style>{`
          :root {
            --font-display: ${imbue.style.fontFamily};
          }
          body { font-family: "Victor Mono", ui-monospace, monospace; }
          h1, h2, .brand-mark span, .upload strong, .assigned p, .preview-empty p, .share-inner h1 {
            font-family: var(--font-display), Imbue, Georgia, serif;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
