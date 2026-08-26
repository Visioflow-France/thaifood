'use client';

import { useState } from 'react';
import { api } from './api';
import { formatPrice } from '../../lib/pricing';
import { Btn, Card, Field, ImagePicker, Input, Select, TextArea, Toggle } from './ui';

function blankDish(categoryId) {
  return {
    name: '',
    price: '',
    img: '',
    desc: '',
    tag: '',
    tagClass: 'text-gold-400',
    categoryId: categoryId || '',
    available: true,
    order: '',
  };
}

export default function DishManager({ dishes, categories, reload }) {
  const [editing, setEditing] = useState(null); // { isNew, ...dish }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const catName = (id) => categories.find((c) => c.id === id)?.name || '—';

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...editing,
        price: Number(editing.price) || 0,
        order: editing.order === '' ? undefined : Number(editing.order),
      };
      delete payload.isNew;
      if (editing.id) {
        await api(`/api/admin/dishes/${editing.id}`, 'PUT', payload);
      } else {
        await api('/api/admin/dishes', 'POST', payload);
      }
      await reload();
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(d) {
    if (!confirm(`Supprimer « ${d.name} » ?`)) return;
    try {
      await api(`/api/admin/dishes/${d.id}`, 'DELETE');
      await reload();
    } catch (e) {
      // Affiché dans le formulaire au lieu d'un alert() bloquant.
      setError(`Suppression impossible : ${e.message}`);
      setTimeout(() => setError(''), 6000);
    }
  }

  if (editing) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-cream-50">
            {editing.isNew ? 'Nouveau plat' : `Modifier — ${editing.name || 'sans nom'}`}
          </h2>
          <button onClick={() => setEditing(null)} className="text-cream-50/40 hover:text-cream-50 text-sm">
            Fermer ✕
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nom du plat">
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </Field>
          <Field label="Prix (€)">
            <Input
              type="number"
              step="0.01"
              value={editing.price}
              onChange={(e) => setEditing({ ...editing, price: e.target.value })}
            />
          </Field>
          <Field label="Catégorie">
            <Select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
              <option value="">— Aucune —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ordre d'affichage" hint="Plus petit = apparaît en premier.">
            <Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: e.target.value })} placeholder="auto" />
          </Field>
          <Field label="Disponibilité">
            <div className="pt-1">
              <Toggle checked={editing.available !== false} onChange={(v) => setEditing({ ...editing, available: v })} label={editing.available !== false ? 'Visible sur le site' : 'Masqué'} />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Description">
            <TextArea rows={2} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label="Photo du plat"
            hint="URL, fichier ou photo (mobile). Les envois sont stockés sur Firebase Storage."
          >
            <ImagePicker value={editing.img} onChange={(url) => setEditing({ ...editing, img: url })} />
          </Field>
        </div>

        {error && <p className="text-sm text-red-300 mt-4">{error}</p>}

        <div className="flex gap-2 mt-6">
          <Btn onClick={save} disabled={saving || !editing.name}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn>
          <Btn variant="ghost" onClick={() => setEditing(null)}>Annuler</Btn>
        </div>
      </Card>
    );
  }

  // Tri stable : par ordre d'affichage, puis nom. Filtres : catégorie + recherche.
  const sortedCats = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sorted = [...dishes].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
  );
  const q = query.trim().toLowerCase();
  const filtered = sorted.filter((d) => {
    const matchCat = filterCat === 'all' || d.categoryId === filterCat;
    const matchQ =
      !q || d.name.toLowerCase().includes(q) || catName(d.categoryId).toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  const defaultCatForNew = filterCat !== 'all' ? filterCat : sortedCats[0]?.id;

  // Vue groupée par défaut (sans recherche ni filtre). Sinon liste filtrée plate.
  const grouped = filterCat === 'all' && !q;
  const groupForCat = (catId) => filtered.filter((d) => d.categoryId === catId);
  const uncategorized = filtered.filter((d) => !categories.some((c) => c.id === d.categoryId));

  return (
    <div>
      {/* Barre d'outils : recherche + filtre catégorie + ajout */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-cream-50/50">
            {dishes.length} plat(s) · {categories.length} catégorie(s)
          </p>
          <Btn onClick={() => setEditing({ ...blankDish(defaultCatForNew), isNew: true })}>+ Ajouter un plat</Btn>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="🔎 Rechercher un plat ou une catégorie…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="sm:max-w-[220px]">
            <option value="all">Toutes les catégories</option>
            {sortedCats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          {(query || filterCat !== 'all') && (
            <Btn variant="ghost" onClick={() => { setQuery(''); setFilterCat('all'); }}>Réinitialiser</Btn>
          )}
        </div>
      </div>

      {/* Vue groupée par catégorie (par défaut) */}
      {grouped ? (
        <div className="space-y-7">
          {sortedCats.map((c) => {
            const items = groupForCat(c.id);
            if (items.length === 0) return null;
            return (
              <section key={c.id}>
                <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-white/[0.07]">
                  <h3 className="font-serif text-base text-gold-400 flex items-center gap-2">
                    <iconify-icon icon="solar:widget-linear" className="text-base" />
                    {c.name}
                    <span className="text-xs text-cream-50/40 font-sans font-normal">({items.length})</span>
                  </h3>
                  <button
                    onClick={() => setEditing({ ...blankDish(c.id), isNew: true })}
                    className="text-xs text-cream-50/50 hover:text-gold-400 transition-colors flex items-center gap-1"
                  >
                    <iconify-icon icon="solar:add-circle-linear" className="text-sm" />
                    Ajouter ici
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((d) => (
                    <DishRow key={d.id} d={d} catName={catName} onEdit={() => setEditing({ ...d })} onRemove={() => remove(d)} />
                  ))}
                </div>
              </section>
            );
          })}
          {uncategorized.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-white/[0.07]">
                <h3 className="font-serif text-base text-cream-50/60 flex items-center gap-2">
                  <iconify-icon icon="solar:question-circle-linear" className="text-base" />
                  Sans catégorie
                  <span className="text-xs text-cream-50/40 font-sans font-normal">({uncategorized.length})</span>
                </h3>
              </div>
              <div className="space-y-2">
                {uncategorized.map((d) => (
                  <DishRow key={d.id} d={d} catName={catName} onEdit={() => setEditing({ ...d })} onRemove={() => remove(d)} />
                ))}
              </div>
            </section>
          )}
          {dishes.length === 0 && (
            <p className="text-center text-cream-50/40 py-12">
              Aucun plat. Cliquez sur « Ajouter un plat ».
            </p>
          )}
        </div>
      ) : (
        /* Vue liste filtrée (recherche ou filtre actif) */
        <div className="space-y-2">
          {filtered.map((d) => (
            <DishRow key={d.id} d={d} catName={catName} onEdit={() => setEditing({ ...d })} onRemove={() => remove(d)} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-cream-50/40 py-12">
              {dishes.length === 0
                ? 'Aucun plat. Cliquez sur « Ajouter un plat ».'
                : 'Aucun plat ne correspond à votre recherche.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Ligne plat (commune aux vues groupée et filtrée) — image, nom, prix, actions.
function DishRow({ d, catName, onEdit, onRemove }) {
  return (
    <Card className="flex items-center gap-4">
      <img
        src={d.img}
        alt=""
        onLoad={(e) => e.currentTarget.classList.add('loaded')}
        onError={(e) => { e.currentTarget.style.opacity = '0'; }}
        className="w-14 h-14 rounded-lg object-cover bg-th-950 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-cream-50 truncate">{d.name}</h3>
          {d.available === false && (
            <span className="text-[10px] uppercase tracking-wide bg-white/10 text-cream-50/50 px-2 py-0.5 rounded-full">masqué</span>
          )}
        </div>
        <p className="text-xs text-cream-50/40">
          {catName(d.categoryId)} · {formatPrice(d.price)}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Btn variant="ghost" onClick={onEdit}>Modifier</Btn>
        <Btn variant="danger" onClick={onRemove}>Suppr.</Btn>
      </div>
    </Card>
  );
}
