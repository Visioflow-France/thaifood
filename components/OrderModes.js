'use client';

import useReveal from './useReveal';

// Deux façons de commander : ce site (paiement en ligne à la commande,
// livraison) et thaifood77340.com (paiement à la livraison).
export default function OrderModes() {
  const ref = useReveal();

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-th-950 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-12">
          <div className="reveal section-label mb-5">Commander</div>
          <h2 className="reveal reveal-delay-1 font-serif text-3xl sm:text-4xl text-cream-50 tracking-tight">
            Livraison : deux façons de payer
          </h2>
          <p className="reveal reveal-delay-2 mt-4 text-cream-50/40 font-light max-w-lg mx-auto">
            Le même menu livré chez vous, deux modes de paiement : à vous de choisir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
          {/* Ce site : paiement en ligne */}
          <article className="reveal reveal-delay-1 bg-white/[0.04] border border-gold-400/25 rounded-2xl p-7 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-11 h-11 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center">
                <iconify-icon icon="solar:card-recive-linear" className="text-xl text-gold-400" />
              </span>
              <div>
                <h3 className="font-serif text-xl text-cream-50">Sur ce site</h3>
                <span className="text-[11px] uppercase tracking-[0.15em] text-gold-400/80 font-medium">
                  Paiement en ligne
                </span>
              </div>
            </div>
            <p className="text-sm text-cream-50/50 font-light leading-relaxed mb-7 flex-1">
              Pour la livraison : commandez et réglez directement en ligne au moment de la
              commande, par carte bancaire de façon sécurisée. Votre plat arrive, tout est
              déjà réglé.
            </p>
            <a
              href="#commander"
              className="cta-primary px-6 py-3 rounded-full text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              Commander en ligne
              <iconify-icon icon="solar:bag-3-linear" className="text-base" />
            </a>
          </article>

          {/* Site partenaire : paiement à la livraison */}
          <article className="reveal reveal-delay-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-7 sm:p-8 flex flex-col hover:border-gold-400/25 transition-colors">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <iconify-icon icon="solar:hand-money-linear" className="text-xl text-gold-400" />
              </span>
              <div>
                <h3 className="font-serif text-xl text-cream-50">Sur thaifood77340.com</h3>
                <span className="text-[11px] uppercase tracking-[0.15em] text-cream-50/40 font-medium">
                  Paiement à la livraison
                </span>
              </div>
            </div>
            <p className="text-sm text-cream-50/50 font-light leading-relaxed mb-7 flex-1">
              Pour la livraison aussi : commandez sur notre autre site et réglez au
              livreur lorsqu&apos;il arrive chez vous.
            </p>
            <a
              href="https://thaifood77340.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-ghost px-6 py-3 rounded-full text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              Commander sur thaifood77340.com
              <iconify-icon icon="solar:square-arrow-up-right-linear" className="text-base" />
            </a>
          </article>
        </div>

        {/* Retrait : pareil sur les deux sites — paiement sur place dans tous les cas */}
        <p className="reveal reveal-delay-3 mt-8 text-center text-sm text-cream-50/40 font-light max-w-xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <iconify-icon icon="solar:shop-linear" className="text-gold-400/70 text-base" />
          Retrait au restaurant ? C&apos;est pareil partout : vous payez sur place, à la
          caisse, que vous commandiez ici ou sur thaifood77340.com.
        </p>
      </div>
    </section>
  );
}
