import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "NyumbaniAppliances | TVs, Fridges, Washers & Cookers at the Best Price in Kenya", template: "%s | NyumbaniAppliances" },
  description:
    "Shop TVs, audio, fridges, washing machines, cookers and home appliances in Kenya at or below the market price. Earn Rewards points on every purchase. M-Pesa and Pay on Delivery.",
  applicationName: "NyumbaniAppliances",
};

export const viewport: Viewport = { themeColor: "#0b5563", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
