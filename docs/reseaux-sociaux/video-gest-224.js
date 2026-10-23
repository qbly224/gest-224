// Génère la vidéo TikTok de présentation de Gest-224 (1080×1920, 30 i/s, MP4).
// Même principe que video-werdhe.js : chaque image est calculée à partir du
// temps t, capturée par Playwright puis assemblée par ffmpeg.
// Usage : node docs/reseaux-sociaux/video-gest-224.js [fichier.mp4]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ici = __dirname;
const sortie = process.argv[2] || path.join(ici, 'videos', 'gest-224-presentation.mp4');
const FPS = 30;
const DUREE = 25;

const dataUri = (f, type) => `data:${type};base64,${fs.readFileSync(path.join(ici, f)).toString('base64')}`;
const symbole = dataUri('visuels/logo-symbole.png', 'image/png');
const polices = [400, 600, 700].map(w => `@font-face{font-family:Poppins;font-weight:${w};src:url(${dataUri(`polices/poppins-latin-${w}-normal.woff2`, 'font/woff2')})}`).join('');

const C = { noir: '#111111', gris: '#1C1C1C', gris2: '#262626', ivoire: '#F3ECE0', beige: '#C8B08A', vert: '#7FB77E', vertFonce: '#3D7A3C' };

const surtitre = s => `<div style="font-size:30px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${C.beige}">${s}</div>`;
const titre = s => `<div style="font-size:76px;font-weight:700;line-height:1.12;letter-spacing:-.01em;margin-top:24px">${s}</div>`;

// Document d'illustration (client et montants fictifs).
const lignes = [
  ['Création site vitrine', '1 200,00 €'],
  ['Maintenance - 12 mois', '360,00 €'],
  ['Formation (2 h)', '150,00 €'],
];
const totaux = [['Total HT', '1 710,00 €'], ['TVA 20 %', '342,00 €']];
const mois = [38, 52, 45, 61, 57, 74]; // hauteurs des barres du tableau de bord, en %

const html = `<html><head><style>${polices}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:${C.noir};color:${C.ivoire};font-family:Poppins,'Noto Color Emoji',sans-serif;overflow:hidden}
.scene{position:absolute;inset:0;padding:300px 90px 0;opacity:0}
.a{will-change:transform,opacity}
.doc{margin-top:56px;background:${C.ivoire};color:${C.noir};border-radius:28px;padding:44px 46px;position:relative;overflow:hidden}
.ligne{display:flex;justify-content:space-between;font-size:30px;padding:16px 0;border-bottom:2px solid rgba(17,17,17,.1)}
.carte{background:${C.gris};border-radius:28px;padding:30px 34px}
</style></head><body>

<div id="fond" style="position:absolute;right:-300px;bottom:-260px;opacity:.06"><img src="${symbole}" style="width:1000px"></div>

<div class="scene" id="s1" style="display:flex;flex-direction:column;justify-content:center;padding-top:0;padding-bottom:300px">
  <div class="a" id="s1a" style="font-size:80px;font-weight:700;line-height:1.15">Tu fais encore<br>tes factures</div>
  <div class="a" id="s1b" style="font-size:80px;font-weight:700;line-height:1.15;color:${C.beige}">sur Excel ?</div>
  <div class="a" id="s1c" style="font-size:150px;margin-top:40px">😅</div>
</div>

<div class="scene" id="s2" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:0;padding-bottom:300px">
  <div class="a" id="s2a">${surtitre('QbelyTech présente')}</div>
  <div class="a" id="s2b" style="font-size:190px;font-weight:700;letter-spacing:-.02em;line-height:1;margin:40px 0">Gest-224</div>
  <div class="a" id="s2c" style="font-size:50px;opacity:.9">Du devis à la facture,<br>en quelques clics.</div>
  <div class="a" id="s2d" style="margin-top:56px;height:8px;width:160px;border-radius:4px;background:${C.beige}"></div>
</div>

<!-- Scènes 3 et 4 : le même document passe de devis à facture. -->
<div class="scene" id="s3">
  <div style="position:relative;height:220px">
    <div class="a" id="s3a" style="position:absolute;inset:0">${surtitre('Étape 1')}${titre('Ton devis,<br>prêt en 1 minute.')}</div>
    <div class="a" id="s4a" style="position:absolute;inset:0;opacity:0">${surtitre('Étape 2')}${titre('Accepté ? Un clic,<br>c\'est une facture.')}</div>
  </div>
  <div class="doc a" id="doc">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div id="docType" style="font-size:44px;font-weight:700;letter-spacing:.06em">DEVIS</div>
      <div id="docNum" style="font-size:26px;opacity:.6;margin-top:4px">N° D-2026-014</div></div>
      <div style="text-align:right;font-size:24px;opacity:.7;line-height:1.4">Client<br><b style="font-size:28px;opacity:1">Atelier Kanté</b></div>
    </div>
    <div style="margin-top:36px">
      ${lignes.map(([l, m], i) => `<div class="ligne a" id="l${i}"><span>${l}</span><b>${m}</b></div>`).join('')}
    </div>
    <div class="a" id="tot" style="margin-top:22px">
      ${totaux.map(([l, m]) => `<div style="display:flex;justify-content:space-between;font-size:28px;opacity:.7;padding:6px 0"><span>${l}</span><span>${m}</span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;font-size:38px;font-weight:700;margin-top:10px;padding-top:16px;border-top:3px solid ${C.noir}"><span>Total TTC</span><span>2 052,00 €</span></div>
    </div>
    <div id="tampon" style="position:absolute;top:40px;right:300px;font-size:30px;font-weight:700;color:${C.vertFonce};border:4px solid ${C.vertFonce};border-radius:12px;padding:6px 18px;transform:rotate(-8deg);opacity:0">PDF PRÊT ✓</div>
  </div>
  <div class="a" id="bouton" style="margin-top:34px;display:flex;justify-content:center;opacity:0">
    <div id="boutonIn" style="background:${C.beige};color:${C.noir};font-size:36px;font-weight:700;padding:26px 50px;border-radius:999px">Convertir en facture →</div>
  </div>
