'use client';

import { useCallback, useEffect, useState } from 'react';
import { Btn, Input, Card, Field, TextArea } from './ui';

// ============================================================================
//  Onglet « Informations » du dashboard — téléphone (bandeau + footer) et
//  mentions légales (page /mentions-legales). Stockés dans Firestore.
// ============================================================================

export default function SiteManager() {
  const [phone, setPhone] = useState('');
  const [legal, setLegal] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingLegal, setSavingLegal] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [legalSaved, setLegalSaved] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/site', { cache: 'no-store' });
      const j = await res.json();
      setPhone(j.phone || '');
      setLegal(j.legal || '');
    } catch {
      setErr('Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePhone() {
    setSavingPhone(true);
    setErr('');
    try {
      const res = await fetch('/api/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur');
      setPhone(j.phone);
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 1800);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingPhone(false);
    }
  }

  async function saveLegal() {
    setSavingLegal(true);
    setErr('');
    try {
      const res = await fetch('/api/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legal }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur');
      setLegal(j.legal);
      setLegalSaved(true);
      setTimeout(() => setLegalSaved(false), 1800);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingLegal(false);
    }
  }

  if (loading) {
    return <p className="text-cream-50/40 text-sm">Chargement…</p>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {err && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {/* Téléphone */}
      <Card>
        <div className="flex items-start gap-3">
          <iconify-icon icon="solar:phone-linear" className="text-2xl text-gold-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cream-50">Téléphone</h3>
            <p className="text-xs text-cream-50/45 mt-1 mb-3 leading-relaxed">
              Affiché dans le bandeau « Commander par téléphone » et le pied de page (lien d&apos;appel direct).
            </p>
            <div className="flex items-center gap-2 max-w-sm">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 64 37 55 00"
              />
              <Btn onClick={savePhone} disabled={savingPhone}>
                {phoneSaved ? 'Enregistré ✓' : savingPhone ? '…' : 'Enregistrer'}
              </Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Mentions légales */}
      <Card>
        <div className="flex items-start gap-3">
          <iconify-icon icon="solar:document-text-linear" className="text-2xl text-gold-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cream-50">Mentions légales</h3>
            <p className="text-xs text-cream-50/45 mt-1 mb-3 leading-relaxed">
              Affichées sur la page <code className="text-gold-400/80">/mentions-legales</code>.
              Format simple : <code className="text-gold-400/80"># Titre</code>,{' '}
              <code className="text-gold-400/80">## Sous-titre</code>, puis paragraphes.
            </p>
            <TextArea
              rows={16}
              value={legal}
              onChange={(e) => setLegal(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="mt-3">
              <Btn onClick={saveLegal} disabled={savingLegal}>
                {legalSaved ? 'Enregistré ✓' : savingLegal ? '…' : 'Enregistrer les mentions'}
              </Btn>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
