'use client';

import { useState, useRef, useEffect } from 'react';
import Img from './Img';
import useReveal from './useReveal';
import { useCart } from './CartContext';
import useMenu from './useMenu';
import { applyPromo, getApplicablePromo, formatPrice, promoLabel } from '../lib/pricing';
import DishModal from './DishModal';

export default function Commander() {
  const ref = useReveal();
  const { addToCart } = useCart();
  const { categories, dishes, promos, loading } = useMenu();
  const [selected, setSelected] = useState(null);

  const cats = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const visibleDishes = dishes
    .filter((d) => d.available !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
        </div>

        {/* Navigation catégories (ancres) */}
        {cats.length > 0 && (
          <nav className="reveal reveal-delay-2 flex flex-wrap items-center justify-center gap-2.5 mb-14">
            {cats.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-white/[0.03] text-cream-50/60 border border-white/[0.07] hover:text-gold-400 hover:border-gold-400/40 hover:bg-gold-400/[0.04] transition-all duration-300"
              >
                <span className="w-1 h-1 rounded-full bg-gold-400/50 group-hover:bg-gold-400 transition-colors" />
                {c.name}
              </a>
            ))}
          </nav>
        )}

        {loading && visibleDishes.length === 0 ? (
          <p className="text-center text-cream-50/40 font-light">Chargement de la carte…</p>
        ) : visibleDishes.length === 0 ? (
          <p className="text-center text-cream-50/40 font-light">Aucun plat pour le moment.</p>
        ) : (
          cats.map((cat) => {
            const items = visibleDishes.filter((d) => d.categoryId === cat.id);
            if (items.length === 0) return null;
            return (
              <div key={cat.id} id={`cat-${cat.id}`} className="mb-16 last:mb-0 scroll-mt-24">
                <div className="flex items-center gap-4 mb-7">
                  <h3 className="font-serif text-xl sm:text-2xl text-gold-400 whitespace-nowrap">
                    {cat.name}
                  </h3>
                  <span className="flex-1 h-px bg-gradient-to-r from-gold-400/30 to-transparent" />
                  <span className="text-xs text-cream-50/30">
                    {items.length} plat{items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {items.map((d, i) => (
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
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <DishModal dish={selected} promos={promos} onClose={() => setSelected(null)} />
      )}
    </section>
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
