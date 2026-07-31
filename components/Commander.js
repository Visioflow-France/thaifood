'use client';

import { useState, useRef, useEffect } from 'react';
import Img from './Img';
import useReveal from './useReveal';
import { useCart } from './CartContext';
import useMenu from './useMenu';
import useSite from './useSite';
import { applyPromo, getApplicablePromo, formatPrice, promoLabel } from '../lib/pricing';
import { sectionsInUse, sectionOf } from '../lib/sections';
import { isOpenNow, formatNextOpening } from '../lib/hours';
import DishModal from './DishModal';

export default function Commander() {
  const { addToCart, resyncWithMenu, hydrated } = useCart();
  const { categories, dishes, promos, loading } = useMenu();
  const site = useSite();
  const open = isOpenNow(site.hours);
  const [activeSection, setActiveSection] = useState(null);
  const [activeCat, setActiveCat] = useState('all');
  const [selected, setSelected] = useState(null);

  // Resync panier (restauré depuis localStorage) avec le menu courant : corrige
  // les prix périmés (promo/prix changés) et retire les plats indisponibles.
  useEffect(() => {
    if (hydrated) resyncWithMenu(dishes, promos);
  }, [hydrated, dishes, promos, resyncWithMenu]);

  const cats = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Sections réellement présentes dans la carte (thai, japonais, desserts,
  // boissons… + « autres » seulement si une catégorie n'est rattachée à aucune).
  const sections = sectionsInUse(cats);
  const currentSection = sections.some((s) => s.id === activeSection)
    ? activeSection
    : sections[0]?.id;

  const sectionCats = cats.filter((c) => sectionOf(c) === currentSection);
  // Sous-filtres utiles seulement si la section contient plus d'une catégorie.
  const showSubFilters = sectionCats.length > 1;

  const visibleDishes = dishes
    .filter((d) => d.available !== false)
    .filter((d) => sectionCats.some((c) => c.id === d.categoryId))
    .filter((d) => activeCat === 'all' || d.categoryId === activeCat)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Ré-observe les cartes .reveal à chaque changement de section/catégorie :
  // sans ça, les nouvelles cartes restent à opacity:0 (invisible).
  const ref = useReveal([currentSection, activeCat]);

  const selectSection = (id) => {
    setActiveSection(id);
    setActiveCat('all');
  };

  const quickAdd = (d) => {
    const { finalPrice } = applyPromo(d.price, getApplicablePromo(d, promos));
    addToCart(d.name, finalPrice, d.img);
  };

  return (
    <section ref={ref} id="commander" className="py-24 sm:py-32 relative bg-th-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="reveal section-label mb-5">Notre Carte</div>
          <h2 className="reveal reveal-delay-1 font-serif text-3xl sm:text-4xl md:text-5xl text-cream-50 tracking-tight">
            Commander en ligne
          </h2>
          <p className="reveal reveal-delay-2 mt-4 text-cream-50/40 font-light max-w-lg mx-auto">
            Nos plats les plus acclamés, préparés à la commande et prêts à être dégustés.
          </p>
          <div className="reveal reveal-delay-2 mt-5 flex justify-center">
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border ${
                open
                  ? 'bg-green-500/10 border-green-400/30 text-green-300'
                  : 'bg-red-500/10 border-red-400/30 text-red-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-400' : 'bg-red-400'} ${open ? '' : 'animate-pulse'}`} />
              {open
                ? 'Ouvert maintenant — commande en ligne activée'
                : `Fermé — réouverture ${formatNextOpening(site.hours)}`}
            </span>
          </div>
        </div>

        {/* Niveau 1 : onglets par cuisine */}
        {sections.length > 0 && (
          <div className="reveal reveal-delay-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
            {sections.map((s) => (
              <SectionTab
                key={s.id}
                active={currentSection === s.id}
                onClick={() => selectSection(s.id)}
              >
                <span className="mr-1.5">{s.emoji}</span>
                {s.label}
              </SectionTab>
            ))}
          </div>
        )}

        {/* Niveau 2 : sous-filtres par catégorie (cuisine active) */}
        {showSubFilters && (
          <nav className="flex flex-wrap items-center justify-center gap-2.5 mb-14">
            <FilterPill active={activeCat === 'all'} onClick={() => setActiveCat('all')}>
              Tout
            </FilterPill>
            {sectionCats.map((c) => (
              <FilterPill
                key={c.id}
                active={activeCat === c.id}
                onClick={() => setActiveCat(c.id)}
              >
                {c.name}
              </FilterPill>
            ))}
          </nav>
        )}

        {loading && visibleDishes.length === 0 ? (
          <p className="text-center text-cream-50/40 font-light">Chargement de la carte…</p>
        ) : visibleDishes.length === 0 ? (
          <p className="text-center text-cream-50/40 font-light">Aucun plat dans cette catégorie pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {visibleDishes.map((d, i) => (
              <DishCard
                key={d.id}
                dish={d}
                promos={promos}
                index={i}
                onOpen={() => setSelected(d)}
                onAdd={() => quickAdd(d)}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DishModal dish={selected} promos={promos} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

function SectionTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all border ${
        active
          ? 'bg-gold-400 text-th-950 border-gold-400 shadow-lg shadow-gold-400/10'
          : 'bg-white/[0.04] text-cream-50/70 border-white/[0.07] hover:text-cream-50 hover:border-gold-400/40'
      }`}
    >
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
        active
          ? 'bg-gold-400 text-th-950 border-gold-400'
          : 'bg-white/[0.04] text-cream-50/60 border-white/[0.07] hover:text-cream-50 hover:border-gold-400/40'
      }`}
    >
      {children}
    </button>
  );
}

function DishCard({ dish, promos, index, onOpen, onAdd }) {
  const promo = getApplicablePromo(dish, promos);
  const { finalPrice, hasPromo, originalPrice } = applyPromo(dish.price, promo);
  const [added, setAdded] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      onClick={onOpen}
      className={`dish-card reveal reveal-delay-${(index % 3) + 1} bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden group flex flex-col cursor-pointer hover:border-gold-400/25`}
    >
      <div className="relative h-52 sm:h-56 overflow-hidden">
        <Img src={dish.img} alt={dish.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        {hasPromo && (
          <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
            <iconify-icon icon="solar:gift-linear" className="text-[12px] text-white" />
            <span className="text-[11px] font-semibold text-white">Promo {promoLabel(promo)}</span>
          </div>
        )}
        {dish.tag && (
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
            <span className={`text-[11px] font-medium ${dish.tagClass || 'text-gold-400'}`}>
              {dish.tag}
            </span>
          </div>
        )}
        {/* Prix flottant sur l'image */}
        <div className="absolute bottom-3 left-3 bg-th-950/85 backdrop-blur-md border border-gold-400/20 rounded-full px-3 py-1.5 flex items-center gap-2">
          {hasPromo && (
            <span className="text-[11px] text-cream-50/40 line-through">{formatPrice(originalPrice)}</span>
          )}
          <span className={`text-sm font-semibold ${hasPromo ? 'text-red-300' : 'text-gold-400'}`}>
            {formatPrice(finalPrice)}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-lg text-cream-50 leading-snug">{dish.name}</h3>
        <p className="text-sm text-cream-50/40 font-light leading-relaxed mt-1.5 mb-4 line-clamp-2 flex-1">
          {dish.desc}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          className={`add-btn w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${
            added ? 'add-btn-done' : ''
          }`}
          aria-label={`Ajouter ${dish.name} au panier`}
        >
          <span className="relative z-[1] flex items-center justify-center gap-2">
            <iconify-icon
              icon={added ? 'solar:check-circle-bold' : 'solar:add-circle-linear'}
              className="text-base"
            />
            {added ? 'Ajouté' : 'Ajouter'}
          </span>
        </button>
      </div>
    </article>
  );
}
