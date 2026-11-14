import { RecoveryLinkHandler } from "@/components/auth/recovery-link-handler";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MedIntel",
    template: "%s · MedIntel",
  },
  description:
    "Independent Medical Affairs and Clinical Intelligence demonstration portfolio — synthetic data only, not for clinical decision-making.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          <RecoveryLinkHandler />
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
