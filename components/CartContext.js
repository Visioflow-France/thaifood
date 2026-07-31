'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { computeTotals, applyPromo, getApplicablePromo } from '../lib/pricing';

const CartContext = createContext(null);

const STORAGE_KEY = 'tf77_cart_v1';

// ============================================================================
//  État global du panier + tunnel de commande.
//
//  Trois « étapes » gérées ici :
//    'cart'     → aperçu du panier (quantités, total)
//    'form'     → coordonnées client + choix retrait/livraison
//    'success'  → confirmation (commande enregistrée côté serveur)
//
//  Le panier est persisté dans localStorage : il survit aux rechargements.
// ============================================================================

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('cart');
  const [lastOrder, setLastOrder] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydratation depuis le localStorage (côté navigateur uniquement).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* localStorage indisponible : on ignore. */
    }
    setHydrated(true);
  }, []);

  // Persistance à chaque modification (une fois hydraté).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota / mode privé : on ignore. */
    }
  }, [items, hydrated]);

  const addToCart = useCallback((name, price, image) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === name);
      if (existing) {
        return prev.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { name, price, image, qty: 1 }];
    });
    setStep('cart');
    setOpen(true);
  }, []);

  const updateQty = useCallback((name, delta) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.name !== name) return [i];
        const qty = i.qty + delta;
        return qty <= 0 ? [] : [{ ...i, qty }];
      })
    );
  }, []);

  const removeItem = useCallback((name) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // Resynchronise le panier avec le menu courant : met à jour les prix (notamment
  // les promos actives) et retire les plats supprimés ou devenus indisponibles.
  // Garantit que le total affiché correspond à ce qui sera facturé (le serveur
  // recalcule de toute façon depuis le menu, ce correctif évite la surprise
  // visuelle d'un panier périmé restauré depuis localStorage).
  const resyncWithMenu = useCallback((dishes, promos) => {
    if (!Array.isArray(dishes) || dishes.length === 0) return;
    const byName = new Map();
    for (const d of dishes) {
      if (d && d.name) byName.set(String(d.name).trim().toLowerCase(), d);
    }
    setItems((prev) =>
      prev.flatMap((i) => {
        const dish = byName.get(String(i.name || '').trim().toLowerCase());
        if (!dish || dish.available === false) return []; // plat disparu / indisponible
        const { finalPrice } = applyPromo(dish.price, getApplicablePromo(dish, promos));
        return [{ ...i, price: finalPrice }];
      })
    );
  }, []);

  const openCart = useCallback(() => {
    setOpen(true);
    // On revient à l'aperçu panier si on était sur l'écran de confirmation.
    setStep((s) => (s === 'success' ? 'cart' : s));
  }, []);

  const goCheckout = useCallback(() => setStep('form'), []);
  const goCart = useCallback(() => setStep('cart'), []);

  // Valide la commande auprès de l'API. Renvoie { ok, order, error }.
  const placeOrder = useCallback(
    async (info) => {
      if (items.length === 0) return { ok: false, error: 'Votre panier est vide.' };
      const payload = {
        type: info.type,
        scheduledFor: info.scheduledFor || null,
        customer: info.customer,
        items: items.map((i) => ({
          name: i.name,
          price: i.price,
          qty: i.qty,
          image: i.image || null,
        })),
      };
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          return { ok: false, error: data.error || 'Erreur lors de la validation.' };
        }
        // Paiement en ligne (Stripe) : redirection vers la page de paiement.
        // On garde le panier intact (localStorage) pour permettre un retour en
        // cas d'annulation ; il sera vidé sur la page de confirmation si payé.
        if (data.checkoutUrl && typeof window !== 'undefined') {
          window.location.href = data.checkoutUrl;
          return { ok: true, order: data.order, redirecting: true };
        }
        setLastOrder(data.order);
        setItems([]);
        setStep('success');
        return { ok: true, order: data.order };
      } catch {
        return { ok: false, error: 'Réseau indisponible, réessayez.' };
      }
    },
    [items]
  );

  const resetCheckout = useCallback(() => {
    setLastOrder(null);
    setStep('cart');
    setOpen(false);
  }, []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const { subtotal } = computeTotals(items, 'pickup'); // total marchandise (hors livraison)

  const value = useMemo(
    () => ({
      items,
      open,
      setOpen,
      openCart,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      count,
      subtotal,
      total: subtotal, // alias conservé (total marchandise)
      // Tunnel de commande
      step,
      goCheckout,
      goCart,
      placeOrder,
      lastOrder,
      resetCheckout,
      // Synchronisation panier <-> menu
      hydrated,
      resyncWithMenu,
    }),
    [
      items,
      open,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      count,
      subtotal,
      step,
      placeOrder,
      lastOrder,
      resetCheckout,
      hydrated,
      resyncWithMenu,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit etre utilise dans un CartProvider');
  return ctx;
}
