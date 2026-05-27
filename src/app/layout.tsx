import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Terrain V2",
  description: "Geo-anchored, source-transparent news intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#020617] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
