'use client';

import { useEffect, useState } from 'react';

// Petits composants d'UI réutilisables pour le dashboard (palette du site).

export function Field({ label, hint, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-medium text-cream-50/60 mb-1">{label}</span>}
      {children}
      {hint && <span className="block text-[11px] text-cream-50/30 mt-1">{hint}</span>}
    </label>
  );
}

const base =
  'w-full bg-th-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-50 placeholder-cream-50/30 focus:outline-none focus:border-gold-400/60 transition-colors';

export function Input(props) {
  return <input {...props} className={`${base} ${props.className || ''}`} />;
}

// Champ avec enregistrement différé (debounce) : évite d'écrire en base à chaque
// frappe. Indispensable pour les champs « en ligne » (nom de catégorie, ordre…)
// car chaque PUT réécrit tout le menu.json (read-modify-write) — sans debounce,
// des frappes rapides se concurrencent et peuvent perdre des données.
export function DebouncedInput({ value, onChange, debounce = 450, ...props }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => {
    setV(value ?? '');
  }, [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (v !== value) onChange(v);
    }, debounce);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);
  return <Input value={v} onChange={(e) => setV(e.target.value)} {...props} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`${base} ${props.className || ''}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${base} ${props.className || ''}`}>
      {children}
    </select>
  );
}

export function Btn({ variant = 'primary', className = '', children, ...props }) {
  const styles = {
    primary: 'bg-gold-400 text-th-950 hover:bg-gold-300',
    ghost: 'bg-white/[0.05] text-cream-50 hover:bg-white/[0.1] border border-white/10',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30',
  }[variant];
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-cream-50/80"
    >
      <span
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-gold-400' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
      {label}
    </button>
  );
}

// Champ image : URL, fichier, ou photo (caméra sur mobile).
export function ImagePicker({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const { uploadImage } = await import('./api');
      const url = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      e.target.value = ''; // permet de rechoisir le même fichier
    }
  }

  const btn =
    'px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/10 text-cream-50/80 hover:bg-white/[0.1] cursor-pointer inline-flex items-center gap-1.5';
  const btnCls = busy ? `${btn} opacity-50 pointer-events-none` : btn;

  return (
    <div className="space-y-2">
      {value && (
        <img
          src={value}
          alt="aperçu"
          className="w-full h-40 object-cover rounded-lg border border-white/10 bg-th-950"
        />
      )}
      <Input
        placeholder="https://… (URL de l'image)"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className={btnCls}>
          {busy ? (
            'Envoi…'
          ) : (
            <>
              <iconify-icon icon="solar:gallery-linear" className="text-sm" />
              Fichier
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
        </label>
        {/* capture="environment" → ouvre l'appareil photo sur mobile */}
        <label className={btnCls}>
          {busy ? (
            'Envoi…'
          ) : (
            <>
              <iconify-icon icon="solar:camera-linear" className="text-sm" />
              Photo
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
            disabled={busy}
          />
        </label>
        {err && <span className="text-xs text-red-300">{err}</span>}
      </div>
    </div>
  );
}
