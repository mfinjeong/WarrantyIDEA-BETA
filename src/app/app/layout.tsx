import { Shell } from "@/components/layout/shell";
import { requirePageUser } from "@/lib/server/session";
export const dynamic = "force-dynamic";
export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageUser();
  return <Shell>{children}</Shell>;
}
