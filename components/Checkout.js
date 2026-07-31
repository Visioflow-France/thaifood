'use client';

import { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import useSite from './useSite';
import { isOpenNow, formatNextOpening } from '../lib/hours';
import {
  computeTotals,
  formatPrice,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
} from '../lib/pricing';

// ============================================================================
//  Étape « Coordonnées » du tunnel de commande.
//  - Choix du mode : retrait sur place / livraison (frais + offre au seuil).
//  - Choix du créneau : dès que possible / heure précise.
//  - Coordonnées client + validation inline.
//  - Récapitulatif live (sous-total, livraison, total) et envoi à /api/orders.
// ============================================================================

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  postalCode: '',
  city: '',
  notes: '',
};

export default function Checkout() {
  const { items, placeOrder } = useCart();
  const site = useSite();
  const closed = !isOpenNow(site.hours);
  const reopenText = formatNextOpening(site.hours);

  const [type, setType] = useState('pickup'); // 'pickup' | 'delivery'
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [onlinePayment, setOnlinePayment] = useState(false);

  // Paiement en ligne actif ? (sinon : règlement sur place / à la livraison)
  useEffect(() => {
    let active = true;
    fetch('/api/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => active && setOnlinePayment(!!j.onlinePayment))
      .catch(() => active && setOnlinePayment(false));
    return () => {
      active = false;
    };
  }, []);

  const totals = computeTotals(items, type);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const freeDelivery = type === 'delivery' && totals.subtotal >= FREE_DELIVERY_THRESHOLD;

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Requis';
    if (!form.lastName.trim()) e.lastName = 'Requis';
    if (!form.phone.trim()) e.phone = 'Requis';
    else if (!/^[+0-9().\s-]{8,}$/.test(form.phone)) e.phone = 'Numéro invalide';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail invalide';
    if (type === 'delivery') {
      if (!form.address.trim()) e.address = 'Requis';
      if (!/^\d{5}$/.test(form.postalCode.trim())) e.postalCode = '5 chiffres';
      if (!form.city.trim()) e.city = 'Requis';
    }
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError('');
    if (closed) {
      setServerError(`Le restaurant est actuellement fermé. Réouverture ${reopenText}.`);
      return;
    }
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    const res = await placeOrder({
      type,
      scheduledFor: null,
      customer: form,
    });
    setSubmitting(false);
    if (!res.ok) setServerError(res.error || 'Une erreur est survenue.');
  }

  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        {/* Mode de commande */}
        <Section title="Mode de commande" icon="solar:routing-2-linear">
          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              active={type === 'pickup'}
              onClick={() => setType('pickup')}
              icon="solar:hand-bag-linear"
              title="Retrait sur place"
              hint="À récupérer au restaurant"
            />
            <TypeCard
              active={type === 'delivery'}
              onClick={() => setType('delivery')}
              icon="solar:scooter-linear"
              title="Livraison"
              hint={`${formatPrice(DELIVERY_FEE)} · offert dès ${formatPrice(FREE_DELIVERY_THRESHOLD)}`}
            />
          </div>
        </Section>

        {/* Coordonnées */}
        <Section title="Vos coordonnées" icon="solar:user-id-linear">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Prénom"
              name="firstName"
              value={form.firstName}
              onChange={setField}
              error={errors.firstName}
              autoComplete="given-name"
              required
            />
            <Field
              label="Nom"
              name="lastName"
              value={form.lastName}
              onChange={setField}
              error={errors.lastName}
              autoComplete="family-name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field
              label="Téléphone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={setField}
              error={errors.phone}
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              required
            />
            <Field
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={setField}
              error={errors.email}
              autoComplete="email"
              placeholder="(optionnel)"
            />
          </div>
        </Section>

        {/* Adresse (livraison uniquement) */}
        {type === 'delivery' && (
          <Section title="Adresse de livraison" icon="solar:map-point-linear">
            <Field
              label="Adresse"
              name="address"
              value={form.address}
              onChange={setField}
              error={errors.address}
              autoComplete="street-address"
              placeholder="12 rue des Lilas"
              required
            />
            <div className="grid grid-cols-[110px_1fr] gap-3 mt-3">
              <Field
                label="Code postal"
                name="postalCode"
                value={form.postalCode}
                onChange={setField}
                error={errors.postalCode}
                autoComplete="postal-code"
                placeholder="77000"
                required
              />
              <Field
                label="Ville"
                name="city"
                value={form.city}
                onChange={setField}
                error={errors.city}
                autoComplete="address-level2"
                required
              />
            </div>
          </Section>
        )}

        {/* Notes */}
        <Section title="Instructions (optionnel)" icon="solar:chat-round-dots-linear">
          <textarea
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={2}
            placeholder="Allergies, sans piment, interphone, déposé à la porte…"
            className="form-input w-full px-3.5 py-2.5 rounded-lg text-sm resize-none"
          />
        </Section>
      </div>

      {/* Pied : récap + validation */}
      <div className="px-6 py-5 border-t border-white/[0.06] bg-th-900/60">
        <div className="space-y-1.5 mb-4">
          <Row label={`${count} article${count > 1 ? 's' : ''}`} value={formatPrice(totals.subtotal)} />
          {type === 'delivery' && (
            <Row
              label="Livraison"
              value={freeDelivery ? 'Offerte' : formatPrice(totals.deliveryFee)}
              accent={freeDelivery}
            />
          )}
          <div className="h-px bg-white/[0.06] my-2" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-cream-50/70">Total</span>
            <span className="font-serif text-2xl text-gold-400">{formatPrice(totals.total)}</span>
          </div>
        </div>

        {serverError && (
          <div className="mb-3 flex items-start gap-2 text-[12px] text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
            <iconify-icon icon="solar:danger-triangle-linear" className="text-base mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {closed && (
          <div className="mb-3 flex items-start gap-2 text-[12px] text-red-200 bg-red-500/10 border border-red-400/25 rounded-lg px-3 py-2">
            <iconify-icon icon="solar:lock-keyhole-minimalistic-linear" className="text-base mt-0.5 text-red-300" />
            <span>
              Le restaurant est actuellement fermé. La commande en ligne revient{' '}
              <strong className="font-medium">{reopenText}</strong>.
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || closed}
          className="cta-primary w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <iconify-icon icon="solar:spinner-round-linear" className="text-base animate-spin" />
              {onlinePayment ? 'Redirection vers le paiement…' : 'Enregistrement…'}
            </>
          ) : (
            <>
              <iconify-icon
                icon={onlinePayment ? 'solar:card-transfer-linear' : 'solar:check-circle-linear'}
                className="text-base"
              />
              {onlinePayment ? 'Confirmer & payer' : 'Confirmer la commande'} · {formatPrice(totals.total)}
            </>
          )}
        </button>
        <p className="text-[11px] text-cream-50/30 text-center mt-3 leading-relaxed">
          {onlinePayment
            ? 'Paiement sécurisé par Stripe · vous serez redirigé(e) pour régler.'
            : 'Vous serez recontacté(e) pour confirmation. Règlement sur place ou à la livraison.'}
        </p>
      </div>
    </form>
  );
}

