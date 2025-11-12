import type { Metadata } from "next";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  title: "Query Cancel Repro",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

