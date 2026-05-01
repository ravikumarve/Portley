import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portley - Your Portal. Your Brand. Your Clients.",
  description: "White-label client portal for freelancers and agencies. Projects, files, invoicing, and real-time messaging — all under your brand.",
  keywords: ["client portal", "freelancer tools", "agency management", "project management", "white-label"],
  authors: [{ name: "Portley" }],
  creator: "Portley",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://portley.app",
    title: "Portley - Your Portal. Your Brand. Your Clients.",
    description: "White-label client portal for freelancers and agencies. Projects, files, invoicing, and real-time messaging — all under your brand.",
    siteName: "Portley",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portley - Your Portal. Your Brand. Your Clients.",
    description: "White-label client portal for freelancers and agencies. Projects, files, invoicing, and real-time messaging — all under your brand.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
