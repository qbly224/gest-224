// Capture des écrans du tutoriel dans une instance locale de Gest-224 (http://localhost:3000,
// base de démonstration vide). À lancer dans l'ordre 1, 2, 3. Voir README.md, section 4 ter.
// Joue le parcours complet dans l'app locale et capture chaque écran.
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const OUT = __dirname + '/captures';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3000';
let n = 0;
const journal = [];

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR', acceptDownloads: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('gest224-cookies-ack', '1'); } catch {} });
  await ctx.route(/wa\.me|whatsapp|mail\.google/, r => r.abort());
  ctx.on('page', pg => { if (n > 0) pg.close().catch(() => {}); });
  const p = await ctx.newPage();
  p.on('dialog', d => d.accept());
  const shot = async (nom, el) => {
    if (el) await el.scrollIntoViewIfNeeded().catch(() => {});
    await p.waitForTimeout(350);
    const f = `${String(++n).padStart(2, '0')}-${nom}.png`;
    await p.screenshot({ path: `${OUT}/${f}` });
    journal.push(f);
  };
  const remplir = async (sel, val, nom) => { await p.fill(sel, val); await shot(nom, p.locator(sel)); };
  const boutons = async () => console.log('BOUTONS', p.url(), JSON.stringify(await p.$$eval('main button, main a', els => els.map(e => e.textContent.trim()).filter(Boolean))));
  const idle = async () => { await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(800); };

  // 1. Inscription
  await p.goto(BASE + '/inscription');
  await shot('inscription-vide');
  await p.fill('[name=raisonSociale]', 'Atelier Kanté');
  await p.fill('[name=siret]', '73282932000074');
  await p.selectOption('[name=regimeTva]', 'normal');
  await shot('inscription-entreprise', p.locator('[name=raisonSociale]'));
  await p.fill('[name=adresseLigne1]', '12 rue des Artisans');
  await p.fill('[name=codePostal]', '75011');
  await p.fill('[name=ville]', 'Paris');
  await p.fill('[name=prenom]', 'Mariama');
  await p.fill('[name=nom]', 'Kanté');
  await p.fill('[name=email]', 'demo@atelier-kante.test');
  await p.fill('[name=password]', 'DemoGest224!x');
  await p.check('[name=accepteCgu]');
  await shot('inscription-remplie', p.locator('[name=accepteCgu]'));
  await p.locator('button[type=submit]').last().click();
  await p.waitForURL(/tableau-de-bord/); await idle();
  await shot('tableau-de-bord-vide');

  // 2. Client
  await p.goto(BASE + '/clients/nouveau'); await idle();
  await shot('client-vide');
  await p.selectOption('[name=type]', 'professionnel');
  await remplir('[name=raisonSociale]', 'Boulangerie Diallo', 'client-nom');
  await p.fill('[name=adresseLigne1]', '8 avenue de la République');
  await p.fill('[name=codePostal]', '69003');
  await p.fill('[name=ville]', 'Lyon');
  if (await p.$('input[name=pays]')) await p.fill('[name=pays]', 'France');
  await shot('client-adresse', p.locator('[name=ville]'));
  await p.fill('[name=email]', 'contact@boulangerie-diallo.test');
  await remplir('[name=telephone]', '+33 6 12 34 56 78', 'client-contact');
  await p.locator('button[type=submit]').last().click(); await idle();
  await shot('client-cree');

  // 3. Devis
  await p.goto(BASE + '/devis/nouveau'); await idle();
  await shot('devis-vide');
  const opts = await p.$$eval('[name=clientId] option', o => o.map(x => [x.value, x.textContent]));
  await p.selectOption('[name=clientId]', opts.find(o => o[1].includes('Diallo'))[0]);
  await shot('devis-client', p.locator('[name=clientId]'));
  const lignes = [['Création site vitrine', '1', '1200'], ['Maintenance mensuelle', '12', '30'], ['Formation (2 h)', '1', '150']];
  for (let i = 0; i < lignes.length; i++) {
    if (i > 0) await p.getByRole('button', { name: /ajouter une ligne/i }).first().click();
    const row = p.locator('[data-testid=ligne-row]').nth(i);
    await row.locator('[data-testid=ligne-designation]').fill(lignes[i][0]);
    await row.locator('[data-testid=ligne-quantite]').fill(lignes[i][1]);
    await row.locator('[data-testid=ligne-prix]').fill(lignes[i][2]);
    await shot('devis-ligne' + (i + 1), row.locator('[data-testid=ligne-prix]'));
  }
  await shot('devis-totaux', p.getByText('Total TTC').last());
  await p.locator('button[type=submit]').last().click(); await idle();
  await shot('devis-cree');
  await boutons();

  // 4. PDF
  const href = await p.locator('a[href*="/pdf?telecharger"]').first().getAttribute('href');
  const rep = await p.request.get(BASE + href, { timeout: 90000 });
  console.log('PDF', rep.status(), rep.headers()['content-type']);
  fs.writeFileSync(OUT + '/devis.pdf', await rep.body());
  execFileSync('pdftoppm', ['-png', '-r', '170', '-f', '1', '-l', '1', OUT + '/devis.pdf', OUT + '/pdf-devis']);

  // 5. Envoi par WhatsApp
  await p.getByRole('button', { name: 'Envoyer' }).click();
  await shot('envoyer-menu');
  await p.getByRole('button', { name: 'Par WhatsApp' }).click(); await idle();
  await p.reload(); await idle();
  await shot('devis-envoye');
  await boutons();

  // 6. Accepté puis converti en facture
  await p.getByRole('button', { name: 'Marquer accepté' }).click(); await idle();
  await shot('devis-accepte');
  await boutons();
  await p.getByRole('button', { name: 'Convertir en facture' }).click(); await idle();
  await p.waitForTimeout(1500);
  console.log('apres conversion', p.url());
  await shot('facture-creee');
  await boutons();
  fs.writeFileSync(OUT + '/journal.json', JSON.stringify(journal));
  await ctx.storageState({ path: __dirname + '/state.json' });
  fs.writeFileSync(__dirname + '/url-facture.txt', p.url());
  await b.close();
})();
