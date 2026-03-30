import type { Metadata } from "next";
import { Nunito_Sans, Literata } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const SITE_URL = 'https://hackproduct.dev'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HackProduct | Master Product Sense for Tech Careers',
    template: '%s | HackProduct',
  },
  description: 'The platform where engineers, PMs, and students master product sense. Practice real product decisions, get AI-coached feedback, and ace product interviews at Google, Meta, Amazon, and top startups.',
  keywords: [
    // Core product
    'product sense', 'product thinking', 'product intuition', 'product management',
    // Interview prep
    'product manager interview prep', 'PM interview practice', 'product sense interview',
    'Google PM interview', 'Meta PM interview', 'Amazon PM interview', 'FAANG PM interview',
    'product manager interview questions', 'product design interview', 'product strategy interview',
    // Engineers
    'software engineer product skills', 'engineer to product manager', 'technical PM',
    'product-minded engineer', 'full stack product thinking', 'engineer PM transition',
    // Career
    'tech career growth', 'product career', 'PM career prep', 'tech interview prep',
    'product manager salary', 'break into product management',
    // Comparisons / alternatives
    'LeetCode for product', 'product management practice', 'PM case study practice',
    'product sense exercises', 'product management training',
    // Students
    'APM program prep', 'associate product manager', 'new grad PM', 'MBA PM interview',
    // Skills
    'product metrics', 'product strategy', 'user empathy', 'product roadmap',
    'product prioritization', 'product analytics', 'A/B testing product',
  ],
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'HackProduct | Master Product Sense for Tech Careers',
    description: 'The platform where engineers, PMs, and students master product sense. Practice real product decisions and ace interviews at top tech companies.',
    type: 'website',
    siteName: 'HackProduct',
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackProduct | Master Product Sense for Tech Careers',
    description: 'Practice real product decisions, get AI-coached feedback, and ace product interviews at Google, Meta, Amazon, and top startups.',
    creator: '@hackproduct',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} ${literata.variable} h-full antialiased`}>
      <head>
        {/* Material Symbols Outlined icon font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
