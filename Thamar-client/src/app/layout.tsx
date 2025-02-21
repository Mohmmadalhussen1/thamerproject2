import type { Metadata } from "next";
import "./globals.css";
import { Nunito_Sans } from "next/font/google";

// If loading a variable font, you don't need to specify the font weight
const inter = Nunito_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Thamer",
  description: "Your gateway to local content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
