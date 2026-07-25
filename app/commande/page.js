'use client';

import { useEffect, useRef, useState } from 'react';

// ============================================================================
//  Page de confirmation après paiement Stripe.
//  - Lit ?ref=… (&status=cancel si annulé côté Stripe).
//  - Sonde /api/orders/[ref] jusqu'à ce que le webhook Stripe ait marqué la
//    commande « paid » (le webhook peut arriver juste après la redirection).
//  - Vide le panier (localStorage) une fois le paiement confirmé.
// ============================================================================

const MAX_POLLS = 10;
const POLL_MS = 1500;
const CART_KEY = 'tf77_cart_v1';

export default function CommandePage() {
  const [phase, setPhase] = useState('loading'); // loading|paid|pending|failed|cancelled|unknown
  const [order, setOrder] = useState(null);
  const [ref, setRef] = useState('');
  const polls = useRef(0);
  const cleared = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('ref') || '';
    const st = params.get('status');
    setRef(r);

    if (st === 'cancel') {
      setPhase('cancelled');
      return;
    }
    if (!r) {
      setPhase('unknown');
      return;
    }

    let active = true;
    let timer;

    const check = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(r)}`, { cache: 'no-store' });
        const j = await res.json();
        if (!active) return;
        const o = j.order;
        if (!o) {
          setPhase('unknown');
          return;
        }
        setOrder(o);
        if (o.status === 'paid') {
          setPhase('paid');
          if (!cleared.current) {
            cleared.current = true;
            try {
              localStorage.removeItem(CART_KEY);
            } catch {
              /* localStorage indisponible */
            }
          }
          return;
        }
        if (o.status === 'failed') {
          setPhase('failed');
          return;
        }
        // awaiting_payment → on continue de sonder.
        polls.current += 1;
        setPhase('pending');
        if (polls.current < MAX_POLLS) {
          timer = setTimeout(check, POLL_MS);
        }
      } catch {
        if (active) setPhase('unknown');
      }
    };

    timer = setTimeout(check, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Shell>
      {phase === 'loading' || phase === 'pending' ? (
        <Center
          icon="solar:spinner-round-linear animate-spin text-gold-400"
          title="Confirmation du paiement…"
          text="Nous validons votre paiement, patientez un instant."
        />
      ) : phase === 'paid' ? (
        <Center
          icon="solar:check-circle-bold text-gold-400"
          title="Paiement confirmé, merci !"
          text={
            order
              ? `Votre commande ${order.ref} est enregistrée et réglée${
                  order.type === 'delivery' ? '. Elle sera livrée.' : '. Prête à être récupérée.'
                }`
              : 'Votre commande est enregistrée et réglée.'
          }
          extra={
            <div className="mt-6 rounded-xl border border-gold-400/25 bg-white/[0.03] px-5 py-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-cream-50/40">Référence</span>
              <div className="font-serif text-xl text-gold-400">{order?.ref || ref}</div>
            </div>
          }
        />
      ) : phase === 'failed' ? (
        <Center
          icon="solar:danger-circle-bold text-red-400"
          title="Paiement refusé"
          text="Le paiement n'a pas abouti. Aucune somme n'a été débitée. Vous pouvez réessayer."
          tone="error"
        />
      ) : phase === 'cancelled' ? (
        <Center
          icon="solar:close-circle-linear text-cream-50/50"
          title="Paiement annulé"
          text="Vous avez annulé le paiement. Votre panier a été conservé."
        />
      ) : (
        <Center
          icon="solar:hand-money-linear text-gold-400/70"
          title="Commande en traitement"
          text="Votre paiement est en cours de validation. Conservez votre référence, nous confirmerons sous peu."
          extra={
            ref ? (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-cream-50/40">Référence</span>
                <div className="font-serif text-xl text-gold-400">{ref}</div>
              </div>
            ) : null
          }
        />
      )}

      <div className="mt-8">
        <a
          href="/"
          className="cta-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
        >
          <iconify-icon icon="solar:home-2-linear" className="text-base" />
          Retour à l'accueil
        </a>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="min-h-screen bg-th-950 text-cream-50 noise flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md text-center">{children}</div>
      </div>
    </main>
  );
}

function Center({ icon, title, text, extra, tone }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          tone === 'error' ? 'bg-red-500/10 border border-red-400/30' : 'bg-gold-400/10 border border-gold-400/30'
        }`}
      >
        <iconify-icon icon={icon} className="text-5xl" />
      </div>
      <h1 className="font-serif text-2xl text-cream-50">{title}</h1>
      <p className="text-sm text-cream-50/50 font-light mt-2 max-w-xs leading-relaxed">{text}</p>
      {extra}
    </div>
  );
}
