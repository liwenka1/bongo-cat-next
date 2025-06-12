"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import type { Metadata } from "next";
import { ConfigProvider } from 'antd';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BongoCat Next",
  description: "Desktop pet application built with Next.js and Tauri",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1677ff',
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
