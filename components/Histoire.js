'use client';

import Img from './Img';
import useReveal from './useReveal';
import useSite from './useSite';

// Valeurs codées utilisées tant que le restaurateur n'a pas personnalisé
// (depuis le dashboard → onglet « Informations » → « Page d'accueil »).
const FALLBACK = {
  storyTitle1: 'Né d',
  storyTitleAccent: 'un voyage,',
  storyTitle2: 'cultivé par passion',
  storyText1:
    'Fondé par une famille originaire de Chiang Mai, Thaï Food 77 puise son âme dans les recettes transmises de génération en génération. Chaque curry, chaque wok fumant raconte l\'histoire des marchés nocturnes du nord de la Thaïlande.',
  storyText2:
    'Nos ingrédients — citronnelle, galanga, feuilles de kaffir — sont sélectionnés avec une exigence absolue. Pas de compromis, pas de raccourcis. Seule la fraîcheur authentique, chaque jour, pour chaque plat.',
  chefName: 'Chef Somchai',
  chefRole: "20 ans d'expérience · Cuisine du Nord",
  sinceYear: '2008',
  images: [
    'https://images.unsplash.com/photo-1556816426-5fc92e9ae0f4?w=600&q=80', // piments thaï frais
    'https://images.unsplash.com/photo-1464500650248-1a4b45debb9f?w=800&q=80', // cuisson au wok
    'https://images.unsplash.com/photo-1777828830363-b46f8a2c5aa5?w=500&q=80', // marché flottant (ambiance)
    'https://images.unsplash.com/photo-1781095386508-c71b0f962893?w=500&q=80', // pad thaï dressé
  ],
};

export default function Histoire() {
  const ref = useReveal();
  const site = useSite();
  const c = site.content || {};
  const images = (c.histoireImages && c.histoireImages.length ? c.histoireImages : FALLBACK.images);

  return (
    <section ref={ref} id="histoire" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 reveal">
            <div className="section-label mb-5">Notre Histoire</div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-cream-50 tracking-tight leading-tight mb-8">
              {FALLBACK.storyTitle1}&apos;{FALLBACK.storyTitleAccent}
              <br />
              <span className="italic text-gold-400">{FALLBACK.storyTitle2}</span>
            </h2>
            <div className="gold-divider mb-8" />
            <p className="text-cream-50/50 font-light leading-[1.8] mb-6">
              {c.storyText1 || FALLBACK.storyText1}
            </p>
            <p className="text-cream-50/50 font-light leading-[1.8] mb-8">
              {c.storyText2 || FALLBACK.storyText2}
            </p>
            <div className="flex items-center gap-4">
              {c.chefPhoto ? (
                <img
                  src={c.chefPhoto}
                  alt={c.chefName || FALLBACK.chefName}
                  className="w-12 h-12 rounded-full object-cover border border-gold-400/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-400/5 flex items-center justify-center border border-gold-400/20">
                  <iconify-icon icon="solar:chef-hat-heart-linear" className="text-gold-400 text-xl" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-cream-50">{c.chefName || FALLBACK.chefName}</div>
                <div className="text-xs text-cream-50/40">{c.chefRole || FALLBACK.chefRole}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-12 grid-rows-6 gap-3 sm:gap-4 h-[420px] sm:h-[520px]">
              <div className="col-span-5 row-span-4 img-frame rounded-2xl reveal reveal-delay-1">
                <Img
                  src={images[0] || FALLBACK.images[0]}
                  alt="Herbes et ingrédients thaïlandais frais"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="col-span-7 row-span-3 img-frame rounded-2xl reveal reveal-delay-2">
                <Img
                  src={images[1] || FALLBACK.images[1]}
                  alt="Cuisson au wok"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="col-span-4 row-span-2 img-frame rounded-2xl reveal reveal-delay-3">
                <Img
                  src={images[2] || FALLBACK.images[2]}
                  alt="Ambiance du restaurant"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="col-span-4 row-span-2 img-frame rounded-2xl reveal reveal-delay-4 relative overflow-hidden">
                <Img
                  src={images[3] || FALLBACK.images[3]}
                  alt="Mise en place élégante"
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-th-900/60 flex items-center justify-center z-10">
                  <span className="font-serif text-2xl text-gold-400 italic">Depuis {c.sinceYear || FALLBACK.sinceYear}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
