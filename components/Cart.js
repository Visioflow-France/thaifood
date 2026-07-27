'use client';

import { useEffect } from 'react';
import { useCart } from './CartContext';
import { formatPrice } from '../lib/pricing';
import Checkout from './Checkout';
import OrderSuccess from './OrderSuccess';

export default function Cart() {
  const {
    items,
    open,
    setOpen,
    step,
    goCart,
    goCheckout,
    updateQty,
    removeItem,
    count,
    subtotal,
  } = useCart();

  // Bloque le scroll du body quand le panier est ouvert.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Ferme avec la touche Echap.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  const onForm = step === 'form';
  const onSuccess = step === 'success';

  const title =
    onSuccess ? 'Commande confirmée'
      : onForm ? 'Finaliser la commande'
      : 'Votre panier';

  // Le drawer s'élargit sur l'étape formulaire pour respirer.
  const widthClass = onForm ? 'max-w-xl' : 'max-w-md';

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`cart-overlay fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] ${open ? 'open' : ''}`}
      />

      <aside
        className={`cart-panel fixed top-0 right-0 z-[80] h-full w-full ${widthClass} bg-th-950 border-l border-white/10 flex flex-col transition-[transform,max-width] duration-500 ${
          open ? 'open' : ''
        }`}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            {onForm ? (
              <button
                onClick={goCart}
                className="p-2 -ml-2 text-cream-50/60 hover:text-gold-400 transition-colors"
                aria-label="Retour au panier"
              >
                <iconify-icon icon="solar:alt-arrow-left-linear" className="text-2xl" />
              </button>
            ) : (
              <iconify-icon
                icon={onSuccess ? 'solar:check-circle-bold' : 'solar:bag-3-linear'}
                className="text-xl text-gold-400"
              />
            )}
            <h3 className="font-serif text-xl text-cream-50 truncate">{title}</h3>
            {!onForm && !onSuccess && count > 0 && (
              <span className="text-xs text-cream-50/40 whitespace-nowrap">({count})</span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-cream-50/50 hover:text-gold-400 transition-colors"
            aria-label="Fermer"
          >
            <iconify-icon icon="solar:close-circle-linear" className="text-2xl" />
          </button>
        </div>

        {/* Stepper (panier → coordonnées → confirmation) */}
        {!onSuccess && (
          <div className="px-6 pt-5">
            <Stepper step={step} />
          </div>
        )}

        {/* Corps selon l'étape */}
        {onSuccess ? (
          <OrderSuccess />
        ) : onForm ? (
          <Checkout />
        ) : (
          <>
            {/* Articles */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <EmptyCart onDiscover={() => setOpen(false)} />
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <CartLine
                      key={item.name}
                      item={item}
                      onInc={() => updateQty(item.name, 1)}
                      onDec={() => updateQty(item.name, -1)}
                      onRemove={() => removeItem(item.name)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Pied : total + passage en caisse */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-white/[0.06] bg-th-900/60">
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-cream-50/50">Sous-total</span>
                  <span className="text-cream-50">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-[11px] text-cream-50/30 mb-4">
                  Frais de livraison calculés à l’étape suivante.
                </p>
                <button
                  onClick={goCheckout}
                  className="cta-primary w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  Passer commande
                  <iconify-icon icon="solar:alt-arrow-right-linear" className="text-base" />
                </button>
                <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-cream-50/35">
                  <iconify-icon icon="solar:lock-keyhole-minimalistic-linear" />
                  <span>Commande sécurisée · Retrait sur place ou livraison 77</span>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}

function Stepper({ step }) {
  const steps = [
    { key: 'cart', label: 'Panier', icon: 'solar:bag-3-linear' },
    { key: 'form', label: 'Coordonnées', icon: 'solar:user-id-linear' },
    { key: 'success', label: 'Confirmation', icon: 'solar:check-circle-linear' },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  active
                    ? 'bg-gold-400 border-gold-400 text-th-950 shadow-[0_0_0_4px_rgba(201,169,110,0.15)]'
                    : done
                    ? 'bg-gold-400/15 border-gold-400/50 text-gold-400'
                    : 'bg-white/[0.03] border-white/10 text-cream-50/30'
                }`}
              >
                <iconify-icon
                  icon={done ? 'solar:check-bold' : s.icon}
                  className={done ? 'text-sm' : 'text-base'}
                />
              </div>
              <span
                className={`text-[10px] tracking-wide whitespace-nowrap ${
                  active ? 'text-gold-400 font-medium' : done ? 'text-cream-50/60' : 'text-cream-50/30'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 -mt-5 bg-white/10 relative overflow-hidden rounded-full">
                <div
                  className={`absolute inset-y-0 left-0 bg-gold-400/60 transition-all duration-500 ${
                    done ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyCart({ onDiscover }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
      <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <iconify-icon icon="solar:bag-3-linear" className="text-3xl text-cream-50/25" />
      </div>
      <div>
        <p className="text-cream-50/70 font-medium">Votre panier est vide</p>
        <p className="text-sm text-cream-50/35 font-light mt-1">
          Laissez-vous tenter par nos signatures thaïes.
        </p>
      </div>
      <button onClick={onDiscover} className="cta-ghost px-5 py-2.5 rounded-full text-sm font-medium">
        Découvrir la carte
      </button>
    </div>
  );
}

function CartLine({ item, onInc, onDec, onRemove }) {
  return (
    <li className="flex gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 transition-colors hover:border-gold-400/20">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 img-wrap bg-th-900">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover loaded" />
        ) : (
          <div className="w-full h-full img-fallback flex items-center justify-center">
            <iconify-icon icon="solar:plate-linear" className="text-xl text-cream-50/20" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-cream-50 leading-snug">{item.name}</h4>
          <button
            onClick={onRemove}
            className="text-cream-50/30 hover:text-red-400 transition-colors -mt-0.5"
            aria-label="Retirer"
          >
            <iconify-icon icon="solar:trash-bin-trash-linear" />
          </button>
        </div>
        <div className="text-xs text-gold-400/80 mt-0.5">{formatPrice(item.price)} l’unité</div>
        <div className="flex items-center justify-between mt-2">
          <QtyStepper value={item.qty} onInc={onInc} onDec={onDec} />
          <span className="text-sm font-semibold text-cream-50">
            {formatPrice(item.price * item.qty)}
          </span>
        </div>
      </div>
    </li>
  );
}

export function QtyStepper({ value, onInc, onDec, size = 'sm' }) {
  const dim = size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const icon = size === 'lg' ? 'text-base' : 'text-sm';
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={onDec}
        className={`${dim} rounded-full border border-gold-400/40 text-gold-400 hover:bg-gold-400/10 hover:border-gold-400 transition-all flex items-center justify-center`}
        aria-label="Diminuer"
      >
        <iconify-icon icon="solar:minus-linear" className={icon} />
      </button>
      <span className={`text-sm text-cream-50 w-5 text-center font-medium`}>{value}</span>
      <button
        onClick={onInc}
        className={`${dim} rounded-full border border-gold-400/40 text-gold-400 hover:bg-gold-400/10 hover:border-gold-400 transition-all flex items-center justify-center`}
        aria-label="Augmenter"
      >
        <iconify-icon icon="solar:add-linear" className={icon} />
      </button>
    </div>
  );
}
