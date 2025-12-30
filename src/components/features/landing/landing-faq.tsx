import { faqItems } from "./data";

export function LandingFaq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-4xl px-6 pb-24 pt-16 bg-[#0f0919]">
      <h2 className="mb-12 text-center text-4xl font-black text-white sm:text-5xl md:text-6xl drop-shadow-[4px_4px_0_#7C3AED]">
        <span className="bg-gradient-to-r from-[#7C3AED] via-[#06D6A0] to-[#FFD166] bg-clip-text text-transparent">FAQ</span>
      </h2>
      <div className="space-y-6">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border-2 border-white bg-[#181033] p-6 shadow-[4px_4px_0px_0px_#06D6A0] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-white sm:text-xl">
              {item.question}
              <span className="text-2xl text-[#06D6A0] transition group-open:rotate-45 sm:text-3xl font-black">+</span>
            </summary>
            <p className="mt-4 text-base text-slate-300 sm:text-lg font-medium leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
