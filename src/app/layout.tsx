"use client";

import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Live2D Core Scripts */}
        <Script src="/js/live2dcubismcore.min.js" strategy="beforeInteractive" />
        <Script src="/js/live2d.min.js" strategy="beforeInteractive" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nextProvider i18n={i18n}>
          {children}
          <Toaster />
        </I18nextProvider>
      </body>
    </html>
  );
}
