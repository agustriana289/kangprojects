import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { createClient } from "@/utils/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fungsi fetch dengan try-catch agar tidak merusak build / render jika DB belum siap
async function getSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    return data || {};
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings?.website_name || "Kanglogo";
  const desc = settings?.description || settings?.seo_og_description || "Premium Logo Design Services";
  
  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description: desc,
    keywords: settings?.seo_keywords || "",
    authors: settings?.seo_author ? [{ name: settings.seo_author }] : undefined,
    robots: settings?.seo_meta_robots || "index, follow",
    openGraph: {
      type: "website",
      url: settings?.seo_canonical_url || "",
      title: settings?.seo_og_title || title,
      description: settings?.seo_og_description || desc,
      images: settings?.seo_og_image ? [{ url: settings.seo_og_image }] : undefined,
      siteName: title,
    },
    twitter: {
      card: settings?.seo_twitter_card || "summary_large_image",
      title: settings?.seo_twitter_title || title,
      description: settings?.seo_twitter_description || desc,
      creator: settings?.seo_twitter_handle || "",
    },
    icons: {
      icon: settings?.favicon_url || "/favicon.ico",
      shortcut: settings?.favicon_url || "/favicon.ico",
      apple: settings?.favicon_url || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  // Ambil custom HTML jika ada, pastikan tidak null sebelum direplace
  const customHeaderHtml = settings?.header_custom_html || "";

  return (
    <html lang="en">
      <head>
        {/* Render CSS variable dinamis */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary: ${settings?.color_primary || "#4f46e5"};
              --secondary: ${settings?.color_secondary || "#6366f1"};
            }
          `
        }} />

        {/* Inject Custom Header HTML dari settings dengan aman */}
        {customHeaderHtml && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const div = document.createElement('div');
                  div.innerHTML = \`${customHeaderHtml.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
                  Array.from(div.children).forEach(child => document.head.appendChild(child));
                } catch (e) {
                  console.error("Error inserting custom header html", e);
                }
              `
            }}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
           {children}
        </ToastProvider>
      </body>
    </html>
  );
}
