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
    question: "Do you custody funds?",
    answer:
      "No—tips go wallet-to-wallet. Kubi never holds user balances; funds settle directly to the creator's address.",
  },
  {
    question: "Which tokens/networks?",
    answer:
      "ERC-20s on supported EVM networks (Base Sepolia in beta; more networks coming). Creators can set preferred tokens.",
  },
  {
    question: "How does Auto-Swap work?",
    answer:
      "If a donor pays with a different token, we swap to the creator's preferred token at checkout using on-chain liquidity. Rates and any fees are shown before you sign.",
  },
  {
    question: "Is Auto-Yield safe?",
    answer:
      "Auto-Yield is optional and integrates with leading lending protocols on Base (more providers coming). You keep custody—yield accrues to your wallet—and you can withdraw directly on the provider you chose. It carries smart-contract and market risk; APR varies and is not guaranteed.",
  },
  {
    question: "Can I donate without crypto?",
    answer: "Crypto only for now. A fiat on-ramp is on the roadmap.",
  },
  {
    question: "How do I get my link?",
    answer:
      "Connect a wallet, finish onboarding, set your preferred token, then copy your donation link from the dashboard.",
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
