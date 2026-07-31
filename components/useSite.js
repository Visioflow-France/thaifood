'use client';

import { useEffect, useState } from 'react';

// ============================================================================
//  Hook centralisé de récupération des infos du site (/api/site) : téléphone,
//  mentions légales, champs légaux, horaires, réseaux sociaux, contenu de
//  l'accueil. Cache module-level : un seul fetch partagé entre tous les
//  composants de la page.
// ============================================================================

let _cache = null;
let _promise = null;

function fetchSite() {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch('/api/site', { cache: 'no-store' })
    .then((r) => r.json())
    .then((j) => {
      _cache = j || {};
      return _cache;
    })
    .catch(() => {
      _cache = {};
      return _cache;
    })
    .finally(() => {
      _promise = null;
    });
  return _promise;
}

export function refreshSite() {
  _cache = null;
  return fetchSite();
}

export default function useSite() {
  const [site, setSite] = useState(_cache || {});

  useEffect(() => {
    let active = true;
    fetchSite().then((s) => {
      if (active) setSite(s);
    });
    return () => {
      active = false;
    };
  }, []);

  return site;
}
