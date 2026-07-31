'use client';

import { useCallback, useEffect, useState } from 'react';
import staticMenu from '../data/menu.json';

// ============================================================================
//  Hook de récupération du menu — ZERO POLLING (forfait Spark).
// ----------------------------------------------------------------------------
//  Le menu est EMBARQUÉ dans le bundle (data/menu.json) : les plats
//  s'affichent IMMÉDIATEMENT à l'ouverture, sans attendre /api/menu.
//
//  On interroge /api/menu UNE SEULE FOIS au montage pour récupérer les
//  éventuelles modifications faites depuis le dashboard (lecture = 1 document
//  Firestore côté serveur, partagée via le cache serveur). Aucune requête en
//  boucle : on ne recharge jamais automatiquement.
// ============================================================================

export default function useMenu() {
  const [menu, setMenu] = useState(staticMenu);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // On ne remplace QUE si l'API renvoie réellement des données :
        // évite d'écraser le menu embarqué par une réponse vide.
        if (data && ((data.dishes && data.dishes.length) || (data.categories && data.categories.length))) {
          setMenu(data);
        }
      }
    } catch {
      /* API indisponible : on conserve le menu embarqué */
    }
  }, []);

  useEffect(() => {
    refresh();
    // Aucun setInterval, aucune écoute visibilitychange : une seule lecture.
  }, [refresh]);

  return {
    categories: menu.categories || [],
    dishes: menu.dishes || [],
    promos: menu.promos || [],
    loading,
    refresh,
  };
}
