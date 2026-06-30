import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STEPS = [
  'seedUser.js',
  'seedCategoriesBrands.js',
  'seedProducts.js',
  'seedMoreProducts.js',
  'seedCMS.js',
  'seedOps.js',
];

console.log('Starting full database seed...\n');

for (const script of STEPS) {
  const label = script.replace('.js', '');
  console.log(`\n========== ${label} ==========`);
  try {
    execSync(`node ${path.join(__dirname, script)}`, {
      stdio: 'inherit',
      cwd: __dirname,
      env: process.env,
    });
  } catch {
    console.error(`\nSeed failed at: ${script}`);
    process.exit(1);
  }
}

console.log('\n========== done ==========');
console.log('Admin:    admin@admin.com / password');
console.log('Customer: customer@demo.com / password');
console.log('Coupons:  WELCOME10, FLAT5, FREESHIP');
