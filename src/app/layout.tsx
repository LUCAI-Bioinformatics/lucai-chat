// src/app/layout.tsx
import "./globals.css";
import { Roboto, Sora } from "next/font/google";
import Providers from "./providers";


const roboto = Roboto({ subsets: ["latin"], weight: ["400","500","700"], display: "swap" });
const sora   = Sora({   subsets: ["latin"], weight: ["400","600","700","800"], display: "swap", variable: "--font-sora" });

export const metadata = {
  title: "LUCAI — Chat",
  description: "Login + Chat",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <Providers>
      <body
        id="lucai-app"
        className={`${roboto.className} ${sora.variable}`}
        style={{ background: "#0b0b0b", color: "var(--lu-text)" }}
      >
        {children}
      </body></Providers>
    </html>
  );
}
