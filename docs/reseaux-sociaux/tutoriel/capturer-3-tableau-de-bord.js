// Capture des écrans du tutoriel dans une instance locale de Gest-224 (http://localhost:3000,
// base de démonstration vide). À lancer dans l'ordre 1, 2, 3. Voir README.md, section 4 ter.
const fs = require('fs');
const { chromium } = require('playwright');
const OUT = __dirname + '/captures';
const BASE = 'http://localhost:3000';
const journal = JSON.parse(fs.readFileSync(OUT + '/journal.json'));
let n = journal.length;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: __dirname + '/state.json', viewport: { width: 400, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gest224-cookies-ack', '1'); } catch {} });
  await ctx.route(/wa\.me|whatsapp|mail\.google/, r => r.abort());
  const p = await ctx.newPage();
  ctx.on('page', pg => { if (pg !== p) pg.close().catch(() => {}); });
  p.on('dialog', d => d.accept());
  const shot = async (nom, el) => {
    if (el) await el.scrollIntoViewIfNeeded().catch(() => {});
    await p.waitForTimeout(350);
    const f = `${String(++n).padStart(2, '0')}-${nom}.png`;
    await p.screenshot({ path: `${OUT}/${f}` }); journal.push(f);
  };
  const boutons = async () => console.log('BOUTONS', p.url(), JSON.stringify(await p.$$eval('main button, main a, main input, main select', els => els.map(e => (e.name ? '[' + e.name + ']' : '') + e.textContent.trim()).filter(Boolean))));
  const idle = async () => { await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(800); };
  await p.goto(BASE + '/tableau-de-bord'); await idle();
  await shot('tableau-de-bord-final');
  await shot('tableau-de-bord-solde', p.getByText('Solde global').first());
  await p.goto(BASE + '/recettes'); await idle();
  await shot('recettes');
  await p.goto(BASE + '/factures'); await idle();
  await shot('liste-factures');
  fs.writeFileSync(OUT + '/journal.json', JSON.stringify(journal));
  await b.close();
})();
