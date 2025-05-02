import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { QueryProvider } from "@/providers/query-provider";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MAF Training App",
  description: "Track and analyze your MAF training",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
