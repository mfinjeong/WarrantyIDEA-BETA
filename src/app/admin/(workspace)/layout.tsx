import { Shell } from "@/components/layout/shell";
import { requirePageUser } from "@/lib/server/session";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageUser(true);
  return <Shell admin>{children}</Shell>;
}
