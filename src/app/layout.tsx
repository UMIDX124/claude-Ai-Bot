import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alpha Command Center",
  description: "Operations, CRM, and support for DPL · VCS · BSL",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230D0D0D'/><text x='50' y='68' text-anchor='middle' font-size='52' font-family='Inter,sans-serif' font-weight='700' fill='%23F59E0B'>A</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#F59E0B",
          colorBackground: "#0D0D0D",
          colorInputBackground: "#1F1F1F",
          colorText: "#FAFAFA",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${playfair.variable} ${inter.variable} min-h-full antialiased bg-[#0D0D0D] text-[#FAFAFA]`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
