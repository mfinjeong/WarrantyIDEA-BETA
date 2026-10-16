import { Suspense } from "react";
import { ReviewsPage } from "@/features/catalog/reviews";
import { Skeleton } from "@/components/ui";
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ReviewsPage />
    </Suspense>
  );
}
