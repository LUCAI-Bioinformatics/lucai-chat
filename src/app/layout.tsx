import "./globals.css";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "LUCAI — Chat",
  description: "Login + Chat",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body
        id="lucai-app"
        className={roboto.className}
        style={{ background: "#0b0b0b", color: "var(--lu-text)" }}
      >
        {children}
      </body>
    </html>
  );
}
