import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mapa de Filiais",
  description: "Localização e gerenciamento das filiais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full antialiased selection:bg-lime-500/30 selection:text-white",
        "font-sans",
        inter.variable
      )}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="h-full bg-[#030303] text-[#f5f5f7] m-0 p-0 overflow-hidden">
        {children}
      </body>
    </html>
  );
}