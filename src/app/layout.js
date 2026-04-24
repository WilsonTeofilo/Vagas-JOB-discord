import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Trampo 💼 — Mural de Vagas e Oportunidades",
  description: "Publique vagas de emprego e serviços freelancer diretamente na comunidade do Discord. Grátis, rápido e seguro.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import Providers from "../components/Providers";
import Footer from "../components/Footer";
import ThemeProvider from "../components/ThemeProvider";
import ThemePreviewListener from "../components/ThemePreviewListener";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ThemeProvider>
          <ThemePreviewListener />
          <Providers>{children}</Providers>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
