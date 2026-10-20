import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./site.css";

export const metadata: Metadata = {
  title: "WarrantyIDEA | Garansi jelas, penanganan terlacak",
  description:
    "Konsep alur purnajual yang menghubungkan pembeli, pemberi garansi, dan mitra servis. Website presentasi tanpa akun atau penyimpanan data.",
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
        {children}
      </body>
    </html>
  );
}
