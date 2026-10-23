// Génère les visuels réseaux sociaux QbelyTech (PNG) à partir de blocs HTML,
// avec le logo officiel (visuels/logo-symbole.png) et la police Poppins.
// Usage : node docs/reseaux-sociaux/generer-visuels.js [dossier-de-sortie]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ici = __dirname;
const out = process.argv[2] || path.join(ici, 'visuels');
const dataUri = (f, type) => `data:${type};base64,${fs.readFileSync(path.join(ici, f)).toString('base64')}`;
const symbole = dataUri('visuels/logo-symbole.png', 'image/png');

// Couleurs relevées sur le logo officiel.
const C = { noir: '#111111', gris: '#1C1C1C', ivoire: '#F3ECE0', beige: '#C8B08A' };

const polices = [400, 600, 700].map(w => `@font-face{font-family:Poppins;font-weight:${w};src:url(${dataUri(`polices/poppins-latin-${w}-normal.woff2`, 'font/woff2')})}`).join('');
const base = `${polices}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Poppins,sans-serif}`;
const surtitre = (s, couleur) => `<span style="font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${couleur}">${s}</span>`;
// Reproduit le logotype : « Qbely » en gras, « Tech » en régulier.
const logotype = (taille, couleur) => `<span style="font-size:${taille}px;color:${couleur};letter-spacing:-.01em;line-height:1"><b style="font-weight:700">Qbely</b><span style="font-weight:400">Tech</span></span>`;
const img = (taille, extra = '') => `<img src="${symbole}" style="width:${taille}px;height:${taille}px;display:block;${extra}">`;

const REALISATIONS = [['01', 'Gest-224'], ['02', 'Werdhe'], ['03', null]];

// Fiches des réalisations : ajoutez-en une pour générer son post et sa
// couverture TikTok. « points » : 4 lignes courtes maximum.
const FICHES = [
  {
    id: 'gest-224', num: '01', nom: 'Gest-224', lien: 'gest-224.onrender.com',
    accroche: 'La gestion commerciale complète des petites entreprises, du devis à la facture.',
    slogan: 'Du devis à la facture<br>en quelques clics.',
    points: ['Devis, bons de commande et de livraison', 'Factures, acomptes et avoirs conformes', 'Clients et catalogue produits/services', 'Comptabilité simplifiée et tableau de bord'],
  },
  {
    id: 'werdhe', num: '02', nom: 'Werdhe', lien: 'werdhe.com',
    accroche: 'La gestion locative simple, entre propriétaires et locataires.',
    slogan: 'Votre loyer,<br>payé en Mobile Money.',
    points: ['Propriétaires : vos logements et locataires réunis', 'Locataires : un espace pour suivre votre location', 'Loyers payés par Orange Money et MTN MoMo', 'Pensé pour l\'Afrique francophone'],
  },
];

