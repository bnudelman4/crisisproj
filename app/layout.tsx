import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/motion/SmoothScrollProvider";
import { AuthProvider } from "@/components/auth/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Bridge — Coordination, not chaos.",
  description:
    "Crisis coordination software with a human approval gate at every step. Bridge turns scattered messages from SMS, GroupMe, Discord, and forms into structured, prioritized dispatches a coordinator can approve.",
  metadataBase: new URL("https://bridge.local"),
  openGraph: {
    title: "Bridge — Coordination, not chaos.",
    description:
      "Crisis coordination software with a human approval gate at every step.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable} overflow-x-clip`}
    >
      <body className="bg-canvas text-ink antialiased overflow-x-clip relative">
        <AuthProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
