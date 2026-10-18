import { Shell } from "@/components/layout/shell";
import { requirePageUser } from "@/lib/server/session";
export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageUser();
  return <Shell>{children}</Shell>;
}
