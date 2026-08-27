'use client';

import useSite from './useSite';
import { getSlots, daySummary } from '../lib/hours';

// Jours affichés dans l'ordre Lun → Dim (getDay : 1..6, 0).
const DAY_ROWS = [
  { day: 1, label: 'Lundi' },
  { day: 2, label: 'Mardi' },
  { day: 3, label: 'Mercredi' },
  { day: 4, label: 'Jeudi' },
  { day: 5, label: 'Vendredi' },
  { day: 6, label: 'Samedi' },
  { day: 0, label: 'Dimanche' },
];

const SOCIAL_DEFS = [
  { key: 'instagram', icon: 'mdi:instagram', label: 'Instagram' },
  { key: 'facebook', icon: 'mdi:facebook', label: 'Facebook' },
  { key: 'tiktok', icon: 'mdi:tiktok', label: 'TikTok' },
  { key: 'tripadvisor', icon: 'mdi:tripadvisor', label: 'TripAdvisor' },
];

export default function Footer() {
  const site = useSite();
  const phone = site.phone || '';
  const hours = site.hours || {};
  const socials = site.socials || {};
  const email = site.legalFields?.email || 'pad.77thai@gmail.com';
  const addr = site.legalFields
    ? [site.legalFields.streetAddress, [site.legalFields.postalCode, site.legalFields.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : '142 Avenue Charles Rouxel, 77340 Pontault-Combault';

  const tel = phone.replace(/[^\d+]/g, '');
  const activeSocials = SOCIAL_DEFS.filter((s) => socials[s.key]);

  return (
    <footer className="bg-th-950 border-t border-white/[0.06] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="font-serif text-2xl font-semibold text-cream-50">Thaï Food</span>
              <span className="font-serif text-2xl text-gold-400">77</span>
            </div>
            <p className="text-sm text-cream-50/35 font-light leading-relaxed mb-6 max-w-xs">
              L&apos;authenticité thaïlandaise au cœur de Pontault-Combault. Des saveurs qui
              vous transportent.
            </p>
            <div className="flex gap-3">
              {activeSocials.length > 0 ? (
                activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={socials[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-cream-50/40 hover:border-gold-400/40 hover:text-gold-400 transition-all"
                  >
                    <iconify-icon icon={s.icon} className="text-lg" />
                  </a>
                ))
              ) : (
                <span className="text-xs text-cream-50/25">Réseaux sociaux à venir.</span>
              )}
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs uppercase tracking-[0.15em] text-gold-400 mb-5 font-medium">
              Horaires
            </h4>
            <div className="space-y-3 text-sm text-cream-50/40 font-light">
              {DAY_ROWS.map((row) => {
                const summary = daySummary(getSlots(hours, row.day));
                return (
                  <div key={row.day} className="flex justify-between gap-3 max-w-[240px]">
                    <span>{row.label}</span>
                    <span className={summary ? '' : 'text-cream-50/20'}>{summary || 'Fermé'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs uppercase tracking-[0.15em] text-gold-400 mb-5 font-medium">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-cream-50/40 font-light">
              <div className="flex items-center gap-2">
                <iconify-icon icon="solar:map-point-linear" className="text-gold-400" />
                <span>{addr || 'Adresse à renseigner'}</span>
              </div>
              <div className="flex items-center gap-2">
                <iconify-icon icon="solar:phone-linear" className="text-gold-400" />
                {phone ? (
                  <a href={`tel:${tel}`} className="hover:text-gold-400 transition-colors">
                    {phone}
                  </a>
                ) : (
                  <span className="text-cream-50/20">À définir</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <iconify-icon icon="solar:letter-linear" className="text-gold-400" />
                <a href={`mailto:${email}`} className="hover:text-gold-400 transition-colors">
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream-50/30">
            © {new Date().getFullYear()} Thaï Food 77. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center sm:justify-end text-xs text-cream-50/30">
            <a href="/mentions-legales" className="hover:text-gold-400 transition-colors">
              Mentions légales
            </a>
            <a href="/cgv" className="hover:text-gold-400 transition-colors">
              CGV
            </a>
            <a href="/allergenes" className="hover:text-gold-400 transition-colors">
              Allergènes
            </a>
            <span className="hidden sm:inline">Fait avec passion à Pontault-Combault.</span>
            <a
              href="https://visioflow.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-gold-400 transition-colors"
              title="Site internet créé par Visioflow — agence web"
            >
              <iconify-icon icon="solar:code-linear" className="text-sm" />
              Site créé par
              <span className="font-medium text-cream-50/50">Visioflow</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
