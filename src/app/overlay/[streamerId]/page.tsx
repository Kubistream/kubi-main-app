import { getPublicOverlaySettings } from "@/app/dashboard/overlay/actions";
import OverlayClient from "./overlay-client";

export default async function OverlayPage(props: { params: Promise<{ streamerId: string }> }) {
  const params = await props.params;
  const streamerId = params.streamerId;
  const settings = await getPublicOverlaySettings(streamerId);

  return <OverlayClient settings={settings as any} streamerId={streamerId} />;
}
