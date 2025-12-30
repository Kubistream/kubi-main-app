import { Metadata } from "next";
import { getOverlaySettings } from "./actions";
import { OverlayEditor } from "./overlay-editor";

export const metadata: Metadata = {
    title: "Overlay Editor | CryptoStream",
    description: "Customize your OBS donation overlay",
};

export default async function OverlayDashboardPage() {
    const settings = await getOverlaySettings();

    return <OverlayEditor initialSettings={settings} />;
}