</div>

<div class="scene" id="s5">
  <div class="a" id="s5a">${surtitre('Étape 3')}${titre('Facture payée ?<br>Ta compta suit.')}</div>
  <div class="carte a" id="s5f" style="margin-top:56px;display:flex;justify-content:space-between;align-items:center">
    <div><div style="font-size:34px;font-weight:600">Facture F-2026-031</div><div style="font-size:26px;opacity:.6;margin-top:4px">Atelier Kanté · 2 052,00 €</div></div>
    <span id="statut" style="font-size:26px;font-weight:600;padding:10px 22px;border-radius:999px;background:rgba(200,176,138,.18);color:${C.beige}">À payer</span>
  </div>
  <div class="carte a" id="s5d" style="margin-top:24px">
    <div style="font-size:26px;opacity:.6">Tableau de bord · Recettes du mois</div>
    <div id="recettes" style="font-size:72px;font-weight:700;margin-top:6px">6 398 €</div>
    <div style="display:flex;align-items:flex-end;gap:22px;height:220px;margin-top:26px">
      ${mois.map((h, i) => `<div id="b${i}" style="flex:1;height:${h}%;border-radius:12px 12px 4px 4px;background:${i === mois.length - 1 ? C.beige : C.gris2}"></div>`).join('')}
    </div>
  </div>
</div>

<div class="scene" id="s6" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:0;padding-bottom:300px">
  <img class="a" id="s6l" src="${symbole}" style="width:220px;height:220px;border-radius:40px">
  <div class="a" id="s6a" style="font-size:140px;font-weight:700;letter-spacing:-.02em;line-height:1;margin-top:50px">Gest-224</div>
  <div class="a" id="s6b" style="font-size:42px;margin-top:26px;opacity:.9;line-height:1.35">Devis, factures, bons de commande,<br>acomptes, avoirs et compta :<br>tout au même endroit.</div>
  <div class="a" id="s6c" style="margin-top:64px;font-size:44px;font-weight:600;background:${C.beige};color:${C.noir};padding:26px 54px;border-radius:999px">👉 Lien en bio</div>
  <div class="a" id="s6d" style="margin-top:60px;font-size:30px;opacity:.6">Réalisation #01 · <b>Qbely</b>Tech</div>
</div>

