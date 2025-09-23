// src/app/layout.tsx
import "./globals.css";
import { Roboto, Sora } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-sora",
});

export const metadata = {
  title: "LUCAI — Chat",
  description: "Login + Chat",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        {/* vendor scopeado para WP/Elementor */}
        <link rel="stylesheet" href="/vendor/lucai.scoped.css" />
        {/* favicons si los tenés */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        id="lucai-app"                                        // ⬅️ ¡IMPORTANTE!
        className={`${roboto.className} ${sora.variable}`}    // tipografías
        style={{ background: "#0b0b0b", color: "var(--lu-text)" }}
      >
        {children}
      </body>
    </html>
  );
}
