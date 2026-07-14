import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BM Booking", template: "%s — BM Booking" },
  description: "Book appointments, manage health cards, and access care from your phone.",
  icons: {
    icon: "/bm-booking.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
