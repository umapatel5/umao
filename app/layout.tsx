import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Umao",
  description: "Warm technical interview practice for coding, communication, and feedback."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
