import type { Metadata, Viewport } from "next";
import { Raleway, Literata } from "next/font/google";
import { AnalyticsGate } from "@/components/legal/AnalyticsGate";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { PostHogProvider } from "@/components/PostHogProvider";
import { HatchSonicSurface } from "@/components/shell/HatchSonicSurface";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, imageUrl, SITE_URL } from "@/lib/seo/site";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | HackProduct',
  },
  description: DEFAULT_DESCRIPTION,
  manifest: '/manifest.json',
  keywords: [
    'AI-native learning platform', 'product-minded engineer', 'product sense', 'product thinking',
    'system design practice', 'data modeling practice', 'SQL interview practice', 'coding interview practice',
    'live AI interview practice', 'AI mock interview', 'LeetCode alternative',
    'product manager interview prep', 'PM interview practice', 'product sense interview',
    'Google PM interview', 'Meta PM interview', 'Amazon PM interview', 'FAANG PM interview',
    'software engineer product skills', 'engineer to product manager', 'technical PM',
    'product-minded engineer', 'full stack product thinking', 'engineer PM transition',
    'APM program prep', 'associate product manager', 'product analytics', 'A/B testing product',
  ],
  icons: {
    icon: [
      { url: '/images/logo.png', sizes: '512x512', type: 'image/png' },
      { url: '/images/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/logo.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/images/logo.png',
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    siteName: 'HackProduct',
    url: SITE_URL,
    locale: 'en_US',
    images: [
      {
        url: imageUrl(),
        width: 1200,
        height: 630,
        alt: 'HackProduct AI-native learning platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    creator: '@hackproduct',
    images: [imageUrl()],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'education',
};

export const viewport: Viewport = {
  themeColor: '#4a7c59',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${raleway.variable} ${literata.variable} h-full antialiased`}>
      <head>
        {/* Material Symbols Outlined icon font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <PostHogProvider>
          <HatchSonicSurface />
          {children}
          <CookieBanner />
        </PostHogProvider>
        <AnalyticsGate />
      </body>
    </html>
  );
}
