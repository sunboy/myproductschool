import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyProductSchool — Product sense training for engineers",
  description:
    "The practice gym for software engineers preparing for PM interviews. Learn frameworks, practice on real scenarios, and get honest feedback from Luma.",
  openGraph: {
    title: "MyProductSchool — Product sense training for engineers",
    description:
      "The practice gym for software engineers preparing for PM interviews. Learn frameworks, practice on real scenarios, and get honest feedback from Luma.",
    url: "https://myproductschool.com",
    siteName: "MyProductSchool",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyProductSchool — Product sense training for engineers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyProductSchool — Product sense training for engineers",
    description:
      "The practice gym for software engineers preparing for PM interviews.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var m=localStorage.getItem('theme');if(m==='dark'||((!m)&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
