'use client';

import { useEffect, useState } from 'react';
import { useCart } from './CartContext';

// Liens affichés dans la barre de navigation (vide : plus de lien « Commander »).
// Pour en rajouter plus tard : { href: '#commander', label: 'Commander' }.
const LINKS = [];

export default function Navbar() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  // Effet "scrolled" sur la navbar.
  useEffect(() => {
    const onScroll = () => {
      const nav = document.getElementById('navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav
        id="navbar"
        className="nav-blur fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="font-serif text-xl sm:text-2xl font-semibold text-cream-50 tracking-tight">
              Thaï Food
            </span>
            <span className="text-gold-400 font-serif text-xl sm:text-2xl">77</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-cream-50/60 hover:text-gold-400 transition-colors duration-300"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={openCart}
              className="relative p-2 group"
              aria-label="Panier"
            >
              <iconify-icon
                icon="solar:bag-3-linear"
                className="text-xl text-cream-50/70 group-hover:text-gold-400 transition-colors"
              />
              {count > 0 && (
                <span
                  key={count}
                  className="cart-badge absolute -top-0.5 -right-0.5 w-5 h-5 bg-gold-400 text-[10px] font-semibold text-th-900 rounded-full flex items-center justify-center"
                >
                  {count}
                </span>
              )}
            </button>

            {LINKS.length > 0 && (
              <button
                onClick={() => setMenuOpen(true)}
                className="md:hidden p-2"
                aria-label="Menu"
              >
                <iconify-icon
                  icon="solar:hamburger-menu-linear"
                  className="text-xl text-cream-50/70"
                />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      <div
        className={`mobile-menu fixed inset-0 z-[60] bg-th-900/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 ${
          menuOpen ? 'open' : ''
        }`}
      >
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-5 right-5 p-2"
          aria-label="Fermer"
        >
          <iconify-icon
            icon="solar:close-circle-linear"
            className="text-2xl text-cream-50/70"
          />
        </button>
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            className="font-serif text-3xl text-cream-50/80 hover:text-gold-400 transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>
    </>
  );
}
