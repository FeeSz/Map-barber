import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Garante carregamento imediato sem flickering
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased selection:bg-lime-500/30 selection:text-white">
      <body 
        className={`${inter.className} h-full bg-[#030303] text-[#f5f5f7] m-0 p-0 overflow-hidden select-none`}
        style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
      >
        {children}
      </body>
    </html>
  );
}