const postRealisation = f => `<div style="width:1080px;height:1350px;background:${C.ivoire};color:${C.noir};padding:90px 84px;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:22px">${surtitre(`Réalisation #${f.num}`, C.noir)}${logotype(30, C.noir)}</div>
    <div style="height:3px;background:${C.noir};margin:28px 0 80px"></div>
    <div style="font-size:140px;font-weight:700;line-height:1;letter-spacing:-.02em">${f.nom}</div>
    <div style="font-size:40px;line-height:1.4;margin-top:30px;opacity:.8">${f.accroche}</div>
    <div style="margin-top:64px;display:grid;gap:28px;font-size:33px">
      ${f.points.map(t => `<div style="display:flex;gap:24px;align-items:center"><span style="width:22px;height:22px;border-radius:0 0 0 11px;background:${C.beige};flex:none"></span>${t}</div>`).join('')}</div>
    <div style="margin-top:auto;background:${C.noir};color:${C.ivoire};border-radius:24px;padding:28px 36px;display:flex;justify-content:space-between;align-items:center;font-size:30px">
      <span>${f.lien ? `Découvrez-le sur <b>${f.lien}</b>` : 'Découvrez-le - lien dans la bio'}</span>${img(76, 'border-radius:12px')}</div></div>`;

// 1080×1920 : texte entre 520 et 1400 px, à l'abri des boutons TikTok.
const couvertureTiktok = f => `<div style="width:1080px;height:1920px;background:${C.noir};color:${C.ivoire};position:relative;overflow:hidden">
    <div style="position:absolute;top:190px;left:90px;display:flex;align-items:center;gap:22px">${img(84, 'border-radius:12px')}${logotype(44, C.ivoire)}</div>
    <div style="position:absolute;left:90px;right:90px;top:520px;bottom:520px;display:flex;flex-direction:column;justify-content:center">
      <div style="font-size:34px">${surtitre(`Réalisation #${f.num}`, C.beige)}</div>
      <div style="font-size:160px;font-weight:700;line-height:1;letter-spacing:-.02em;margin:30px 0">${f.nom}</div>
      <div style="font-size:54px;line-height:1.3;opacity:.9">${f.slogan}</div>
      <div style="margin-top:60px;height:8px;width:160px;border-radius:4px;background:${C.beige}"></div></div>
    <div style="position:absolute;right:-260px;bottom:-200px;opacity:.08">${img(900)}</div></div>`;

const designs = {
  // Symbole seul : lisible une fois rogné en rond par Facebook et TikTok.
  'photo-profil': [1080, 1080, `<div style="width:1080px;height:1080px;background:${C.noir};display:flex;align-items:center;justify-content:center">${img(700)}</div>`],

  // 1640×624 : texte dans la zone centrale, visible aussi sur mobile.
  'couverture-facebook': [1640, 624, `<div style="width:1640px;height:624px;background:${C.noir};position:relative;overflow:hidden">
    <div style="position:absolute;right:-300px;top:-20px;opacity:.07">${img(660)}</div>
    <div style="position:absolute;left:300px;right:300px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
      <div style="font-size:22px">${surtitre('Nos réalisations numériques', C.beige)}</div>
      <div style="margin:22px 0 26px">${logotype(124, C.ivoire)}</div>
      <div style="font-size:30px;color:${C.ivoire};opacity:.85;line-height:1.4">Une maison, toutes nos réalisations.<br><span style="color:${C.beige}">Gest-224 · Werdhe · et la suite</span></div>
      <div style="margin-top:34px;height:5px;width:120px;border-radius:3px;background:${C.beige}"></div></div></div>`],

  // Présente QbelyTech comme la structure qui regroupe toutes les réalisations.
  // Ajoutez une ligne à REALISATIONS à chaque nouveau projet.
  'post-nos-realisations': [1080, 1350, `<div style="width:1080px;height:1350px;background:${C.noir};color:${C.ivoire};padding:90px 84px;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:22px">${img(84, 'border-radius:12px')}${logotype(44, C.ivoire)}</div>
    <div style="font-size:24px;margin-top:80px">${surtitre('Une maison, plusieurs réalisations', C.beige)}</div>
    <div style="font-size:72px;font-weight:700;line-height:1.1;letter-spacing:-.01em;margin-top:22px">Tout ce que nous<br>construisons, au même endroit.</div>
    <div style="margin-top:64px;display:grid;gap:22px">
      ${REALISATIONS.map(([num, nom]) => `<div style="display:flex;align-items:center;gap:30px;padding:30px 36px;border-radius:24px;background:${nom ? C.gris : 'transparent'};border:2px ${nom ? 'solid' : 'dashed'} ${nom ? C.gris : 'rgba(243,236,224,.25)'}">
        <span style="font-size:30px;font-weight:600;color:${C.beige};width:64px;flex:none">#${num}</span>
        <span style="font-size:52px;font-weight:${nom ? 700 : 400};${nom ? '' : 'opacity:.5'}">${nom || 'Bientôt…'}</span></div>`).join('')}</div>
    <div style="margin-top:auto;font-size:28px;opacity:.75">Abonnez-vous pour suivre chaque nouvelle réalisation.</div></div>`],

  // Un post et une couverture TikTok par réalisation (voir FICHES plus haut).
  ...Object.fromEntries(FICHES.flatMap(f => [
    [`post-realisation-${f.id}`, [1080, 1350, postRealisation(f)]],
    [`couverture-video-tiktok-${f.id}`, [1080, 1920, couvertureTiktok(f)]],
  ])),
};

(async () => {
  const navigateur = await chromium.launch();
  for (const [nom, [w, h, html]] of Object.entries(designs)) {
    const page = await navigateur.newPage({ viewport: { width: w, height: h } });
    await page.setContent(`<html><head><style>${base}</style></head><body>${html}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `${nom}.png`) });
  }
  await navigateur.close();
})();
