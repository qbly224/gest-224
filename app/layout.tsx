import type { Metadata, Viewport } from "next";
import { Lora, Inter, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CookieConsent } from "@/components/app/cookie-consent";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gest-224.onrender.com"),
  title: {
    default: "Gest-224",
    template: "%s | Gest-224",
  },
  description: "Gestion commerciale multi-entreprises",
  openGraph: {
    siteName: "Gest-224",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gest-224",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f3d2c",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${lora.variable} ${inter.variable} ${ibmPlexMono.variable} font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
