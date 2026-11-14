// Génère la vidéo TikTok de lancement officiel de Gest-224 (1080×1920, 30 i/s,
// MP4) : format court et rythmé (accroche « POV », coupure « STOP », annonce,
// avant/après, liste, offre gratuite, appel à l'action).
// Même principe que video-werdhe.js : une image par instant t, capturée par
// Playwright puis assemblée par ffmpeg.
// Usage : node docs/reseaux-sociaux/video-lancement-gest-224.js [fichier.mp4]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ici = __dirname;
const sortie = process.argv[2] || path.join(ici, 'videos', 'gest-224-lancement.mp4');
const FPS = 30;
const DUREE = 23;

const dataUri = (f, type) => `data:${type};base64,${fs.readFileSync(path.join(ici, f)).toString('base64')}`;
const symbole = dataUri('visuels/logo-symbole.png', 'image/png');
const polices = [400, 600, 700].map(w => `@font-face{font-family:Poppins;font-weight:${w};src:url(${dataUri(`polices/poppins-latin-${w}-normal.woff2`, 'font/woff2')})}`).join('');

const C = { noir: '#111111', gris: '#1C1C1C', gris2: '#262626', ivoire: '#F3ECE0', beige: '#C8B08A', vert: '#7FB77E', rouge: '#E5534B' };

const surtitre = s => `<div style="font-size:32px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${C.beige}">${s}</div>`;

// Tableur « en désordre » de l'accroche.
const cellules = Array.from({ length: 8 * 5 }, (_, i) => {
  const erreurs = { 3: '#REF!', 11: '#DIV/0!', 17: '???', 24: '#VALEUR!', 32: '#REF!', 38: 'TOTAL ?' };
  return erreurs[i] || (i % 5 === 0 ? ['Client', 'Facture', 'Montant', 'TVA', 'Payé ?', 'Relance', 'Date', 'Total'][i / 5] : String((i * 7919) % 9000 + 120).replace(/(\d)(\d{3})$/, '$1 $2'));
});
const erreur = s => s.startsWith('#') || s.includes('?');

const documents = ['Devis', 'Factures', 'Bons de commande', 'Bons de livraison', 'Factures d\'acompte', 'Avoirs', 'Comptabilité', 'PDF en un clic'];

// Confettis : positions pseudo-aléatoires fixes pour que chaque rendu soit identique.
const confettis = Array.from({ length: 70 }, (_, i) => {
  const r = n => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * 1080, v: 500 + r(2) * 700, d: r(3) * .6, rot: r(4) * 720, w: 14 + r(5) * 18, c: [C.beige, C.ivoire, C.vert][i % 3] };
});

