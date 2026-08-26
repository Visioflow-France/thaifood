// ============================================================================
//  POUSSE LES SECRETS VERS CLOUDFLARE — lit .env.local et alimente le Worker.
//  Usage (une seule fois, après `npx wrangler login`) :
//    node scripts/push-cloudflare-secrets.mjs
//  Puis redéploie (git push ou « Retry deploy » dans le dashboard Cloudflare).
// ----------------------------------------------------------------------------
//  N'envoie QUE les variables sensibles. Les variables publiques
//  (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
//  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, PLATFORM_COMMISSION_PERCENT)
//  restent dans wrangler.toml [vars].
// ============================================================================
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SECRETS = [
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'SESSION_SECRET',
  'FIREBASE_PRIVATE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Aucun .env.local trouvé — créez-le d’abord (voir .env.example).');
  process.exit(1);
}

// Parse minimaliste KEY=VALUE (les guillemets englobants sont retirés).
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}

let failures = 0;
for (const key of SECRETS) {
  const value = env[key];
  if (!value || /^(A-COMPLETER|CHANGE-MOI)/.test(value)) {
    console.warn(`⚠️  ${key} : absente ou placeholder dans .env.local — ignorée.`);
    failures++;
    continue;
  }
  process.stdout.write(`→ ${key}… `);
  try {
    // La valeur est passée sur l'entrée standard du prompt wrangler.
    execSync(`npx wrangler secret put ${key}`, {
      input: value + '\n',
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    console.log('ok');
  } catch {
    console.error('ÉCHEC');
    failures++;
  }
}

console.log(
  failures === 0
    ? '\n✅ Tous les secrets sont en ligne. Redéploie le site (git push) pour les activer.'
    : `\n⚠️  ${failures} secre(s) non envoyé(s) — corrige .env.local puis relance.`
);
