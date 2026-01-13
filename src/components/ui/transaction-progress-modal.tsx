"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TransactionStepStatus = "idle" | "loading" | "success" | "error";

export interface TransactionStep {
    id: string;
    label: string;
    status: TransactionStepStatus;
}

interface TransactionProgressModalProps {
    open: boolean;
    title?: string;
    description?: string;
    steps: TransactionStep[];
}

export function TransactionProgressModal({
    open,
    title = "Processing transaction",
    description = "Please confirm in your wallet and wait for blockchain confirmation.",
    steps,
}: TransactionProgressModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background-dark)]/90 backdrop-blur px-4">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--color-surface-card)] border-2 border-[var(--color-border-dark)] px-6 sm:px-8 py-6 shadow-xl w-full max-w-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-cyan)]/20 border-2 border-[var(--color-accent-cyan)]">
                    <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent-cyan)]" />
                </span>

                <div className="space-y-3 text-center w-full">
                    <p className="text-sm font-bold text-white">{title}</p>

                    <div className="space-y-2 text-left">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={cn(
                                    "flex items-center gap-2 text-xs transition-all",
                                    step.status === "loading"
                                        ? "text-[var(--color-accent-cyan)]"
                                        : step.status === "success"
                                            ? "text-slate-400" // Completed steps fade out slightly? Or keep green? Donation used slate-400 for earlier steps if active is later
                                            : "text-slate-500" // Idle
                                )}
                            >
                                {step.status === "loading" ? (
                                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                ) : step.status === "success" ? (
                                    <div className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                                ) : step.status === "error" ? (
                                    <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                                ) : (
                                    <div className="h-3 w-3 rounded-full border border-slate-500 shrink-0" />
                                )}
                                <span className={cn(step.status === "success" && "line-through opacity-70")}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-slate-400 pt-2">{description}</p>
                </div>
            </div>
        </div>
    );
}
