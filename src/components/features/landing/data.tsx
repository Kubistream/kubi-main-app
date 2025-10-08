import type { ReactNode } from "react";

export const pressLogos = ["TechCrunch", "VentureBeat", "Forbes"];

export interface BenefitCard {
  title: string;
  description: string;
  icon: ReactNode;
}

export const benefitCards: BenefitCard[] = [
  {
    title: "Accept Any Token",
    description: "Let supporters tip in the assets they already hold.",
    icon: "🔐",
  },
  {
    title: "Direct to Your Wallet",
    description: "Funds settle instantly with no middleman.",
    icon: "💼",
  },
  {
    title: "Receive Donations",
    description: "Celebrate every alert as it lands on stream.",
    icon: "🎉",
  },
  {
    title: "Secure",
    description: "Non-custodial rails with battle-tested infrastructure.",
    icon: "🛡️",
  },
];

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export const streamerSteps: HowItWorksStep[] = [
  {
    step: "1",
    title: "Connect Your Wallet",
    description: "Authenticate with RainbowKit in a single click.",
    icon: "💳",
  },
  {
    step: "2",
    title: "Share Your Donation Link",
    description: "Drop it in chat or your channel bio.",
    icon: "🔗",
  },
  {
    step: "3",
    title: "Receive Donations",
    description: "Let alerts roll in as tips hit your wallet.",
    icon: "📲",
  },
];

export const supporterSteps: HowItWorksStep[] = [
  {
    step: "1",
    title: "Choose Amount & Token",
    description: "Pick ERC-20 tokens across supported networks.",
    icon: "🪙",
  },
  {
    step: "2",
    title: "Sign & Send",
    description: "Approve the transaction safely from your wallet.",
    icon: "✍️",
  },
  {
    step: "3",
    title: "Trigger the Alert",
    description: "Your message lands on stream within seconds.",
    icon: "✨",
  },
];

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Alya",
    role: "Variety Streamer",
    quote: "Donations land instantly—no waiting for payouts.",
  },
  {
    name: "Rama",
    role: "Podcaster",
    quote: "Listeners choose their token and I stay in control.",
  },
  {
    name: "Mei",
    role: "VTuber",
    quote: "The alert overlay is cute and fully brandable.",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Does Kubi hold my funds?",
    answer: "No. Kubi is non-custodial; funds move directly from supporters to your wallet.",
  },
  {
    question: "Which tokens are supported?",
    answer: "ERC-20 tokens across major EVM networks with more networks on the roadmap.",
  },
  {
    question: "Can I add it to my overlay?",
    answer: "Yes. We provide OBS/Streamlabs widgets, webhooks, and ready-to-use React components.",
  },
  {
    question: "What about fees?",
    answer: "We charge 0% platform fees during beta—you only cover network gas fees.",
  },
];

export const donationFeed = [
  {
    name: "Nova",
    token: "USDC",
    amount: "25",
  },
  {
    name: "Orbit",
    token: "DAI",
    amount: "10",
  },
  {
    name: "Beacon",
    token: "MATIC",
    amount: "30",
  },
];

export const supportedWallets = [
  "MetaMask",
  "WalletConnect",
  "Coinbase Wallet",
  "OKX Wallet",
];

export const stats = [
  { label: "Total Donated", value: "$2.4M+" },
  { label: "Active Creators", value: "18k+" },
  { label: "Countries", value: "120+" },
];

export const securityBullets = [
  "Transactions flow wallet-to-wallet—we never custody funds.",
  "Signed anti-phishing messages and verified domains.",
  "Rate-limits and bot protections to prevent spam.",
  "Open SDKs so the community can audit our flows.",
];
