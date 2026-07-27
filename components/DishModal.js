'use client';

import { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import { applyPromo, getApplicablePromo, formatPrice, promoLabel } from '../lib/pricing';
import Img from './Img';
import { QtyStepper } from './Cart';

// ============================================================================
//  Fiche produit « en grand » : s'ouvre au clic sur une carte plat.
//  Image grande, description, prix (promo), quantité, ajout au panier.
// ============================================================================

export default function DishModal({ dish, promos, onClose }) {
  const { addToCart, openCart } = useCart();
  const [qty, setQty] = useState(1);

  // Echap pour fermer + on fige le scroll du body.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!dish) return null;

  const promo = getApplicablePromo(dish, promos);
  const { finalPrice, hasPromo, originalPrice } = applyPromo(dish.price, promo);

  function add() {
    for (let i = 0; i < qty; i++) {
      addToCart(dish.name, finalPrice, dish.img);
    }
    onClose();
    openCart();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-th-900 border border-gold-400/20 rounded-2xl shadow-2xl success-pop">
        {/* Fermer */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 border border-white/10 text-cream-50/70 hover:text-gold-400 hover:border-gold-400/40 transition-colors flex items-center justify-center"
        >
          <iconify-icon icon="solar:close-circle-linear" className="text-xl" />
        </button>

        {/* Image */}
        <div className="relative h-60 sm:h-80 img-frame overflow-hidden">
          <Img src={dish.img} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-th-900 via-transparent to-transparent pointer-events-none" />
          {hasPromo && (
            <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5">
              <iconify-icon icon="solar:gift-linear" className="text-[12px]" />
              Promo {promoLabel(promo)}
            </div>
          )}
          {dish.tag && (
            <div className="absolute bottom-4 left-4 bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full">
              <span className={`text-[11px] font-medium ${dish.tagClass || 'text-gold-400'}`}>{dish.tag}</span>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-6 sm:p-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-cream-50 leading-tight mb-3">{dish.name}</h2>
          <p className="text-cream-50/55 font-light leading-relaxed mb-6">
            {dish.desc || 'Plat préparé à la commande avec des ingrédients frais.'}
          </p>

          <div className="flex items-center gap-3 mb-7">
            {hasPromo && (
              <span className="text-cream-50/40 line-through text-lg">{formatPrice(originalPrice)}</span>
            )}
            <span className={`font-serif text-3xl ${hasPromo ? 'text-red-300' : 'text-gold-400'}`}>
              {formatPrice(finalPrice)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <QtyStepper value={qty} onInc={() => setQty((q) => q + 1)} onDec={() => setQty((q) => Math.max(1, q - 1))} size="lg" />
              <span className="text-xs text-cream-50/40">quantité</span>
            </div>
            <button
              onClick={add}
              className="cta-primary flex-1 min-w-[200px] py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <iconify-icon icon="solar:cart-large-2-linear" className="text-base" />
              Ajouter · {formatPrice(finalPrice * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
