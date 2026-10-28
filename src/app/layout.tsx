import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Montserrat, Oswald } from "next/font/google";
import { connection } from "next/server";
import { Atmosphere } from "@/components/fx/Atmosphere";
import { Cursor } from "@/components/fx/Cursor";
import { Preloader } from "@/components/fx/Preloader";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { I18nProvider } from "@/i18n/client";
import { getDictionary } from "@/i18n/server";
import "./globals.css";

const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin", "cyrillic"], weight: ["500", "700"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin", "cyrillic"], weight: ["300", "400", "500"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: { default: t.meta.title, template: "%s · Hollowmere" },
    description: t.meta.description,
  };
}

export const viewport: Viewport = {
  themeColor: "#060708",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Render per request: the CSP nonce from src/proxy.ts is new for every response.
  await connection();
  const { locale } = await getDictionary();

  return (
    <html lang={locale} className={`${oswald.variable} ${cormorant.variable} ${montserrat.variable}`}>
      <body>
        <I18nProvider locale={locale}>
          <Preloader />
          <SmoothScroll />
          <Atmosphere />
          <Cursor />
          <Header />
          {children}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
