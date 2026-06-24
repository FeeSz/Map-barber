import "./globals.css";
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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
      className={cn("h-full antialiased selection:bg-lime-500/30 selection:text-white", "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} h-full bg-[#030303] text-[#f5f5f7] m-0 p-0 overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}