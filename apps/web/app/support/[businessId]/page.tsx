// Public customer support portal route.
import { PublicSupportPortal } from "../../../components/PublicSupportPortal";

export default async function SupportPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return <PublicSupportPortal businessId={businessId} />;
}
