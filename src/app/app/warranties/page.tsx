import { Suspense } from "react";
import { WarrantyList } from "@/features/warranties/list";
import { Skeleton } from "@/components/ui";
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <WarrantyList />
    </Suspense>
  );
}
