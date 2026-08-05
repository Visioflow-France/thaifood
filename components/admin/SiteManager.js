'use client';

import { useCallback, useEffect, useState } from 'react';
import { Btn, Input, Card, Field, TextArea } from './ui';
import { isOpenNow, formatNextOpening } from '../../lib/hours';

// ============================================================================
//  Onglet « Informations » du dashboard — téléphone, horaires d'ouverture,
//  réseaux sociaux, contenu de la page d'accueil (photos + chef), informations
//  légales structurées et mentions légales. Tout est stocké dans Firestore.
// ============================================================================

const DAY_ROWS = [
  { n: 1, label: 'Lundi' },
  { n: 2, label: 'Mardi' },
  { n: 3, label: 'Mercredi' },
  { n: 4, label: 'Jeudi' },
  { n: 5, label: 'Vendredi' },
  { n: 6, label: 'Samedi' },
  { n: 0, label: 'Dimanche' },
];

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: 'mdi:instagram', placeholder: 'https://instagram.com/...' },
  { key: 'facebook', label: 'Facebook', icon: 'mdi:facebook', placeholder: 'https://facebook.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: 'mdi:tiktok', placeholder: 'https://tiktok.com/@...' },
  { key: 'tripadvisor', label: 'TripAdvisor', icon: 'mdi:tripadvisor', placeholder: 'https://tripadvisor.fr/...' },
];

function slotsOfDay(hours, n) {
  const arr = Array.isArray(hours[n]) ? hours[n] : Array.isArray(hours[String(n)]) ? hours[String(n)] : [];
  return [(arr[0] || { open: '', close: '' }), (arr[1] || { open: '', close: '' })];
}

