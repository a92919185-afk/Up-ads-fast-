import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Upadsfast — Google Ads Bulk Upload Generator",
  description: "Transforma páginas de oferta em planilhas .xlsx prontas para Google Ads em segundos.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${inter.variable} font-sans antialiased bg-[#0a0a0a] text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
