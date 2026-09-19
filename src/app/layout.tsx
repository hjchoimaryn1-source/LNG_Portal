import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { resolveFieldMode } from "@/cmms-field-guard/core/fieldModeFlag";
import { FieldGuardProvider } from "@/cmms-field-guard/core/FieldGuardContext";
import { FieldSecurityGuard } from "@/cmms-field-guard/security/FieldSecurityGuard";
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
  title: "LNG Virtual Pipeline Portal",
  description: "LNG Virtual Pipeline Integrated Operations & Heat Settlement Portal",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const mode = resolveFieldMode();
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-screen w-screen overflow-hidden antialiased`}
    >
      <body className="h-screen w-screen overflow-hidden flex flex-col bg-[#d4d0c8]">
        <FieldGuardProvider mode={mode}>
          {children}
          <FieldSecurityGuard ip={ip} />
        </FieldGuardProvider>
      </body>
    </html>
  );
}
