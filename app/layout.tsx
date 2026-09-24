import type { Metadata, Viewport } from "next";
import { Lora, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Gest-224",
  description: "Gestion commerciale multi-entreprises",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gest-224",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f3d2c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${lora.variable} ${inter.variable} ${ibmPlexMono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
