'use client';

import { useState } from 'react';
import { api } from './api';
import { Btn, Card, DebouncedInput, Field, Input, Select } from './ui';
import { SECTIONS, OTHER_SECTION, sectionOf } from '../../lib/sections';

// Toutes les sections proposées dans le sélecteur (ordre d'affichage).
const SECTION_OPTIONS = [...SECTIONS, OTHER_SECTION];

export default function CategoryManager({ categories, dishes, reload }) {
  const sorted = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [name, setName] = useState('');
  const [section, setSection] = useState(SECTIONS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api('/api/admin/categories', 'POST', { name: name.trim(), section });
      setName('');
      setSection(SECTIONS[0].id);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function update(cat, patch) {
    try {
      await api(`/api/admin/categories/${cat.id}`, 'PUT', { ...cat, ...patch });
      await reload();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(cat) {
    const count = dishes.filter((d) => d.categoryId === cat.id).length;
    const msg = count
      ? `Supprimer « ${cat.name} » ? ${count} plat(s) s'y trouvent : ils apparaîtront toujours dans « Tout » mais plus sous cette catégorie.`
      : `Supprimer « ${cat.name} » ?`;
    if (!confirm(msg)) return;
    await api(`/api/admin/categories/${cat.id}`, 'DELETE');
    await reload();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <h2 className="font-serif text-lg text-cream-50 mb-3">Catégories existantes</h2>
        <div className="space-y-2">
          {sorted.map((c) => {
            const count = dishes.filter((d) => d.categoryId === c.id).length;
            return (
              <Card key={c.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <DebouncedInput
                    value={c.name}
                    onChange={(val) => update(c, { name: val })}
                    className="font-medium"
                  />
                  <p className="text-[11px] text-cream-50/40 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{count} plat(s)</span>
                    <span className="text-cream-50/30">· cuisine</span>
                    <Select
                      value={sectionOf(c)}
                      onChange={(e) => update(c, { section: e.target.value })}
                      className="!w-auto !px-2 !py-0.5 text-xs"
                    >
                      {SECTION_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.emoji} {s.label}
                        </option>
                      ))}
                    </Select>
                    <span className="text-cream-50/30">· ordre</span>
                    <DebouncedInput
                      type="number"
                      value={c.order ?? 0}
                      onChange={(val) => update(c, { order: Number(val) || 0 })}
                      className="!w-16 !px-2 !py-0.5 text-xs"
                    />
                  </p>
                </div>
                <Btn variant="danger" onClick={() => remove(c)}>Suppr.</Btn>
              </Card>
            );
          })}
          {sorted.length === 0 && (
            <p className="text-cream-50/40 text-sm">Aucune catégorie.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-lg text-cream-50 mb-3">Ajouter une catégorie</h2>
        <Card>
          <form onSubmit={add} className="space-y-3">
            <Field label="Nom de la catégorie" hint="ex : Menu midi, Boissons, Desserts…">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle catégorie" />
            </Field>
            <Field label="Cuisine / section" hint="Regroupe cette catégorie sous un onglet du site.">
              <Select value={section} onChange={(e) => setSection(e.target.value)}>
                {SECTION_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Btn type="submit" disabled={busy || !name.trim()}>{busy ? '…' : 'Ajouter'}</Btn>
          </form>
        </Card>
        <p className="text-[11px] text-cream-50/30 mt-3">
          Astuce : l'« ordre » contrôle l'ordre des filtres et des plats sur le site.
        </p>
      </div>
    </div>
  );
}
