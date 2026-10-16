import { ReviewDetail } from "@/features/catalog/reviews";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReviewDetail id={id} />;
}
