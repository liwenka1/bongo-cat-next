"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "antd";
import Script from "next/script";
import "antd/dist/reset.css";
import "@/styles/globals.css";

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
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1890ff"
            }
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
