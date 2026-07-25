'use client';

import { useCallback, useEffect, useState } from 'react';
import { Btn, Card } from './ui';

// ============================================================================
//  Onglet « Paiement » du dashboard — Stripe Connect Express.
//  Vue RESTAURATEUR : connexion + statut de SON compte Stripe.
//  (La commission plateforme est un réglage de la plateforme, dans .env.local,
//   elle n'apparaît pas ici.)
// ============================================================================

export default function StripeManager() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // onboarding / ouverture dashboard
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/account', { cache: 'no-store' });
      const j = await res.json();
      setState(j);
    } catch {
      setErr("Impossible de charger l'état du paiement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startOnboarding() {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/stripe/onboarding', { method: 'POST' });
      const j = await res.json();
      if (!res.ok || !j.url) throw new Error(j.error || 'Erreur');
      window.location.href = j.url; // redirection vers Stripe
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  async function openDashboard() {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/stripe/login', { method: 'POST' });
      const j = await res.json();
      if (!res.ok || !j.url) throw new Error(j.error || 'Erreur');
      window.open(j.url, '_blank');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-cream-50/40 text-sm">Chargement du paiement…</p>;
  }

  const configured = !!state?.configured;
  const connected = !!state?.connectedAccountId;
  const account = state?.account;
  const chargesEnabled = !!account?.chargesEnabled;
  const payoutsEnabled = !!account?.payoutsEnabled;

  return (
    <div className="space-y-5 max-w-2xl">
      {err && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <Card>
        <div className="flex items-start gap-3">
          <iconify-icon
            icon={chargesEnabled ? 'solar:shield-check-linear' : 'solar:card-send-linear'}
            className="text-2xl text-gold-400 mt-0.5"
          />
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cream-50">Compte Stripe</h3>

            {!configured && (
              <>
                <StatusLine tone="warn" text="Clé plateforme Stripe manquante" />
                <p className="text-xs text-cream-50/45 mt-2 leading-relaxed">
                  Le paiement en ligne n'est pas encore activé sur ce site. Contactez la personne
                  qui gère le site pour configurer Stripe. En attendant, les commandes sont
                  enregistrées en mode « règlement sur place ».
                </p>
              </>
            )}

            {configured && !connected && (
              <>
                <StatusLine tone="neutral" text="Aucun compte restaurateur connecté" />
                <p className="text-xs text-cream-50/45 mt-2 mb-3 leading-relaxed">
                  Connectez le compte Stripe qui recevra les paiements. Vous serez guidé(e) par
                  Stripe pour renseigner vos coordonnées bancaires.
                </p>
                <Btn onClick={startOnboarding} disabled={busy}>
                  <span className="inline-flex items-center gap-2">
                    <iconify-icon icon="solar:link-linear" className="text-base" />
                    {busy ? 'Redirection…' : 'Connecter mon compte Stripe'}
                  </span>
                </Btn>
              </>
            )}

            {configured && connected && !chargesEnabled && (
              <>
                <StatusLine tone="warn" text="Onboarding incomplet — finalisez votre compte" />
                <p className="text-xs text-cream-50/45 mt-2 mb-3 leading-relaxed">
                  Stripe doit valider vos informations (entreprise, banque) avant d'encaisser des
                  paiements. Cliquez pour terminer.
                </p>
                <Btn onClick={startOnboarding} disabled={busy}>
                  <span className="inline-flex items-center gap-2">
                    <iconify-icon icon="solar:checklist-linear" className="text-base" />
                    {busy ? 'Redirection…' : 'Finaliser mon compte Stripe'}
                  </span>
                </Btn>
              </>
            )}

            {configured && connected && chargesEnabled && (
              <>
                <StatusLine
                  tone="ok"
                  text={`Actif — encaissement possible${payoutsEnabled ? ' · virements actifs' : ''}`}
                />
                {account?.businessName && (
                  <p className="text-xs text-cream-50/45 mt-2">{account.businessName}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn variant="ghost" onClick={openDashboard} disabled={busy}>
                    <span className="inline-flex items-center gap-2">
                      <iconify-icon icon="solar:external-link-linear" className="text-base" />
                      Tableau de bord Stripe
                    </span>
                  </Btn>
                  <Btn variant="ghost" onClick={startOnboarding} disabled={busy}>
                    <span className="inline-flex items-center gap-2">
                      <iconify-icon icon="solar:pen-linear" className="text-base" />
                      Modifier mes infos
                    </span>
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatusLine({ tone, text }) {
  const map = {
    ok: { dot: 'bg-emerald-400', cls: 'text-emerald-300' },
    warn: { dot: 'bg-amber-400', cls: 'text-amber-300' },
    neutral: { dot: 'bg-cream-50/30', cls: 'text-cream-50/60' },
  }[tone] || { dot: 'bg-cream-50/30', cls: 'text-cream-50/60' };
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`w-2 h-2 rounded-full ${map.dot}`} />
      <span className={`text-sm ${map.cls}`}>{text}</span>
    </div>
  );
}
