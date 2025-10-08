import { faqItems } from "./data";
import { brandPalette } from "./brand";

export function LandingFaq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-4xl px-6 pb-24 pt-16">
      <h2 className="mb-8 text-center text-3xl font-semibold" style={{ color: brandPalette.ink }}>
        FAQ
      </h2>
      <div className="space-y-4">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-sm shadow-rose-100/40"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900">
              {item.question}
              <span className="text-rose-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
