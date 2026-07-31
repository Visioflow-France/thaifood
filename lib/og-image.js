// ============================================================================
//  Rendu partagé de l'image de partage (Open Graph / Twitter) — PNG 1200×630
//  généré à la volée par next/og (ImageResponse). Aucun asset raster à produire.
//  Utilisé par app/opengraph-image.js et app/twitter-image.js.
//  JSX (élément React) — forme documentée attendue par ImageResponse.
// ============================================================================

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const GOLD = '#c9a96e';
const GOLD_LIGHT = '#e7cf99';
const CREAM = '#fefdf8';

export function renderOGImage() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background:
          'radial-gradient(120% 120% at 80% 0%, #1f1a10 0%, #121212 45%, #0a0a0a 100%)',
        fontFamily: 'sans-serif',
        color: CREAM,
      }}
    >
      {/* Filet doré haut */}
      <div style={{ height: 4, width: 90, background: GOLD, borderRadius: 4 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Étiquette */}
        <div
          style={{
            fontSize: 24,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: GOLD,
            fontWeight: 600,
          }}
        >
          Restaurant thaïlandais · Pontault-Combault
        </div>

        {/* Titre principal */}
        <div
          style={{
            fontSize: 110,
            lineHeight: 1.05,
            fontFamily: 'serif',
            fontWeight: 700,
            color: CREAM,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          <span>Thaï Food </span>
          <span style={{ color: GOLD, fontStyle: 'italic' }}>77</span>
        </div>

        {/* Sous-titre mots-clés */}
        <div style={{ fontSize: 44, color: 'rgba(254,253,248,0.85)', fontFamily: 'serif' }}>
          Restaurant Thaï &amp; Fast Food Thaï
        </div>
      </div>

      {/* Pied : plats / service */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(201,169,110,0.35)',
          paddingTop: 28,
        }}
      >
        <div style={{ fontSize: 28, color: 'rgba(254,253,248,0.7)' }}>
          Pad Thaï · Currys · Bobuns · Woks
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 28,
            color: GOLD_LIGHT,
            fontWeight: 600,
          }}
        >
          <span>★ 4,7</span>
          <span style={{ color: 'rgba(254,253,248,0.5)', fontWeight: 400 }}>
            · à emporter &amp; sur place
          </span>
        </div>
      </div>
    </div>
  );
}
