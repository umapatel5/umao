import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewOS",
  description: "AI technical interview simulator shell"
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
