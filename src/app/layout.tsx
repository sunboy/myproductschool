import type { Metadata } from "next";
import { Nunito_Sans, Literata } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: 'HackProduct',
    template: '%s | HackProduct',
  },
  description: 'A practice gym for product thinking — for engineers in interviews and on the job.',
  keywords: ['product sense', 'PM interview prep', 'product thinking', 'software engineers', 'product manager interview'],
  openGraph: {
    title: 'HackProduct',
    description: 'A practice gym for product thinking — for engineers in interviews and on the job.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackProduct',
    description: 'A practice gym for product thinking — for engineers in interviews and on the job.',
  },
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
      </body>
    </html>
  );
}
