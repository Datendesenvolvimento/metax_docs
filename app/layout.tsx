import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/auth/auth-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Meta.X Docs",
  description: "Plataforma Meta.X Docs",
  icons: {
    icon: '/icon.png', // 32x32px
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png', // 180x180px
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
