'use client';

import useReveal from './useReveal';
import useSite from './useSite';

export default function Hero() {
  const ref = useReveal();
  const site = useSite();
  const heroImage = site.content?.heroImage;
  const phone = site.phone || '';
  const tel = phone.replace(/[^\d+]/g, '');

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-end hero-bg"
      style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
    >
      <div className="hero-overlay absolute inset-0" />
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28 pt-32 w-full">
        <div className="max-w-2xl">
          <div className="reveal mb-6 flex flex-wrap items-center gap-3">
            <span className="section-label">Restaurant Thaïlandais — Pontault-Combault</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-400">
              <iconify-icon icon="mdi:check-decagram" className="text-sm" />
              Halal
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-50/25 bg-cream-50/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-50/80">
              <iconify-icon icon="mdi:chef-hat" className="text-sm" />
              Fait maison
            </span>
          </div>
          {phone ? (
            <a
              href={`tel:${tel}`}
              className="reveal mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-sm text-cream-50/90 hover:bg-gold-400/20 transition"
            >
              <iconify-icon icon="solar:phone-linear" className="text-gold-400 text-base" />
              <span className="text-cream-50/60">Réservation par téléphone</span>
              <span className="h-3 w-px bg-cream-50/20" />
              <span className="font-medium">{phone}</span>
            </a>
          ) : (
            <span className="reveal mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm text-cream-50/45">
              <iconify-icon icon="solar:phone-linear" className="text-cream-50/40 text-base" />
              Réservation par téléphone
            </span>
          )}
          <h1 className="reveal reveal-delay-1 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.02] tracking-tight text-cream-50 mb-3">
            Restaurant <span className="text-shimmer italic">Thaï</span> à Pontault-Combault
          </h1>
          <p className="reveal reveal-delay-1 font-serif italic text-xl sm:text-2xl text-cream-50/60 mb-6">
            Des saveurs du Siam à votre assiette
          </p>
          <p className="reveal reveal-delay-2 text-base sm:text-lg text-cream-50/55 font-light leading-relaxed max-w-xl mb-10">
            À Pontault-Combault,{' '}
            <strong className="font-medium text-cream-50/80">Thaï Food 77</strong> est le
            restaurant thaï qui réveille la street food de Bangkok : recettes authentiques,
            produits frais et <strong className="font-medium text-cream-50/80">fast food thaï</strong>{' '}
            à emporter ou sur place, préparés à la commande.
          </p>
          <div className="reveal reveal-delay-3 flex flex-wrap gap-4">
            <a
              href={phone ? `tel:${tel}` : '#commander'}
              className="cta-primary px-7 py-3.5 rounded-full text-sm font-medium inline-flex items-center gap-2"
            >
              Réserver une table
              <iconify-icon icon={phone ? 'solar:phone-linear' : 'solar:arrow-right-linear'} className="text-base" />
            </a>
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