function Section({ title, icon, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <iconify-icon icon={icon} className="text-gold-400/80 text-base" />
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-cream-50/60">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function TypeCard({ active, onClick, icon, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all duration-300 ${
        active
          ? 'border-gold-400/70 bg-gold-400/[0.07] shadow-[0_0_0_3px_rgba(201,169,110,0.08)]'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-gold-400/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <iconify-icon
          icon={icon}
          className={`text-2xl ${active ? 'text-gold-400' : 'text-cream-50/50'}`}
        />
        <span
          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
            active ? 'border-gold-400 bg-gold-400' : 'border-white/20'
          }`}
        >
          {active && <iconify-icon icon="solar:check-bold" className="text-[10px] text-th-950" />}
        </span>
      </div>
      <div className={`mt-3 text-sm font-medium ${active ? 'text-cream-50' : 'text-cream-50/80'}`}>
        {title}
      </div>
      <div className="text-[11px] text-cream-50/45 mt-0.5 leading-snug">{hint}</div>
    </button>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder, required, autoComplete }) {
  return (
    <label className="block">
      <span className="block text-xs text-cream-50/55 mb-1.5">
        {label}
        {required && <span className="text-gold-400"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`form-input w-full px-3.5 py-2.5 rounded-lg text-sm ${
          error ? 'border-red-400/60' : ''
        }`}
      />
      {error && <span className="block text-[11px] text-red-400/90 mt-1">{error}</span>}
    </label>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-cream-50/50">{label}</span>
      <span className={accent ? 'text-gold-400 font-medium' : 'text-cream-50/80'}>{value}</span>
    </div>
  );
}
