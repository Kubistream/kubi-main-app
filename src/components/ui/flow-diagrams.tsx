// Flow visualization components for donation process
export function PrimaryTokenFlow() {
    return (
        <div className="my-6 p-4 bg-gradient-to-br from-surface-dark to-[#0B061D] rounded-xl border-2 border-accent-cyan/20">
            <p className="text-xs font-bold text-accent-cyan mb-4 text-center uppercase tracking-wider">Donation Flow</p>

            <div className="flex items-center justify-between gap-3">
                {/* Step 1: Donor */}
                <div className="flex-1 text-center animate-fade-in">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-accent-yellow/20 border-2 border-accent-yellow flex items-center justify-center">
                        <span className="text-lg">👤</span>
                    </div>
                    <p className="text-xs font-bold text-white">Donor</p>
                    <p className="text-[10px] text-accent-yellow mt-1">Sends ETH</p>
                </div>

                {/* Arrow 1 */}
                <div className="animate-slide-right delay-300">
                    <svg className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </div>

                {/* Step 2: Smart Contract */}
                <div className="flex-1 text-center animate-fade-in delay-500">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-accent-purple/20 border-2 border-accent-purple flex items-center justify-center">
                        <span className="text-lg">📜</span>
                    </div>
                    <p className="text-xs font-bold text-white">Contract</p>
                    <p className="text-[10px] text-accent-purple mt-1">Auto-Swap</p>
                </div>

                {/* Arrow 2 */}
                <div className="animate-slide-right delay-700">
                    <svg className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </div>

                {/* Step 3: Streamer */}
                <div className="flex-1 text-center animate-fade-in delay-1000">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center">
                        <span className="text-lg">🎮</span>
                    </div>
                    <p className="text-xs font-bold text-white">You</p>
                    <p className="text-[10px] text-accent-cyan mt-1">Receive USDC</p>
                </div>
            </div>

            {/* Process Description */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-[11px] text-slate-300 text-center">
                    ETH is automatically swapped to your primary token (USDC) before reaching your wallet
                </p>
            </div>
        </div>
    );
}

export function WhitelistFlow() {
    return (
        <div className="my-6 space-y-4">
            {/* With Whitelist */}
            <div className="p-4 bg-gradient-to-br from-surface-dark to-[#0B061D] rounded-xl border-2 border-green-500/20">
                <p className="text-xs font-bold text-green-400 mb-3 flex items-center gap-2">
                    <span>✅</span>
                    <span>Whitelisted Token (Direct)</span>
                </p>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-center animate-fade-in">
                        <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-accent-yellow/20 border-2 border-accent-yellow flex items-center justify-center">
                            <span className="text-sm">👤</span>
                        </div>
                        <p className="text-[10px] font-bold text-white">Donor</p>
                        <p className="text-[9px] text-accent-yellow mt-0.5">USDC</p>
                    </div>

                    <div className="animate-slide-right delay-200">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>

                    <div className="flex-1 text-center animate-fade-in delay-400">
                        <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center">
                            <span className="text-sm">🎮</span>
                        </div>
                        <p className="text-[10px] font-bold text-white">You</p>
                        <p className="text-[9px] text-accent-cyan mt-0.5">USDC</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">No swap • No fees • Instant</p>
            </div>

            {/* Without Whitelist */}
            <div className="p-4 bg-gradient-to-br from-surface-dark to-[#0B061D] rounded-xl border-2 border-accent-purple/20">
                <p className="text-xs font-bold text-accent-purple mb-3 flex items-center gap-2">
                    <span>🔄</span>
                    <span>Non-Whitelisted Token (Auto-Swap)</span>
                </p>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-center animate-fade-in">
                        <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-accent-yellow/20 border-2 border-accent-yellow flex items-center justify-center">
                            <span className="text-sm">👤</span>
                        </div>
                        <p className="text-[10px] font-bold text-white">Donor</p>
                        <p className="text-[9px] text-accent-yellow mt-0.5">ETH</p>
                    </div>

                    <div className="animate-slide-right delay-200">
                        <svg className="w-4 h-4 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>

                    <div className="flex-1 text-center animate-fade-in delay-300">
                        <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-accent-purple/20 border-2 border-accent-purple flex items-center justify-center">
                            <span className="text-sm">🔄</span>
                        </div>
                        <p className="text-[10px] font-bold text-white">Swap</p>
                        <p className="text-[9px] text-accent-purple mt-0.5">ETH→USDC</p>
                    </div>

                    <div className="animate-slide-right delay-500">
                        <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>

                    <div className="flex-1 text-center animate-fade-in delay-700">
                        <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center">
                            <span className="text-sm">🎮</span>
                        </div>
                        <p className="text-[10px] font-bold text-white">You</p>
                        <p className="text-[9px] text-accent-cyan mt-0.5">USDC</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">Auto-swapped to primary token</p>
            </div>
        </div>
    );
}

export function YieldFlow() {
    return (
        <div className="my-6 p-4 bg-gradient-to-br from-surface-dark to-[#0B061D] rounded-xl border-2 border-green-500/20">
            <p className="text-xs font-bold text-green-400 mb-4 text-center uppercase tracking-wider">Auto Yield Flow</p>

            <div className="space-y-4">
                {/* Step 1: Donation */}
                <div className="flex items-center gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-accent-yellow/20 border-2 border-accent-yellow flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black">1</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-white">Donation Received</p>
                        <p className="text-[10px] text-slate-400">100 USDC donated to you</p>
                    </div>
                    <div className="text-xl">💰</div>
                </div>

                <div className="flex justify-center animate-slide-down delay-300">
                    <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>

                {/* Step 2: Auto-Deposit */}
                <div className="flex items-center gap-3 animate-fade-in delay-500">
                    <div className="w-8 h-8 rounded-full bg-accent-purple/20 border-2 border-accent-purple flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black">2</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-white">Auto-Deposit to Protocol</p>
                        <p className="text-[10px] text-slate-400">USDC sent to yield protocol</p>
                    </div>
                    <div className="text-xl">🏦</div>
                </div>

                <div className="flex justify-center animate-slide-down delay-700">
                    <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>

                {/* Step 3: Earn Yield */}
                <div className="flex items-center gap-3 animate-fade-in delay-1000">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black">3</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-white">Earn Passive Yield</p>
                        <p className="text-[10px] text-slate-400">100 USDC → 108.5 USDC (yearly)</p>
                    </div>
                    <div className="text-xl">📈</div>
                </div>
            </div>

            {/* APR Display */}
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Current APR:</span>
                    <span className="text-sm font-black text-green-400">8.5%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                    Your donations automatically earn yield interest
                </p>
            </div>
        </div>
    );
}

// Add CSS animations in global styles or component
export const flowAnimationStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
}

.animate-slide-right {
  animation: slideRight 0.5s ease-out forwards;
  opacity: 0;
}

.animate-slide-down {
  animation: slideDown 0.5s ease-out forwards;
  opacity: 0;
}

.delay-200 {
  animation-delay: 0.2s;
}

.delay-300 {
  animation-delay: 0.3s;
}

.delay-400 {
  animation-delay: 0.4s;
}

.delay-500 {
  animation-delay: 0.5s;
}

.delay-700 {
  animation-delay: 0.7s;
}

.delay-1000 {
  animation-delay: 1s;
}
`;
