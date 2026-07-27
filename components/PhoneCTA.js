'use client';

import { useEffect, useState } from 'react';
import useReveal from './useReveal';

// ============================================================================
//  Bandeau « Commander par téléphone » — remplace l'ancien système de
//  réservation. Le numéro vient du dashboard (Firestore config/site).
// ============================================================================

export default function PhoneCTA() {
  const ref = useReveal();
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetch('/api/site', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setPhone(j.phone || ''))
      .catch(() => {});
  }, []);

  const tel = phone.replace(/[^\d+]/g, '');

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-th-900 border-y border-white/[0.05]">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <div className="reveal section-label mb-5">Sur place ou à emporter</div>
        <h2 className="reveal reveal-delay-1 font-serif text-3xl sm:text-4xl text-cream-50 tracking-tight">
          Commandez par <span className="italic text-gold-400">téléphone</span>
        </h2>
        <p className="reveal reveal-delay-2 mt-4 text-cream-50/40 font-light max-w-md mx-auto">
          Une question, une commande directe ? Appelez-nous, on s&apos;occupe de vous.
        </p>

        {phone ? (
          <a
            href={`tel:${tel}`}
            className="cta-primary reveal reveal-delay-2 mt-8 inline-flex items-center gap-3 px-7 py-4 rounded-xl text-base font-semibold"
          >
            <iconify-icon icon="solar:phone-linear" className="text-lg" />
            {phone}
          </a>
        ) : (
          <p className="reveal reveal-delay-2 mt-8 text-cream-50/30 font-light text-sm">
            Numéro à venir.
          </p>
        )}
      </div>
    </section>
  );
}
