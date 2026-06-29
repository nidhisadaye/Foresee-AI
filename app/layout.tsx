import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Foresee AI | Decision Intelligence",
  description: "Think Ahead. Decide Better. Analyze important decisions before taking action.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
