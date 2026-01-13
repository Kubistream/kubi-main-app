"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, Copy, Link, FlaskConical, Video, TrendingUp } from "lucide-react";
import { updateOverlaySettings, sendTestAlert, type OverlaySettingsData } from "./actions";
import { DonationCard } from "@/components/overlay/donation-card";
import { cn } from "@/lib/utils";

type OverlayEditorProps = {
    initialSettings: OverlaySettingsData | null;
};

export function OverlayEditor({ initialSettings }: OverlayEditorProps) {
    const [settings, setSettings] = useState<OverlaySettingsData>(
        initialSettings || {
            theme: "Vibrant Dark",
            animationPreset: "Slide In Left",
            minAmountUsd: 5,
            minAudioAmountUsd: 10,
            minVideoAmountUsd: 20,
            showYieldApy: true,
            textToSpeech: false,
        }
    );

    const [previewKey, setPreviewKey] = useState(0);
    const [showPreviewDonation, setShowPreviewDonation] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Media preview state
    const [previewMediaType, setPreviewMediaType] = useState<"TEXT" | "AUDIO" | "VIDEO">("TEXT");
    const [previewMediaUrl, setPreviewMediaUrl] = useState<string | undefined>(undefined);

    // Debounced save
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                setIsSaving(true);
                await updateOverlaySettings(settings);
            } catch (e) {
                console.error("Failed to save settings", e);
            } finally {
                setIsSaving(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [settings]);

    const handleCopyUrl = () => {
        if (settings.obsUrl) {
            navigator.clipboard.writeText(settings.obsUrl);
            alert("Copied to clipboard!");
        }
    };

    const speakMessage = (text: string) => {
        if (!window.speechSynthesis) return;
        // Cancel any current speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        // Optional: adjust voice/rate/pitch if we want to get fancy later
        window.speechSynthesis.speak(utterance);
    };

    const triggerTestDonation = async (type: "TEXT" | "AUDIO" | "VIDEO" = "TEXT") => {
        // Force animation restart by changing key
        setPreviewKey(prev => prev + 1);
        setShowPreviewDonation(true);

        setPreviewMediaType(type);
        if (type === "VIDEO") {
            setPreviewMediaUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        } else if (type === "AUDIO") {
            // Mock audio file for preview
            setPreviewMediaUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
        } else {
            setPreviewMediaUrl(undefined);
        }

        // Trigger TTS locally if enabled (for immediate feedback)
        if (settings.textToSpeech && type === "TEXT") {
            speakMessage("Great stream! HODL forever. Can you check out the new L2 chain?");
        }

        // Send actual test alert to WebSocket for OBS overlay
        try {
            await sendTestAlert(type);
        } catch (e) {
            console.error("Failed to trigger WS alert", e);
        }
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Sidebar Controls */}
            <aside className="w-full lg:w-[380px] flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-[#2D2452] bg-white dark:bg-[#181033] overflow-y-auto z-20">
                <div className="p-6 flex flex-col gap-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">Overlay Editor</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Customize your playful donation alerts.</p>
                    </div>

                    {/* OBS Overlay Link Card */}
                    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-[#2D2452] bg-slate-50 dark:bg-[#130c29]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
                                    <Video className="h-4 w-4 text-accent-cyan" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">OBS Overlay Link</p>
                                    <p className="text-xs text-slate-400">Add to OBS Browser Source</p>
                                </div>
                            </div>
                        </div>
                        {settings.obsUrl ? (
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={settings.obsUrl}
                                    className="flex-1 bg-white dark:bg-[#0B061D] border border-slate-200 dark:border-[#2D2452] rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300"
                                />
                                <button
                                    onClick={handleCopyUrl}
                                    className="px-3 py-2 bg-accent-cyan hover:bg-accent-cyan/80 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No overlay URL generated yet</p>
                        )}
                    </div>

                    {/* Donation Page Link Card */}
                    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-[#2D2452] bg-slate-50 dark:bg-[#130c29]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <Link className="h-4 w-4 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Donation Page Link</p>
                                    <p className="text-xs text-slate-400">Share with your viewers</p>
                                </div>
                            </div>
                        </div>
                        {settings.donateUrl ? (
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={settings.donateUrl}
                                    className="flex-1 bg-white dark:bg-[#0B061D] border border-slate-200 dark:border-[#2D2452] rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300"
                                />
                                <button
                                    onClick={() => {
                                        if (settings.donateUrl) {
                                            navigator.clipboard.writeText(settings.donateUrl);
                                            alert("Donation link copied!");
                                        }
                                    }}
                                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No donation URL available</p>
                        )}
                    </div>

                    {/* QR Code Overlay Link (for OBS) */}
                    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-[#2D2452] bg-slate-50 dark:bg-[#130c29]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
                                    <span className="material-symbols-outlined text-[16px] text-accent-purple">qr_code_2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">QR Code Overlay</p>
                                    <p className="text-xs text-slate-400">Display QR in stream</p>
                                </div>
                            </div>
                        </div>
                        {settings.streamerId ? (
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/qr/${settings.streamerId}`}
                                    className="flex-1 bg-white dark:bg-[#0B061D] border border-slate-200 dark:border-[#2D2452] rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300"
                                />
                                <button
                                    onClick={() => {
                                        const qrOverlayUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay/qr/${settings.streamerId}`;
                                        navigator.clipboard.writeText(qrOverlayUrl);
                                        alert("QR Overlay link copied!");
                                    }}
                                    className="px-3 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No QR overlay available</p>
                        )}
                    </div>

                    {/* Visual Theme */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-[#6B5A99]">Visual Theme</label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Vibrant Dark Option */}
                            <div
                                onClick={() => setSettings(s => ({ ...s, theme: "Vibrant Dark" }))}
                                className={cn(
                                    "cursor-pointer border-2 rounded-xl p-3 flex flex-col gap-2 relative group shadow-fun-sm transition-all",
                                    settings.theme === "Vibrant Dark"
                                        ? "border-accent-pink bg-surface-dark"
                                        : "border-slate-200 dark:border-[#2D2452] bg-slate-50 dark:bg-[#130c29] hover:border-slate-400"
                                )}
                            >
                                {settings.theme === "Vibrant Dark" && (
                                    <div className="absolute -top-2 -right-2 bg-white text-black rounded-full p-1 shadow-md z-10">
                                        <Check size={16} strokeWidth={4} />
                                    </div>
                                )}
                                <div className="h-10 w-full bg-gradient-to-br from-[#2D2452] to-[#0B061D] rounded-lg border border-white/10 mb-1 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-accent-yellow"></div>
                                </div>
                                <span className={cn("text-sm font-bold", settings.theme === "Vibrant Dark" ? "text-white" : "text-slate-500")}>Vibrant Dark</span>
                            </div>

                            {/* Minimal Light Option */}
                            <div
                                onClick={() => setSettings(s => ({ ...s, theme: "Minimal Light" }))}
                                className={cn(
                                    "cursor-pointer border-2 rounded-xl p-3 flex flex-col gap-2 relative group shadow-fun-sm transition-all",
                                    settings.theme === "Minimal Light"
                                        ? "border-accent-pink bg-white"
                                        : "border-slate-200 dark:border-[#2D2452] bg-slate-50 dark:bg-[#130c29] hover:border-slate-400"
                                )}
                            >
                                {settings.theme === "Minimal Light" && (
                                    <div className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-md z-10">
                                        <Check size={16} strokeWidth={4} />
                                    </div>
                                )}
                                <div className="h-10 w-full bg-white rounded-lg border border-slate-200 mb-1"></div>
                                <span className={cn("text-sm font-bold", settings.theme === "Minimal Light" ? "text-slate-900" : "text-slate-500")}>Minimal Light</span>
                            </div>
                        </div>
                    </div>

                    {/* Animation & Layout */}
                    <div className="flex flex-col gap-5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-[#6B5A99]">Animation & Layout</label>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Entrance Animation</label>
                            <div className="relative">
                                <select
                                    value={settings.animationPreset}
                                    onChange={(e) => setSettings(s => ({ ...s, animationPreset: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-[#130c29] border-2 border-slate-200 dark:border-[#2D2452] rounded-xl py-3 px-4 text-sm font-medium focus:ring-0 focus:border-accent-pink outline-none appearance-none transition-colors"
                                >
                                    <option>Slide In Left</option>
                                    <option>Fade In</option>
                                    <option>Pop Up</option>
                                    <option>Glitch Effect</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 pointer-events-none text-slate-400" size={20} />
                            </div>
                        </div>


                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-[#6B5A99]">Content</label>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Minimum Amount (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-slate-400 text-sm font-bold">$</span>
                                <input
                                    className="w-full bg-slate-50 dark:bg-[#130c29] border-2 border-slate-200 dark:border-[#2D2452] rounded-xl py-3 pl-8 pr-4 text-sm font-bold focus:ring-0 focus:border-accent-pink outline-none transition-colors"
                                    type="number"
                                    value={settings.minAmountUsd}
                                    onChange={(e) => setSettings(s => ({ ...s, minAmountUsd: parseFloat(e.target.value) }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Min Audio (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-400 text-sm font-bold">$</span>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-[#130c29] border-2 border-slate-200 dark:border-[#2D2452] rounded-xl py-3 pl-8 pr-4 text-sm font-bold focus:ring-0 focus:border-accent-pink outline-none transition-colors"
                                        type="number"
                                        value={settings.minAudioAmountUsd}
                                        onChange={(e) => setSettings(s => ({ ...s, minAudioAmountUsd: parseFloat(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Min Video (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-400 text-sm font-bold">$</span>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-[#130c29] border-2 border-slate-200 dark:border-[#2D2452] rounded-xl py-3 pl-8 pr-4 text-sm font-bold focus:ring-0 focus:border-accent-pink outline-none transition-colors"
                                        type="number"
                                        value={settings.minVideoAmountUsd}
                                        onChange={(e) => setSettings(s => ({ ...s, minVideoAmountUsd: parseFloat(e.target.value) }))}
                                    />
                                </div>
                            </div>
                        </div>



                        <div className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-200 dark:border-[#2D2452] bg-slate-50 dark:bg-[#130c29]">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Text-to-Speech</span>
                                <span className="text-xs text-slate-400 font-medium">Read donation messages</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.textToSpeech}
                                    onChange={(e) => setSettings(s => ({ ...s, textToSpeech: e.target.checked }))}
                                />
                                <div className="w-12 h-7 bg-slate-300 dark:bg-[#2D2452] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan peer-checked:after:border-2"></div>
                            </label>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-200 dark:border-[#2D2452] space-y-2">
                        <button
                            onClick={() => triggerTestDonation("TEXT")}
                            className="w-full bg-surface-dark hover:bg-slate-900 text-white border-2 border-transparent hover:border-accent-pink/50 font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                        >
                            <FlaskConical size={20} />
                            Send Test Message
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => triggerTestDonation("VIDEO")}
                                className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border-2 border-transparent hover:border-accent-pink/50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Video size={18} />
                                Test Video
                            </button>
                            <button
                                onClick={() => triggerTestDonation("AUDIO")}
                                className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border-2 border-transparent hover:border-accent-pink/50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">mic</span>
                                Test Audio
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Live Preview Canvas */}
            <div className="flex-1 bg-[#0B061D] flex flex-col relative overflow-hidden pattern-dots">
                <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none"></div>

                {/* Header Bar within Canvas */}
                <div className="px-8 py-4 flex items-center justify-between z-10">
                    <h2 className="text-white font-bold flex items-center gap-3 bg-[#181033] px-4 py-2 rounded-full border border-[#2D2452]">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Live Preview Canvas
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent-pink/80 bg-[#181033] border border-[#2D2452] px-3 py-2 rounded-lg">
                        1920 x 1080
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 flex items-center justify-center p-4 relative">
                    <div className="w-full max-w-[1200px] aspect-video relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#2D2452] bg-[#130c29] group">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-20 transition-opacity duration-500 grayscale"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBC9ged884LBe76ItH2wAn2WXRchL2ZAEChTm_-kvrKfh3dYfSNrPjdVZpMKp954urzGNZO-GL3Wz2YPblhTs5HC3abNQ8Ph0HEJOT2Evz4AtE-h8acpT-cKswVhO21aFpyCEjbr-QkOOX8VWF3HpjL4R2B00Sdgls9CwT5lRx8LmWAthE0whckLyUi30H7tpf9uG9HsQxVhzdeq8H5GtVSgaLk6uqHgcQQnwqF6KXYwCPHYFTBR_TEKORh56Ecc0E2ELulv8aVLatT")' }}
                        />

                        {/* Overlay Component Display */}
                        <div className="absolute bottom-12 left-12 z-20">
                            {showPreviewDonation && (
                                <DonationCard
                                    key={previewKey}
                                    donorName="Satoshi_Naka"
                                    amount="50000"
                                    tokenSymbol="IDRXkb"
                                    tokenLogo="https://s2.coinmarketcap.com/static/img/coins/128x128/26732.png"
                                    message={previewMediaType === "TEXT" ? "Great stream! HODL forever. Can you check out the new L2 chain?" : undefined}
                                    mediaType={previewMediaType}
                                    mediaUrl={previewMediaUrl}
                                    theme={settings.theme as any}
                                    animationPreset={settings.animationPreset}
                                    showYieldApy={settings.showYieldApy}
                                />
                            )}
                        </div>

                        {/* QR Code Preview */}
                        <div className="absolute bottom-12 right-12 z-20">
                            <div className="w-[300px] relative scale-75 origin-bottom-right">
                                {/* Floating accent circle */}
                                <div
                                    className="absolute -right-4 -top-6 w-16 h-16 bg-accent-yellow rounded-full z-0 animate-bounce"
                                    style={{ animationDuration: "3s" }}
                                />

                                {/* Black shadow layer */}
                                <div className="absolute -left-2 -bottom-2 w-full h-full bg-black rounded-2xl z-0" />

                                {/* Main card - Theme responsive */}
                                <div className={cn(
                                    "relative rounded-2xl p-4 border-2 z-10 flex flex-col gap-3 shadow-[0_0_0_4px_#000,8px_8px_0_0_rgba(247,120,186,1)]",
                                    settings.theme === "Minimal Light" ? "bg-white border-black" : "bg-[#181033] border-white"
                                )}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "bg-accent-cyan w-10 h-10 flex items-center justify-center rounded-lg border-2 shadow-[2px_2px_0px_0px_#000]",
                                                settings.theme === "Minimal Light" ? "border-black" : "border-white"
                                            )}>
                                                <span className="material-symbols-outlined text-xl text-black font-black">qr_code_2</span>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black tracking-wider uppercase text-accent-pink mb-0.5">
                                                    Support
                                                </div>
                                                <h3 className={cn(
                                                    "text-lg font-black leading-none",
                                                    settings.theme === "Minimal Light" ? "text-black" : "text-white"
                                                )}>
                                                    Scan to Donate
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Live Badge */}
                                        <div className="bg-red-500 text-white border-2 border-black rounded-lg px-1.5 py-0.5 flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] transform -rotate-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            <span className="text-[9px] font-black uppercase">Live</span>
                                        </div>
                                    </div>

                                    {/* QR Code Container */}
                                    <div className="bg-white rounded-xl p-3 border-2 border-black relative overflow-hidden flex items-center justify-center">
                                        <div className="absolute top-0 right-0 w-16 h-full bg-accent-yellow/20 skew-x-12 transform translate-x-6" />
                                        {settings.donateUrl && (
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(settings.donateUrl)}&color=000000&bgcolor=ffffff&margin=10`}
                                                alt="QR Code"
                                                className="w-40 h-40 relative z-10"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4 text-white/30 text-xs font-mono font-bold pointer-events-none uppercase tracking-widest">
                            Preview Mode
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
