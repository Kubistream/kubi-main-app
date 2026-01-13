import { NextRequest, NextResponse } from "next/server";

import { applySessionCookies, getAuthSession, resolveAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { DonationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
    const { session, sessionResponse } = await getAuthSession(request);
    const sessionRecord = await resolveAuthenticatedUser(session);

    if (!sessionRecord || !sessionRecord.user.streamer) {
        const res = NextResponse.json(
            {
                totalDonors: 0,
                totalDonations: 0,
                avgYieldApr: null,
                donorsGrowthPercent: 0,
                donationsGrowthPercent: 0,
            },
            { status: 200 },
        );
        return applySessionCookies(sessionResponse, res);
    }

    const streamerId = sessionRecord.user.streamer.id;
    const streamerAddress = sessionRecord.user.wallet?.toLowerCase();

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Total unique donors (all time) and last 7 days
    const [totalDonors, totalDonorsLast7d, totalDonorsPrev7d] = await Promise.all([
        prisma.donation.groupBy({
            by: ["donorWallet"],
            where: { streamerId, status: DonationStatus.CONFIRMED },
        }).then((groups) => groups.length),
        prisma.donation.groupBy({
            by: ["donorWallet"],
            where: {
                streamerId,
                status: DonationStatus.CONFIRMED,
                timestamp: { gte: last7Days, lte: now },
            },
        }).then((groups) => groups.length),
        prisma.donation.groupBy({
            by: ["donorWallet"],
            where: {
                streamerId,
                status: DonationStatus.CONFIRMED,
                timestamp: { gte: prev7Days, lt: last7Days },
            },
        }).then((groups) => groups.length),
    ]);

    // Total donations count (all time) and last 7 days
    const [totalDonations, totalDonationsLast7d, totalDonationsPrev7d] = await Promise.all([
        prisma.donation.count({
            where: { streamerId, status: DonationStatus.CONFIRMED },
        }),
        prisma.donation.count({
            where: {
                streamerId,
                status: DonationStatus.CONFIRMED,
                timestamp: { gte: last7Days, lte: now },
            },
        }),
        prisma.donation.count({
            where: {
                streamerId,
                status: DonationStatus.CONFIRMED,
                timestamp: { gte: prev7Days, lt: last7Days },
            },
        }),
    ]);

    // Compute growth percentages
    const computeGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const donorsGrowthPercent = computeGrowth(totalDonorsLast7d, totalDonorsPrev7d);
    const donationsGrowthPercent = computeGrowth(totalDonationsLast7d, totalDonationsPrev7d);

    // Fetch average APR from yield providers (via on-chain subscriptions)
    // For now, mimic checking subscribed providers by fetching ACTIVE providers and computing average
    // A more accurate approach would be checking on-chain subscription status, but for this we approximate
    let avgYieldApr: number | null = null;

    if (streamerAddress) {
        // Fetch all ACTIVE yield providers
        const activeProviders = await prisma.yieldProvider.findMany({
            where: { status: "ACTIVE", apr: { not: null } },
            select: { apr: true },
        });

        if (activeProviders.length > 0) {
            const aprSum = activeProviders.reduce((sum, p) => {
                const apr = p.apr ? parseFloat(p.apr.toString()) : 0;
                return sum + apr;
            }, 0);
            avgYieldApr = parseFloat((aprSum / activeProviders.length).toFixed(2));
        }
    }

    const res = NextResponse.json({
        totalDonors,
        totalDonations,
        avgYieldApr,
        donorsGrowthPercent,
        donationsGrowthPercent,
    });

    return applySessionCookies(sessionResponse, res);
}
