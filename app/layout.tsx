import type { Metadata, Viewport } from "next";
import { Inter, Urbanist, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "New Creator Assist",
  description: "Track brand collabs, ideas, payments, and profit in one place.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6F9A86",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${urbanist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-background text-ink">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-28 size-72 rounded-full bg-idea min-[900px]:size-136" />
          <div className="absolute -left-20 top-1/3 size-40 rounded-full bg-payment min-[900px]:-bottom-24 min-[900px]:-left-24 min-[900px]:top-auto min-[900px]:size-72" />
          <div className="absolute -right-16 bottom-0 size-32 rounded-full bg-organic min-[900px]:-right-20 min-[900px]:size-72" />
        </div>
        {children}
      </body>
    </html>
  );
}
