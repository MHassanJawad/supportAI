// Root layout for the SupportAI dashboard app.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportAI",
  description: "Multi-tenant AI customer support dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
