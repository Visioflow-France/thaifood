'use client';

import useReveal from './useReveal';
import useSite from './useSite';

export default function Hero() {
  const ref = useReveal();
  const site = useSite();
  const heroImage = site.content?.heroImage;

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-end hero-bg"
      style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
    >
      <div className="hero-overlay absolute inset-0" />
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28 pt-32 w-full">
        <div className="max-w-2xl">
          <div className="reveal section-label mb-6">
            Restaurant Thaïlandais — Pontault-Combault
          </div>
          <h1 className="reveal reveal-delay-1 font-serif text-4xl sm:text-5xl md:text-7xl leading-[0.95] tracking-tight text-cream-50 mb-6">
            Des saveurs du
            <br />
            <span className="text-shimmer italic">Siam</span> à votre
            <br />
            assiette
          </h1>
          <p className="reveal reveal-delay-2 text-base sm:text-lg text-cream-50/50 font-light leading-relaxed max-w-md mb-10">
            L&apos;authenticité des marchés de Bangkok, sublimée dans chaque plat. Une
            expérience culinaire qui transcende les frontières.
          </p>
          <div className="reveal reveal-delay-3 flex flex-wrap gap-4">
            <a
              href="#reserver"
              className="cta-primary px-7 py-3.5 rounded-full text-sm font-medium inline-flex items-center gap-2"
            >
              Réserver une table
              <iconify-icon icon="solar:arrow-right-linear" className="text-base" />
            </a>
            <a
              href="#commander"
              className="cta-ghost px-7 py-3.5 rounded-full text-sm font-medium inline-flex items-center gap-2"
            >
              Commander en ligne
              <iconify-icon icon="solar:bag-3-linear" className="text-base" />
            </a>
          </div>
          <div className="reveal reveal-delay-4 mt-12 flex items-center gap-3">
            <div className="flex gap-0.5">
              <iconify-icon icon="solar:star-bold" className="text-gold-400 text-sm" />
              <iconify-icon icon="solar:star-bold" className="text-gold-400 text-sm" />
              <iconify-icon icon="solar:star-bold" className="text-gold-400 text-sm" />
              <iconify-icon icon="solar:star-bold" className="text-gold-400 text-sm" />
              <iconify-icon icon="solar:star-bold" className="text-gold-400/50 text-sm" />
            </div>
            <span className="text-xs text-cream-50/40">4,7 · 7 463 avis Google</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] uppercase tracking-[0.2em] text-cream-50/50">Défiler</span>
        <div className="w-px h-8 bg-gradient-to-b from-gold-400/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
