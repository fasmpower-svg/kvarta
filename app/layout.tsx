import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PT_Serif, Golos_Text } from "next/font/google";
import "./globals.css";

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const siteUrl = "https://kvarta.fasmpower.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Кварта — свежая обжарка кофе в Минске",
  description:
    "Маленькая обжарка на Короля, 9. Обжариваем партиями по 5 кг и развозим по Минску — зерно у вас на 1–3 день после обжарки.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "Кварта",
    title: "Кварта — свежая обжарка кофе в Минске",
    description:
      "Обжариваем по четвергам, развозим по пятницам. Эфиопия, Колумбия, Бразилия и дрип-пакеты. Подписка — 2 пачки в месяц.",
    images: [{ url: "/img/hero.jpg", width: 1200, height: 800, alt: "Обжарка зерна" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Кварта — свежая обжарка кофе в Минске",
    description: "Зерно у вас на 1–3 день после обжарки. Обжариваем по четвергам, развозим по пятницам.",
    images: ["/img/hero.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${ptSerif.variable} ${golos.variable}`}>
      <body>{children}</body>
    </html>
  );
}
