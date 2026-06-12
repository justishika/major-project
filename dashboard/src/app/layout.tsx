import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SimulationProvider } from "@/components/SimulationContext";
import { GlobalHeader } from "@/components/GlobalHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HQ-Stack Research Lab",
  description: "Hybrid Classical-Quantum Benchmark for Multi-Disease Classification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased bg-gray-950`}>
        <SimulationProvider>
          <Sidebar />
          <div className="ml-64 flex flex-col min-h-screen">
            <GlobalHeader />
            <main className="p-8 flex-1">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </SimulationProvider>
      </body>
    </html>
  );
}
