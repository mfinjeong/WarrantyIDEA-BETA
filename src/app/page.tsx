import { LandingContent } from "@/components/marketing/landing-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "WarrantyIDEA — Garansi jelas, penanganan terlacak" },
  description:
    "Jelajahi simulasi penanganan kerusakan untuk pembeli, pemberi garansi, dan mitra servis. Kolaborasi organisasi masih berupa pratinjau; arsip pribadi tersedia.",
};

export default function Landing() {
  return <LandingContent />;
}