<script>
const SCENES = { s1: [0, 3.2], s2: [3.2, 7], s3: [7, 17.5], s5: [17.5, 21.5], s6: [21.5, 25] };
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
const $ = id => document.getElementById(id);
const entre = (id, t, debut, dur = .5, dy = 60) => {
  const p = ease((t - debut) / dur), el = $(id);
  el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * dy + 'px)';
};
const euros = n => Math.round(n).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ') + ' €';
window.rendu = t => {
  for (const [id, [d, f]] of Object.entries(SCENES)) {
    const fin = f === 25 ? 1 : 1 - clamp((t - (f - .35)) / .35);
    $(id).style.opacity = clamp((t - d) / .35) * fin;
  }
  $('fond').style.transform = 'rotate(' + t * 1.2 + 'deg)';
  // 1. Accroche
  entre('s1a', t, .1); entre('s1b', t, .6);
  const e = ease((t - 1.2) / .4);
  $('s1c').style.opacity = e; $('s1c').style.transform = 'scale(' + (.4 + .6 * e) + ')'; $('s1c').style.transformOrigin = 'left center';
  // 2. Présentation
  entre('s2a', t, 3.4); entre('s2c', t, 4.4);
  const z = ease((t - 3.7) / .7);
  $('s2b').style.opacity = z; $('s2b').style.transform = 'scale(' + (.85 + .15 * z) + ')';
  $('s2d').style.opacity = ease((t - 4.8) / .3); $('s2d').style.width = 160 * ease((t - 4.8) / .6) + 'px';
  // 3. Le devis se remplit
  entre('s3a', t, 7.2); entre('doc', t, 7.6, .6, 120);
  [0, 1, 2].forEach(i => entre('l' + i, t, 8.4 + i * .5, .4, 20));
  entre('tot', t, 10, .5, 20);
  // 4. Conversion en facture
  const titre2 = ease((t - 12.2) / .4);
  $('s3a').style.opacity = Math.min(+$('s3a').style.opacity, 1 - titre2);
  $('s4a').style.opacity = titre2; $('s4a').style.transform = 'translateY(' + (1 - titre2) * 40 + 'px)';
  entre('bouton', t, 12.6, .4, 30);
  $('boutonIn').style.transform = 'scale(' + (t > 14 && t < 14.25 ? .93 : 1) + ')';
  if (t > 14.3) $('bouton').style.opacity = 1 - clamp((t - 14.3) / .3);
  const facture = t > 14.4;
  $('docType').textContent = facture ? 'FACTURE' : 'DEVIS';
  $('docNum').textContent = facture ? 'N° F-2026-031' : 'N° D-2026-014';
  const flash = facture ? Math.max(0, 1 - (t - 14.4) / .4) : 0;
  $('doc').style.boxShadow = '0 0 0 ' + (flash * 14) + 'px rgba(200,176,138,' + flash + ')';
  const tp = ease((t - 15.2) / .35);
  $('tampon').style.opacity = tp; $('tampon').style.transform = 'rotate(-8deg) scale(' + (1.6 - .6 * tp) + ')';
  // 5. Facture payée -> recette
  entre('s5a', t, 17.7); entre('s5f', t, 18.1); entre('s5d', t, 18.4);
  const paye = t > 19.3;
  $('statut').textContent = paye ? 'Payée ✓' : 'À payer';
  $('statut').style.background = paye ? 'rgba(127,183,126,.18)' : 'rgba(200,176,138,.18)';
  $('statut').style.color = paye ? '${C.vert}' : '${C.beige}';
  const r = ease((t - 19.5) / .9);
  $('recettes').textContent = euros(6398 + 2052 * r);
  $('b5').style.height = (74 + 20 * r) + '%';
  // 6. Fin
  const l = ease((t - 21.6) / .6);
  $('s6l').style.opacity = l; $('s6l').style.transform = 'scale(' + (.6 + .4 * l) + ') rotate(' + (1 - l) * -20 + 'deg)';
  entre('s6a', t, 22); entre('s6b', t, 22.4); entre('s6c', t, 22.9, .5, 40); entre('s6d', t, 23.3);
};
</script></body></html>`;

(async () => {
  const images = fs.mkdtempSync(path.join(os.tmpdir(), 'gest-224-'));
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < FPS * DUREE; i++) {
    await page.evaluate(t => window.rendu(t), i / FPS);
    await page.screenshot({ path: path.join(images, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await navigateur.close();
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  // Piste audio silencieuse : la musique se choisit ensuite dans TikTok.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(images, '%04d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart',
    '-c:a', 'aac', '-shortest', sortie]);
  fs.rmSync(images, { recursive: true });
  console.log(sortie);
})();
