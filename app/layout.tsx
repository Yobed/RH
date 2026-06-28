import type { Metadata } from "next";
import { Lato, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/rh/ThemeProvider";

// Police principale : Lato — la police signature d'Odoo (corps + titres).
const lato = Lato({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "700", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RH Manager CI",
  description: "Gestion des ressources humaines — Droit ivoirien",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${lato.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className={lato.className}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