const html = `<html><head><style>${polices}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:${C.noir};color:${C.ivoire};font-family:Poppins,'Noto Color Emoji',sans-serif;overflow:hidden}
.scene{position:absolute;inset:0;padding:280px 90px 0;opacity:0}
.centre{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:0;padding-bottom:320px}
.a{will-change:transform,opacity}
.cel{background:#fff;color:#222;font-size:24px;padding:14px 10px;text-align:center;white-space:nowrap;overflow:hidden}
.puce{display:flex;align-items:center;gap:22px;background:${C.gris};border-radius:22px;padding:22px 30px;font-size:38px;font-weight:600}
.coche{width:48px;height:48px;border-radius:50%;background:${C.vert};color:${C.noir};display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;flex:none}
</style></head><body>

<div id="fond" style="position:absolute;right:-300px;bottom:-260px;opacity:.06"><img src="${symbole}" style="width:1000px"></div>

<div class="scene" id="s1">
  <div class="a" id="s1a">${surtitre('POV :')}</div>
  <div class="a" id="s1b" style="font-size:72px;font-weight:700;line-height:1.15;margin-top:18px">il est 23 h et tu fais<br>encore tes factures<br><span style="color:${C.beige}">sur Excel</span> 😩</div>
  <div class="a" id="s1g" style="margin-top:70px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;background:#B9B9B9;border:3px solid #B9B9B9;border-radius:12px;overflow:hidden">
    ${cellules.map((c, i) => `<div class="cel" style="${i < 5 ? 'font-weight:700;background:#E8E8E8;' : ''}${erreur(c) ? `color:${C.rouge};font-weight:700;background:#FDECEA;` : ''}">${c}</div>`).join('')}
  </div>
</div>

<div class="scene centre" id="s2" style="background:${C.beige};color:${C.noir}">
  <div class="a" id="s2a" style="font-size:260px;font-weight:700;line-height:1;letter-spacing:-.02em">STOP</div>
  <div class="a" id="s2b" style="font-size:180px;margin-top:20px">✋</div>
</div>

<div class="scene centre" id="s3">
  <div id="confettis" style="position:absolute;inset:0;pointer-events:none">
    ${confettis.map((p, i) => `<div id="c${i}" style="position:absolute;left:0;top:0;width:${p.w}px;height:${p.w * .5}px;border-radius:3px;background:${p.c}"></div>`).join('')}
  </div>
  <div class="a" id="s3a" style="font-size:40px;font-weight:700;letter-spacing:.2em;background:${C.beige};color:${C.noir};padding:14px 34px;border-radius:999px">C'EST OFFICIEL</div>
  <div class="a" id="s3b" style="white-space:nowrap;font-size:175px;font-weight:700;letter-spacing:-.02em;line-height:1;margin-top:50px">Gest-224</div>
  <div class="a" id="s3c" style="font-size:70px;font-weight:700;margin-top:30px">est en ligne 🚀</div>
</div>

<div class="scene" id="s4">
  <div class="a" id="s4a" style="font-size:76px;font-weight:700;line-height:1.12">Avant / Maintenant</div>
  <div class="a" id="s4b" style="margin-top:60px;background:${C.gris};border-radius:28px;padding:40px 44px;position:relative">
    <div style="font-size:30px;font-weight:600;color:${C.rouge};letter-spacing:.16em">AVANT</div>
    <div style="font-size:46px;font-weight:600;margin-top:14px;opacity:.75;line-height:1.3">Excel, calculatrice,<br>copier-coller… ⏳ des heures</div>
    <div id="barre" style="position:absolute;left:40px;top:58%;height:8px;width:0;background:${C.rouge};border-radius:4px;transform:rotate(-4deg)"></div>
  </div>
  <div class="a" id="s4c" style="margin-top:28px;background:${C.ivoire};color:${C.noir};border-radius:28px;padding:40px 44px">
    <div style="font-size:30px;font-weight:600;color:#3D7A3C;letter-spacing:.16em">AVEC GEST-224</div>
    <div style="font-size:50px;font-weight:700;margin-top:14px;line-height:1.25">Devis → facture<br>en un clic ⚡</div>
  </div>
</div>

<div class="scene" id="s5">
  <div class="a" id="s5a" style="font-size:76px;font-weight:700;line-height:1.12">Tout est dedans 👇</div>
  <div style="margin-top:50px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
    ${documents.map((d, i) => `<div class="puce a" id="d${i}" style="font-size:${d.length > 15 ? 30 : 36}px"><span class="coche">✓</span>${d}</div>`).join('')}
  </div>
</div>

<div class="scene centre" id="s6">
  <div class="a" id="s6a" style="font-size:60px;font-weight:600;opacity:.9">Et pour commencer ?</div>
  <div class="a" id="s6b" style="font-size:200px;font-weight:700;letter-spacing:-.02em;line-height:1;margin-top:40px;color:${C.beige}">GRATUIT</div>
  <div class="a" id="s6c" style="font-size:52px;font-weight:600;margin-top:36px">Sans carte bancaire. 💳❌</div>
</div>

<div class="scene centre" id="s7">
  <img class="a" id="s7l" src="${symbole}" style="width:200px;height:200px;border-radius:36px">
  <div class="a" id="s7a" style="font-size:150px;font-weight:700;letter-spacing:-.02em;line-height:1;margin-top:46px">Gest-224</div>
  <div class="a" id="s7b" style="font-size:48px;margin-top:26px;opacity:.9">Lance-toi aujourd'hui.</div>
  <div class="a" id="s7c" style="margin-top:60px;font-size:44px;font-weight:600;background:${C.beige};color:${C.noir};padding:26px 54px;border-radius:999px">👉 gest-224.fr</div>
  <div class="a" id="s7d" style="margin-top:56px;font-size:30px;opacity:.6">Lien en bio · Une réalisation <b>Qbely</b>Tech</div>
</div>

<script>
const SCENES = { s1: [0, 3], s2: [3, 4.6], s3: [4.6, 8], s4: [8, 12], s5: [12, 16.5], s6: [16.5, 19], s7: [19, 23] };
const CONFETTIS = ${JSON.stringify(confettis)};
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
const $ = id => document.getElementById(id);
const entre = (id, t, debut, dur = .4, dy = 60) => {
  const p = ease((t - debut) / dur), el = $(id);
  el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * dy + 'px)';
};
// Effet « punch » : grossit puis se pose, pour les mots-chocs.
const punch = (id, t, debut, dur = .3) => {
  const p = clamp((t - debut) / dur), el = $(id);
  el.style.opacity = p > 0 ? 1 : 0;
  el.style.transform = 'scale(' + (p < 1 ? 1.6 - .6 * ease(p) : 1) + ')';
};
window.rendu = t => {
  for (const [id, [d, f]] of Object.entries(SCENES)) {
    const fondu = id === 's2' ? .08 : .25; // coupures franches autour du STOP
    const fin = f === 23 ? 1 : 1 - clamp((t - (f - fondu)) / fondu);
    $(id).style.opacity = clamp((t - d) / fondu) * fin;
  }
  $('fond').style.transform = 'rotate(' + t * 1.5 + 'deg)';
  // 1. Accroche : le tableur tremble de plus en plus
  entre('s1a', t, .05, .3); entre('s1b', t, .2, .4); entre('s1g', t, .7, .4, 100);
  const k = clamp((t - 1.2) / 1.8) * 9;
  $('s1g').style.transform += ' translate(' + Math.sin(t * 61) * k + 'px,' + Math.cos(t * 47) * k + 'px) rotate(' + Math.sin(t * 23) * k * .15 + 'deg)';
  // 2. STOP
  punch('s2a', t, 3.02, .25); punch('s2b', t, 3.35, .25);
  // 3. Annonce + confettis
  punch('s3a', t, 4.7, .3); punch('s3b', t, 5.0, .35); entre('s3c', t, 5.5, .4);
  CONFETTIS.forEach((p, i) => {
    const u = t - 5.0 - p.d, el = $('c' + i);
    el.style.opacity = u > 0 ? 1 : 0;
    el.style.transform = 'translate(' + (p.x + Math.sin(u * 3 + i) * 40) + 'px,' + (-60 + u * p.v) + 'px) rotate(' + (p.rot + u * 400) + 'deg)';
  });
  // 4. Avant / Maintenant : l'« avant » se fait barrer
  entre('s4a', t, 8.1); entre('s4b', t, 8.4); entre('s4c', t, 9.8, .4, 80);
  $('barre').style.width = 860 * ease((t - 9.2) / .4) + 'px';
  // 5. Liste qui tombe vite, au rythme
  entre('s5a', t, 12.1);
  for (let i = 0; i < ${documents.length}; i++) punch('d' + i, t, 12.6 + i * .38, .22);
  // 6. Offre
  entre('s6a', t, 16.6); punch('s6b', t, 17.2, .3); entre('s6c', t, 17.8);
  // 7. Fin
  const l = ease((t - 19.1) / .5);
  $('s7l').style.opacity = l; $('s7l').style.transform = 'scale(' + (.6 + .4 * l) + ') rotate(' + (1 - l) * -20 + 'deg)';
  entre('s7a', t, 19.4); entre('s7b', t, 19.8); punch('s7c', t, 20.3, .3); entre('s7d', t, 20.8);
};
</script></body></html>`;

(async () => {
  const images = fs.mkdtempSync(path.join(os.tmpdir(), 'gest-224-lancement-'));
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
