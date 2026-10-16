import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { DemoProvider } from "@/lib/demo/provider";
import { Toasts } from "@/components/ui";

export const metadata: Metadata = {
  title: {
    default: "WarrantyIDEA — Garansi tersimpan, pikiran tenang",
    template: "%s · WarrantyIDEA",
  },
  description:
    "Arsip garansi produk dalam satu tempat. Jelajahi demo frontend WarrantyIDEA.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Lewati ke konten utama
        </a>
        <DemoProvider>
          {children}
          <Toasts />
        </DemoProvider>
      </body>
    </html>
  );
}
