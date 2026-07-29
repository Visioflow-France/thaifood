'use client';

import { useEffect, useState } from 'react';

// Page des mentions légales — texte éditable depuis le dashboard (Firestore).
// Rendu léger d'un texte type Markdown (# titre, ## sous-titre, paragraphes).

export default function MentionsLegales() {
  const [legal, setLegal] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setLegal(j.legal || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const blocks = (legal || '')
    .split('\n')
    .map((line, i) => {
      const t = line.trim();
      if (!t) return null;
      if (t.startsWith('## ')) {
        return (
          <h2 key={i} className="font-serif text-xl text-gold-400 mt-9 mb-3">
            {t.slice(3)}
          </h2>
        );
      }
      if (t.startsWith('# ')) {
        return (
          <h1 key={i} className="font-serif text-3xl text-cream-50 mb-6">
            {t.slice(2)}
          </h1>
        );
      }
      return (
        <p key={i} className="text-sm text-cream-50/55 font-light leading-relaxed mb-3">
          {t}
        </p>
      );
    })
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-th-950 text-cream-50 noise">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cream-50/50 hover:text-gold-400 transition-colors mb-8"
        >
          <iconify-icon icon="solar:alt-arrow-left-linear" className="text-base" />
          Retour à l&apos;accueil
        </a>

        {loading ? (
          <p className="text-cream-50/40 font-light">Chargement…</p>
        ) : blocks.length > 0 ? (
          <article>{blocks}</article>
        ) : (
          <p className="text-cream-50/40 font-light">Mentions légales à venir.</p>
        )}
      </div>
    </main>
  );
}
