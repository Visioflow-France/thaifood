'use client';

import { useCallback, useEffect, useState } from 'react';
import DishManager from './DishManager';
import CategoryManager from './CategoryManager';
import PromoManager from './PromoManager';
import StripeManager from './StripeManager';
import SiteManager from './SiteManager';
import OrdersManager from './OrdersManager';
import { Btn, Input } from './ui';

export default function AdminApp() {
  const [authed, setAuthed] = useState(null); // null = vérification en cours
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState({ dishes: [], categories: [], promos: [] });
  const [loadingData, setLoadingData] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', { cache: 'no-store' });
      const j = await res.json();
      setAuthed(!!j.authed);
    } catch {
      setAuthed(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoadingData(true);
    try {
      const [d, c, p] = await Promise.all([
        fetch('/api/admin/dishes', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/categories', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/promos', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setData({
        dishes: d.dishes || [],
        categories: c.categories || [],
        promos: p.promos || [],
      });
    } catch {
      /* géré par les composants enfants */
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authed) reload();
  }, [authed, reload]);

  if (authed === null) {
    return <Shell><p className="text-cream-50/50">Vérification de la session…</p></Shell>;
  }
  if (!authed) {
    return (
      <Shell>
        <Login onSuccess={() => setAuthed(true)} />
      </Shell>
    );
  }

  const tabs = [
    { id: 'orders', label: 'Commandes', icon: 'solar:clipboard-list-linear' },
    { id: 'dishes', label: 'Plats', icon: 'solar:plate-linear' },
    { id: 'categories', label: 'Catégories', icon: 'solar:widget-linear' },
    { id: 'promos', label: 'Promotions', icon: 'solar:tag-price-linear' },
    { id: 'payment', label: 'Paiement', icon: 'solar:card-transfer-linear' },
    { id: 'infos', label: 'Informations', icon: 'solar:info-circle-linear' },
  ];

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-cream-50">Dashboard Thai Food 77</h1>
          <p className="text-sm text-cream-50/40">
            Vos modifications apparaissent en direct sur le site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/[0.05] border border-white/10 text-cream-50/80 hover:bg-white/[0.1]"
          >
            Voir le site ↗
          </a>
          <Btn variant="ghost" onClick={logout}>Déconnexion</Btn>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-white/[0.08]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-cream-50/50 hover:text-cream-50'
            }`}
          >
            <iconify-icon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {loadingData && tab !== 'orders' && (
        <p className="text-cream-50/40 text-sm mb-4">Chargement…</p>
      )}

      {tab === 'orders' && <OrdersManager />}
      {tab === 'dishes' && (
        <DishManager dishes={data.dishes} categories={data.categories} reload={reload} />
      )}
      {tab === 'categories' && (
        <CategoryManager categories={data.categories} dishes={data.dishes} reload={reload} />
      )}
      {tab === 'promos' && (
        <PromoManager promos={data.promos} dishes={data.dishes} categories={data.categories} reload={reload} />
      )}
      {tab === 'payment' && <StripeManager />}
      {tab === 'infos' && <SiteManager />}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-th-950 text-cream-50">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">{children}</div>
    </div>
  );
}

function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Échec de connexion');
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-400/15 mb-4">
          <iconify-icon icon="solar:lock-keyhole-linear" className="text-2xl text-gold-400" />
        </div>
        <h1 className="font-serif text-2xl text-cream-50">Espace administrateur</h1>
        <p className="text-sm text-cream-50/40 mt-1">Connectez-vous pour gérer la carte.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
        <div>
          <span className="block text-xs font-medium text-cream-50/60 mb-1">Identifiant</span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="adminthaifood"
          />
        </div>
        <div>
          <span className="block text-xs font-medium text-cream-50/60 mb-1">Mot de passe</span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Btn type="submit" className="w-full" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </Btn>
      </form>
    </div>
  );
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  if (typeof window !== 'undefined') window.location.reload();
}
