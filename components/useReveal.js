import { useEffect, useRef } from 'react';

// Ajoute la classe "active" aux éléments .reveal quand ils entrent dans le viewport.
//
// `deps` : dépendances qui déclenchent une nouvelle passe d'observation.
// Indispensable quand le contenu de la section change après le montage
// (ex : filtre de catégorie dans le menu) : les nouvelles cartes portent la
// classe .reveal (opacity: 0) mais n'étaient jamais observées -> restaient
// invisibles. En passant [activeCat] depuis Commander, on ré-observe les
// .reveal:not(.active) à chaque changement de filtre.
export default function useReveal(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // On ne ré-observe que les éléments pas encore révélés (évite de
    // réanimer l'en-tête de section déjà visible).
    const els = root.querySelectorAll('.reveal:not(.active)');

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('active'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
