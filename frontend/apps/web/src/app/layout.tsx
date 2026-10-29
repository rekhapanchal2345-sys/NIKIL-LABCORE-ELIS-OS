import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NIKIL-LABCORE-ELIS-OS | Next-Gen Hospital, Diagnostic Lab & Clinic Operating System",
  description:
    "Enterprise Healthcare OS engineered by Nikil. Pathology LIS, Bi-Directional Analyzer Interfacing, OPD/IPD Hospital Management, ABDM M1-M3, Smart Billing & WhatsApp QR Reports.",
  openGraph: {
    title: "NIKIL-LABCORE-ELIS-OS | Next-Gen Hospital, Diagnostic Lab & Clinic Operating System",
    description:
      "Enterprise Healthcare OS engineered by Nikil. Pathology LIS, Bi-Directional Analyzer Interfacing, OPD/IPD Hospital Management, ABDM M1-M3, Smart Billing & WhatsApp QR Reports.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NIKIL-LABCORE-ELIS-OS | Next-Gen Hospital, Diagnostic Lab & Clinic Operating System",
    description:
      "Enterprise Healthcare OS engineered by Nikil. Pathology LIS, Bi-Directional Analyzer Interfacing, OPD/IPD Hospital Management, ABDM M1-M3, Smart Billing & WhatsApp QR Reports.",
  },
  keywords: [
    "Hospital OS",
    "Laboratory Information System",
    "LIS",
    "HMIS",
    "Bi-directional Analyzer",
    "NABL",
    "NABH",
    "ABDM",
    "Nikil LabCore",
    "Diagnostic Software",
    "Clinic Management",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0284c7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
