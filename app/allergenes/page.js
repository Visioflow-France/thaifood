// Page « Informations allergènes » — conformité INCO (règlement UE n° 1169/2011,
// annexe II) : les 14 allergènes majeurs doivent être communiqués aux clients.
// Pour les denrées non préemballées (restauration), la communication par tout
// moyen est autorisée ; le détail par plat est tenu à disposition sur demande.

export const metadata = {
  title: 'Allergènes — Thaï Food 77',
  description: 'Informations sur les allergènes majeurs présents dans nos plats. Détail par plat disponible sur demande au restaurant.',
  alternates: { canonical: '/allergenes' },
};

const ALLERGENS = [
  { name: 'Gluten', detail: 'Céréales contenant du gluten (blé, seigle, orge, avoine, épeautre, kamut). Présent dans les nouilles, sauces au soja, desserts.' },
  { name: 'Crustacés', detail: 'Crevettes, crabes et autres crustacés.' },
  { name: 'Œufs', detail: 'Présents dans certaines marinades, beignets et sauces.' },
  { name: 'Poissons', detail: 'Notamment dans les bouillons et certaines préparations (ex. sauce nuoc-mâm). ' },
  { name: 'Arachides', detail: 'Cacahuètes et dérivés, fréquentes dans la cuisine thaïlandaise.' },
  { name: 'Soja', detail: 'Sauce soja et dérivés.' },
  { name: 'Lait', detail: 'Lait et produits laitiers, y compris lactose.' },
  { name: 'Fruits à coque', detail: 'Amandes, noisettes, noix de cajou, noix, etc.' },
  { name: 'Céleri', detail: 'Céleri et produits dérivés.' },
  { name: 'Moutarde', detail: 'Graines de moutarde et dérivés.' },
  { name: 'Graines de sésame', detail: 'Sésame et huile de sésame.' },
  { name: 'Anhydride sulfureux / sulfites', detail: 'Présents dans certains condiments et vinaigres.' },
  { name: 'Lupin', detail: 'Farine ou graines de lupin.' },
  { name: 'Mollusques', detail: 'Moules, palourdes et autres mollusques.' },
];

export default function Allergenes() {
  return (
    <main className="min-h-screen bg-th-950 text-cream-50 noise">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cream-50/50 hover:text-gold-400 transition-colors mb-8"
        >
          <iconify-icon icon="solar:alt-arrow-left-linear" className="text-base" />
          Retour à l&apos;accueil
        </a>

        <h1 className="font-serif text-3xl text-cream-50 mb-6">Informations allergènes</h1>

        <div className="flex items-start gap-3 bg-white/[0.04] border border-gold-400/20 rounded-xl px-4 py-3 mb-8">
          <iconify-icon icon="solar:info-circle-linear" className="text-lg text-gold-400 mt-0.5" />
          <p className="text-sm text-cream-50/70 font-light leading-relaxed">
            Nos plats peuvent contenir l&apos;un des 14 allergènes majeurs listés ci-dessous
            (règlement UE n°&nbsp;1169/2011). Le détail précis par plat est tenu à votre
            disposition : demandez-le à notre équipe au restaurant ou précisez votre allergie
            lors de la commande en ligne.
          </p>
        </div>

        <div className="space-y-3">
          {ALLERGENS.map((a, i) => (
            <div
              key={a.name}
              className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-400/10 text-gold-400 text-sm font-medium ring-1 ring-gold-400/20 shrink-0">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-cream-50">{a.name}</div>
                <div className="text-xs text-cream-50/45 font-light leading-relaxed mt-0.5">
                  {a.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-cream-50/35 font-light leading-relaxed mt-8">
          Malgré toutes les précautions prises en cuisine, nous ne pouvons garantir
          l&apos;absence totale de traces. En cas d&apos;allergie grave, merci de nous en
          informer avant de commander.
        </p>
      </div>
    </main>
  );
}
