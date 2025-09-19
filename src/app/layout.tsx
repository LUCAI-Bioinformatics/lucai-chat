import "./globals.css";

export const metadata = {
  title: "LUCAI Chat (MVP)",
  description: "Login dummy → Chat simple",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body id="lucai-app" className="lu:antialiased lu:min-h-screen lu:bg-white lu:text-slate-900">
        {children}
      </body>
    </html>
  );
}
