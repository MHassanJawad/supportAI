// Root layout for the SupportAI dashboard app.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportAI",
  description: "Business AI support platform for RAG-powered customer service"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
