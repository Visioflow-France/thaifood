'use client';

import { useEffect, useState } from 'react';

const SCHEDULE = [
  { day: 'Lundi', hours: 'Fermé', closed: true },
  { day: 'Mar – Ven', hours: '11h30 – 14h00' },
  { day: '', hours: '18h30 – 22h00' },
  { day: 'Samedi', hours: '18h30 – 22h30' },
  { day: 'Dimanche', hours: '12h00 – 22h00' },
];

const SOCIALS = [
  { icon: 'mdi:instagram', label: 'Instagram' },
  { icon: 'mdi:pinterest', label: 'Pinterest' },
  { icon: 'mdi:facebook', label: 'Facebook' },
];

export default function Footer() {
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetch('/api/site', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setPhone(j.phone || ''))
      .catch(() => {});
  }, []);

  const tel = phone.replace(/[^\d+]/g, '');

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
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-cream-50/40 hover:border-gold-400/40 hover:text-gold-400 transition-all"
                >
                  <iconify-icon icon={s.icon} className="text-lg" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs uppercase tracking-[0.15em] text-gold-400 mb-5 font-medium">
              Horaires
            </h4>
            <div className="space-y-3 text-sm text-cream-50/40 font-light">
              {SCHEDULE.map((row, i) => (
                <div key={i} className="flex justify-between max-w-[220px]">
                  <span>{row.day}</span>
                  <span className={row.closed ? 'text-cream-50/20' : ''}>{row.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs uppercase tracking-[0.15em] text-gold-400 mb-5 font-medium">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-cream-50/40 font-light">
              <div className="flex items-center gap-2">
                <iconify-icon icon="solar:map-point-linear" className="text-gold-400" />
                <span>12 Avenue de la République, 77340 Pontault-Combault</span>
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
                <a href="mailto:contact@thaifood77.fr" className="hover:text-gold-400 transition-colors">
                  contact@thaifood77.fr
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream-50/30">
            © {new Date().getFullYear()} Thaï Food 77. Tous droits réservés.
          </p>
          <div className="flex items-center gap-5 text-xs text-cream-50/30">
            <a href="/mentions-legales" className="hover:text-gold-400 transition-colors">
              Mentions légales
            </a>
            <span className="hidden sm:inline">Fait avec passion à Pontault-Combault.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
