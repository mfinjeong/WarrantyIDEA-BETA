import { Suspense } from "react";
import { WarrantyDetail } from "@/features/warranties/detail";
import { Skeleton } from "@/components/ui";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton />}>
      <WarrantyDetail id={id} />
    </Suspense>
  );
}
