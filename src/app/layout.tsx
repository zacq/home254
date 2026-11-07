import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Premium Washing Machines & Laundry Appliances Kenya", template: "%s" },
  description:
    "Premium MIKA front-load washers, washer-dryer combos and heat-pump dryers in Kenya. Free delivery & installation in zones, M-Pesa and Pay on Delivery.",
};

export const viewport: Viewport = { themeColor: "#0b5563", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