export default function SiteManager() {
  const [phone, setPhone] = useState('');
  const [legal, setLegal] = useState('');
  const [fields, setFields] = useState({});
  const [hours, setHours] = useState({});
  const [socials, setSocials] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(''); // id du bloc en cours d'enregistrement
  const [saved, setSaved] = useState(''); // id du bloc venant d'être enregistré
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/site', { cache: 'no-store' });
      const j = await res.json();
      setPhone(j.phone || '');
      setLegal(j.legal || '');
      setFields(j.legalFields || {});
      setHours(j.hours || {});
      setSocials(j.socials || {});
    } catch {
      setErr('Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // POST générique vers /api/site avec un payload partiel.
  async function save(id, payload) {
    setBusy(id);
    setErr('');
    try {
      const res = await fetch('/api/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur');
      if (typeof j.phone === 'string') setPhone(j.phone);
      if (typeof j.legal === 'string') setLegal(j.legal);
      if (j.legalFields) setFields(j.legalFields);
      if (j.hours) setHours(j.hours);
      if (j.socials) setSocials(j.socials);
      setSaved(id);
      setTimeout(() => setSaved(''), 1800);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  }

  const setField = (name, value) => setFields((f) => ({ ...f, [name]: value }));
  const setSlot = (n, idx, field, value) =>
    setHours((prev) => {
      const cur = slotsOfDay(prev, n);
      cur[idx] = { ...cur[idx], [field]: value };
      return { ...prev, [n]: cur };
    });
  const setSocial = (k, v) => setSocials((s) => ({ ...s, [k]: v }));

  const openNow = isOpenNow(hours);

  if (loading) {
    return <p className="text-cream-50/40 text-sm">Chargement…</p>;
  }

  const saveBtn = (id, label) => (
    <Btn onClick={() => save(id, payloadFor(id))} disabled={busy === id}>
      {saved === id ? 'Enregistré ✓' : busy === id ? '…' : label}
    </Btn>
  );

  function payloadFor(id) {
    switch (id) {
      case 'phone': return { phone };
      case 'legalFields': return { legalFields: fields, regenerate: true };
      case 'legalFieldsOnly': return { legalFields: fields };
      case 'legal': return { legal };
      case 'hours': return { hours };
      case 'socials': return { socials };
      default: return {};
    }
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
              Affiché dans le bandeau « Commander par téléphone », l&apos;en-tête (réservation) et le pied de page.
            </p>
            <div className="flex items-center gap-2 max-w-sm">
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01 64 37 55 00" />
              {saveBtn('phone', 'Enregistrer')}
            </div>
          </div>
        </div>
      </Card>

      {/* Horaires d'ouverture */}
      <Card>
        <div className="flex items-start gap-3">
          <iconify-icon icon="solar:clock-circle-linear" className="text-2xl text-gold-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-serif text-lg text-cream-50">Horaires d&apos;ouverture</h3>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full border ${
                  openNow
                    ? 'bg-green-500/10 border-green-400/30 text-green-300'
                    : 'bg-red-500/10 border-red-400/30 text-red-300'
                }`}
              >
                {openNow ? 'Ouvert maintenant' : `Fermé — réouverture ${formatNextOpening(hours)}`}
              </span>
            </div>
            <p className="text-xs text-cream-50/45 mt-1 mb-4 leading-relaxed">
              Hors de ces créneaux, la commande en ligne est désactivée (barrière côté serveur).
              Laissez les deux créneaux vides pour un jour fermé.
            </p>
            <div className="space-y-2">
              {DAY_ROWS.map((row) => {
                const [s0, s1] = slotsOfDay(hours, row.n);
                const closed = !s0.open && !s0.close && !s1.open && !s1.close;
                return (
                  <div key={row.n} className="flex flex-wrap items-center gap-2 py-1">
                    <span className={`w-24 text-sm ${closed ? 'text-cream-50/40' : 'text-cream-50/80'}`}>{row.label}</span>
                    <input
                      type="time"
                      value={s0.open}
                      onChange={(e) => setSlot(row.n, 0, 'open', e.target.value)}
                      className="form-input w-[88px] px-2 py-1.5 rounded-lg text-xs"
                      style={{ colorScheme: 'dark' }}
                    />
                    <span className="text-cream-50/30 text-xs">–</span>
                    <input
                      type="time"
                      value={s0.close}
                      onChange={(e) => setSlot(row.n, 0, 'close', e.target.value)}
                      className="form-input w-[88px] px-2 py-1.5 rounded-lg text-xs"
                      style={{ colorScheme: 'dark' }}
                    />
                    <input
                      type="time"
                      value={s1.open}
                      onChange={(e) => setSlot(row.n, 1, 'open', e.target.value)}
                      className="form-input w-[88px] px-2 py-1.5 rounded-lg text-xs ml-2"
                      style={{ colorScheme: 'dark' }}
                    />
                    <span className="text-cream-50/30 text-xs">–</span>
                    <input
                      type="time"
                      value={s1.close}
                      onChange={(e) => setSlot(row.n, 1, 'close', e.target.value)}
                      className="form-input w-[88px] px-2 py-1.5 rounded-lg text-xs"
                      style={{ colorScheme: 'dark' }}
                    />
                    {closed && <span className="text-[11px] text-cream-50/30">Fermé</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-4">{saveBtn('hours', 'Enregistrer les horaires')}</div>
          </div>
        </div>
      </Card>

      {/* Réseaux sociaux */}
      <Card>
        <div className="flex items-start gap-3">
          <iconify-icon icon="solar:share-circle-linear" className="text-2xl text-gold-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cream-50">Réseaux sociaux</h3>
            <p className="text-xs text-cream-50/45 mt-1 mb-4 leading-relaxed">
              Collez les liens de vos pages. Un champ vide n&apos;affichera pas l&apos;icône dans le pied de page.
            </p>
            <div className="space-y-3">
              {SOCIAL_FIELDS.map((s) => (
                <Field key={s.key} label={s.label}>
                  <div className="flex items-center gap-2">
                    <iconify-icon icon={s.icon} className="text-lg text-gold-400/80" />
                    <Input
                      type="url"
                      value={socials[s.key] || ''}
                      onChange={(e) => setSocial(s.key, e.target.value)}
                      placeholder={s.placeholder}
                    />
                  </div>
                </Field>
              ))}
            </div>
            <div className="mt-4">{saveBtn('socials', 'Enregistrer les réseaux')}</div>
          </div>
        </div>
      </Card>

      {/* Informations légales structurées */}
      <Card>
        <div className="flex items-start gap-3">
          <iconify-icon icon="solar:document-text-linear" className="text-2xl text-gold-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cream-50">Informations légales</h3>
            <p className="text-xs text-cream-50/45 mt-1 mb-4 leading-relaxed">
              Renseignez ces champs puis « Régénérer » : le texte des mentions légales (modèle 2026)
              et l&apos;en-tête des tickets seront mis à jour automatiquement.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Raison sociale">
                <Input value={fields.companyName || ''} onChange={(e) => setField('companyName', e.target.value)} />
              </Field>
              <Field label="Forme juridique" hint="SARL, SAS, EI…">
                <Input value={fields.legalForm || ''} onChange={(e) => setField('legalForm', e.target.value)} />
              </Field>
              <Field label="SIRET">
                <Input value={fields.siret || ''} onChange={(e) => setField('siret', e.target.value)} placeholder="123 456 789 00012" />
              </Field>
              <Field label="RCS" hint="RCS + ville + numéro">
                <Input value={fields.rcs || ''} onChange={(e) => setField('rcs', e.target.value)} placeholder="RCS Melun B 123 456 789" />
              </Field>
              <Field label="Capital social">
                <Input value={fields.capitalSocial || ''} onChange={(e) => setField('capitalSocial', e.target.value)} placeholder="5 000 €" />
              </Field>
              <Field label="TVA intracommunautaire">
                <Input value={fields.tvaIntracom || ''} onChange={(e) => setField('tvaIntracom', e.target.value)} placeholder="FR 12 345678901" />
              </Field>
              <Field label="Adresse" className="sm:col-span-2">
                <Input value={fields.streetAddress || ''} onChange={(e) => setField('streetAddress', e.target.value)} placeholder="142 Avenue Charles Rouxel" />
              </Field>
              <Field label="Code postal">
                <Input value={fields.postalCode || ''} onChange={(e) => setField('postalCode', e.target.value)} placeholder="77340" />
              </Field>
              <Field label="Ville">
                <Input value={fields.city || ''} onChange={(e) => setField('city', e.target.value)} placeholder="Pontault-Combault" />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={fields.email || ''} onChange={(e) => setField('email', e.target.value)} placeholder="pad.77thai@gmail.com" />
              </Field>
              <Field label="Directeur / Directrice de publication">
                <Input value={fields.publicationDirector || ''} onChange={(e) => setField('publicationDirector', e.target.value)} />
              </Field>
              <Field label="Hébergeur (nom)">
                <Input value={fields.hostName || ''} onChange={(e) => setField('hostName', e.target.value)} placeholder="Vercel Inc." />
              </Field>
              <Field label="Hébergeur (site web)">
                <Input value={fields.hostUrl || ''} onChange={(e) => setField('hostUrl', e.target.value)} placeholder="https://vercel.com" />
              </Field>
              <Field label="Hébergeur (adresse)" className="sm:col-span-2">
                <Input value={fields.hostAddress || ''} onChange={(e) => setField('hostAddress', e.target.value)} placeholder="340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis" />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {saveBtn('legalFields', 'Régénérer les mentions (2026)')}
              <Btn variant="ghost" onClick={() => save('legalFieldsOnly', { legalFields: fields })} disabled={busy === 'legalFieldsOnly'}>
                {saved === 'legalFieldsOnly' ? 'Enregistré ✓' : busy === 'legalFieldsOnly' ? '…' : 'Enregistrer les champs'}
              </Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Mentions légales (texte éditable) */}
      <Card>
        <div className="flex items-start gap-3">
          <iconify-icon icon="solar:essay-linear" className="text-2xl text-gold-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cream-50">Mentions légales (texte)</h3>
            <p className="text-xs text-cream-50/45 mt-1 mb-3 leading-relaxed">
              Affichées sur la page <code className="text-gold-400/80">/mentions-legales</code>.
              Format simple : <code className="text-gold-400/80"># Titre</code>,{' '}
              <code className="text-gold-400/80">## Sous-titre</code>, puis paragraphes.
            </p>
            <TextArea rows={16} value={legal} onChange={(e) => setLegal(e.target.value)} className="font-mono text-xs" />
            <div className="mt-3">{saveBtn('legal', 'Enregistrer les mentions')}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
