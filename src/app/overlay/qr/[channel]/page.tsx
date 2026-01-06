"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function QRCodeOverlayPage() {
    const params = useParams<{ channel: string }>();
    const channel = params?.channel ?? "";
    const [donateUrl, setDonateUrl] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");

    useEffect(() => {
        if (!channel) return;

        // Build donate URL
        const baseUrl = window.location.origin;
        const donationUrl = `${baseUrl}/donate/${channel}`;
        setDonateUrl(donationUrl);

        // Generate QR code URL (increased size, white on transparent)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(donationUrl)}&color=000000&bgcolor=ffffff&margin=10`;
        setQrCodeUrl(qrUrl);
    }, [channel]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent p-8">
            <div className="w-[450px] relative">
                {/* Floating accent circle - Animated */}
                <div
                    className="absolute -right-4 -top-6 w-16 h-16 bg-accent-yellow rounded-full z-0 animate-bounce"
                    style={{ animationDuration: "3s" }}
                />

                {/* Black shadow layer */}
                <div className="absolute -left-2 -bottom-2 w-full h-full bg-black rounded-2xl z-0" />

                {/* Main card */}
                <div className="relative rounded-2xl p-6 border-2 bg-[#181033] border-white z-10 flex flex-col gap-4 shadow-[0_0_0_4px_#000,8px_8px_0_0_rgba(247,120,186,1)]">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent-cyan w-12 h-12 flex items-center justify-center rounded-lg border-2 border-white shadow-[2px_2px_0px_0px_#000]">
                                <span className="material-symbols-outlined text-2xl text-black font-black">qr_code_2</span>
                            </div>
                            <div>
                                <div className="text-xs font-black tracking-wider uppercase text-accent-pink mb-0.5">
                                    Support the Stream
                                </div>
                                <h3 className="text-2xl font-black leading-none text-white">
                                    Scan to Donate
                                </h3>
                            </div>
                        </div>

                        {/* Live Badge */}
                        <div className="bg-red-500 text-white border-2 border-black rounded-lg px-2 py-1 flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] transform -rotate-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-[11px] font-black uppercase">Live</span>
                        </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white rounded-xl p-6 border-2 border-black relative overflow-hidden flex items-center justify-center">
                        <div className="absolute top-0 right-0 w-24 h-full bg-accent-yellow/20 skew-x-12 transform translate-x-8" />
                        {qrCodeUrl && (
                            <img
                                src={qrCodeUrl}
                                alt="Donation QR Code"
                                className="w-64 h-64 relative z-10"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
