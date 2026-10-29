import type { Metadata } from "next";
import { Suspense } from "react";
import { Outfit } from "next/font/google";
import { AlertBell } from "@/components/alert-bell";
import { AppShell } from "@/components/app-shell";
import { InlineScript } from "@/components/inline-script";
import { VehicleNav } from "@/components/vehicle-nav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Runs before paint so the saved theme never flashes.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export const metadata: Metadata = {
  title: "Service Schedule",
  description: "Suivi d'entretien pour mes véhicules",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="h-full">
        <AppShell
          alertBell={
            <Suspense fallback={null}>
              <AlertBell />
            </Suspense>
          }
          vehicleNav={
            <Suspense fallback={null}>
              <VehicleNav />
            </Suspense>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
