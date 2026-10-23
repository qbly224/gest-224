// Génère la vidéo TikTok de présentation de Werdhe (1080×1920, 30 i/s, MP4).
// Chaque image est calculée à partir du temps t (aucune animation CSS), puis
// capturée par Playwright et assemblée par ffmpeg.
// Usage : node docs/reseaux-sociaux/video-werdhe.js [fichier.mp4]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ici = __dirname;
const sortie = process.argv[2] || path.join(ici, 'videos', 'werdhe-presentation.mp4');
const FPS = 30;
const DUREE = 25;

const dataUri = (f, type) => `data:${type};base64,${fs.readFileSync(path.join(ici, f)).toString('base64')}`;
const symbole = dataUri('visuels/logo-symbole.png', 'image/png');
const polices = [400, 600, 700].map(w => `@font-face{font-family:Poppins;font-weight:${w};src:url(${dataUri(`polices/poppins-latin-${w}-normal.woff2`, 'font/woff2')})}`).join('');

const C = { noir: '#111111', gris: '#1C1C1C', gris2: '#262626', ivoire: '#F3ECE0', beige: '#C8B08A', vert: '#7FB77E' };

const surtitre = s => `<div style="font-size:30px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${C.beige}">${s}</div>`;
const titre = (s, taille = 76) => `<div style="font-size:${taille}px;font-weight:700;line-height:1.12;letter-spacing:-.01em;margin-top:24px">${s}</div>`;
const pastille = (texte, ok) => `<span style="font-size:24px;font-weight:600;padding:8px 18px;border-radius:999px;background:${ok ? 'rgba(127,183,126,.18)' : 'rgba(200,176,138,.18)'};color:${ok ? C.vert : C.beige}">${texte}</span>`;

// Logements d'illustration (fictifs).
const logements = [
  ['Studio - 2e étage', 'Locataire : M. Diallo', true],
  ['Appartement 3 pièces', 'Locataire : Mme Camara', true],
  ['Villa 4 chambres', 'Locataire : M. Sow', false],
];

const html = `<html><head><style>${polices}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:${C.noir};color:${C.ivoire};font-family:Poppins,'Noto Color Emoji',sans-serif;overflow:hidden}
.scene{position:absolute;inset:0;padding:300px 90px 0;opacity:0}
.a{will-change:transform,opacity}
.carte{background:${C.gris};border-radius:28px;padding:30px 34px;display:flex;justify-content:space-between;align-items:center}
.tel{margin:56px auto 0;width:640px;background:${C.gris};border:3px solid ${C.gris2};border-radius:56px;padding:44px 40px;position:relative}
.option{display:flex;align-items:center;gap:22px;padding:28px 30px;border-radius:24px;background:${C.gris2};font-size:34px;font-weight:600;margin-top:20px;border:3px solid transparent}
.point{width:28px;height:28px;border-radius:50%;flex:none}
</style></head><body>

<div id="fond" style="position:absolute;right:-300px;bottom:-260px;opacity:.06"><img src="${symbole}" style="width:1000px"></div>

<div class="scene" id="s1" style="display:flex;flex-direction:column;justify-content:center;padding-top:0;padding-bottom:300px">
  <div class="a" id="s1a" style="font-size:80px;font-weight:700;line-height:1.15">Tu te déplaces<br>encore pour payer</div>
  <div class="a" id="s1b" style="font-size:80px;font-weight:700;line-height:1.15;color:${C.beige}">ton loyer ?</div>
  <div class="a" id="s1c" style="font-size:150px;margin-top:40px">😮‍💨</div>
</div>

<div class="scene" id="s2" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:0;padding-bottom:300px">
  <div class="a" id="s2a">${surtitre('QbelyTech présente')}</div>
  <div class="a" id="s2b" style="font-size:210px;font-weight:700;letter-spacing:-.02em;line-height:1;margin:40px 0">Werdhe</div>
  <div class="a" id="s2c" style="font-size:50px;opacity:.9">La gestion locative,<br>simplement.</div>
  <div class="a" id="s2d" style="margin-top:56px;height:8px;width:160px;border-radius:4px;background:${C.beige}"></div>
</div>

<div class="scene" id="s3">
  <div class="a" id="s3a">${surtitre('Pour les propriétaires')}${titre('Tous vos logements<br>et vos locataires,<br>au même endroit.')}</div>
  <div style="margin-top:64px;display:grid;gap:24px">
    ${logements.map(([nom, loc, paye], i) => `<div class="carte a" id="s3c${i}">
      <div><div style="font-size:36px;font-weight:600">${nom}</div><div style="font-size:26px;opacity:.6;margin-top:6px">${loc}</div></div>
      ${pastille(paye ? 'Loyer payé' : 'En attente', paye)}</div>`).join('')}
  </div>
</div>

<div class="scene" id="s4">
  <div class="a" id="s4a">${surtitre('Pour les locataires')}${titre('Le loyer se paie<br>en Mobile Money.')}</div>
  <div class="tel a" id="s4t">
    <div style="font-size:26px;opacity:.6">Werdhe</div>
    <div style="font-size:44px;font-weight:700;margin-top:8px">Loyer du mois</div>
    <div style="font-size:28px;opacity:.6;margin-top:4px">Studio - 2e étage</div>
    <div style="font-size:26px;font-weight:600;margin-top:36px;opacity:.8">Payer avec</div>
    <div class="option" id="s4o"><span class="point" style="background:#FF7900"></span>Orange Money</div>
    <div class="option" id="s4m"><span class="point" style="background:#FFCC00"></span>MTN MoMo</div>
    <div class="a" id="s4ok" style="position:absolute;inset:0;border-radius:53px;background:${C.gris};display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0">
      <div style="width:150px;height:150px;border-radius:50%;background:${C.vert};display:flex;align-items:center;justify-content:center;font-size:90px;color:${C.noir};font-weight:700">✓</div>
      <div style="font-size:46px;font-weight:700;margin-top:36px">Paiement envoyé</div>
      <div style="font-size:28px;opacity:.6;margin-top:8px">via Orange Money</div>
    </div>
  </div>
</div>

<div class="scene" id="s5">
  <div class="a" id="s5a">${surtitre('Côté propriétaire')}${titre('Le paiement<br>apparaît tout de suite.')}</div>
  <div class="carte a" id="s5n" style="margin-top:80px;gap:28px;justify-content:flex-start;background:${C.ivoire};color:${C.noir}">
    <img src="${symbole}" style="width:96px;height:96px;border-radius:22px;flex:none">
    <div><div style="font-size:26px;opacity:.6">Werdhe · maintenant</div>
    <div style="font-size:38px;font-weight:700;margin-top:4px">Loyer reçu ✓</div>
    <div style="font-size:28px;opacity:.75;margin-top:2px">Studio - 2e étage · Orange Money</div></div>
  </div>
  <div class="carte a" id="s5c" style="margin-top:24px">
    <div><div style="font-size:36px;font-weight:600">Studio - 2e étage</div><div style="font-size:26px;opacity:.6;margin-top:6px">Locataire : M. Diallo</div></div>
    ${pastille('Loyer payé', true)}</div>
</div>

<div class="scene" id="s6" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:0;padding-bottom:300px">
  <img class="a" id="s6l" src="${symbole}" style="width:220px;height:220px;border-radius:40px">
  <div class="a" id="s6a" style="font-size:150px;font-weight:700;letter-spacing:-.02em;line-height:1;margin-top:50px">Werdhe</div>
  <div class="a" id="s6b" style="font-size:46px;margin-top:26px;opacity:.9">Propriétaires et locataires,<br>enfin sur la même page.</div>
  <div class="a" id="s6c" style="margin-top:70px;font-size:44px;font-weight:600;background:${C.beige};color:${C.noir};padding:26px 54px;border-radius:999px">👉 werdhe.com</div>
  <div class="a" id="s6d" style="margin-top:60px;font-size:30px;opacity:.6">Lien en bio · Réalisation #02 · <b>Qbely</b>Tech</div>
</div>

<script>
const SCENES = { s1: [0, 3.2], s2: [3.2, 7], s3: [7, 12], s4: [12, 17.5], s5: [17.5, 21], s6: [21, 25] };
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
// Apparition d'un élément : glisse vers le haut de 'dy' px en 'dur' s à partir de 'debut'.
const entre = (id, t, debut, dur = .5, dy = 60) => {
  const p = ease((t - debut) / dur), el = document.getElementById(id);
  el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * dy + 'px)';
};
window.rendu = t => {
  for (const [id, [d, f]] of Object.entries(SCENES)) {
    const fin = f === 25 ? 1 : 1 - clamp((t - (f - .35)) / .35);
    document.getElementById(id).style.opacity = clamp((t - d) / .35) * fin;
  }
  document.getElementById('fond').style.transform = 'rotate(' + t * 1.2 + 'deg)';
  // 1. Accroche
  entre('s1a', t, .1); entre('s1b', t, .6);
  const e = ease((t - 1.2) / .4); const s1c = document.getElementById('s1c');
  s1c.style.opacity = e; s1c.style.transform = 'scale(' + (.4 + .6 * e) + ')'; s1c.style.transformOrigin = 'left center';
  // 2. Présentation
  entre('s2a', t, 3.4); entre('s2c', t, 4.4); entre('s2d', t, 4.8, .5, 0);
  const z = ease((t - 3.7) / .7), s2b = document.getElementById('s2b');
  s2b.style.opacity = z; s2b.style.transform = 'scale(' + (.85 + .15 * z) + ')';
  document.getElementById('s2d').style.width = 160 * ease((t - 4.8) / .6) + 'px';
  // 3. Propriétaires
  entre('s3a', t, 7.2); [0, 1, 2].forEach(i => entre('s3c' + i, t, 8 + i * .45, .5, 80));
  // 4. Locataires : choix d'Orange Money puis confirmation
  entre('s4a', t, 12.2); entre('s4t', t, 12.7, .6, 120);
  const sel = t > 14.6;
  const o = document.getElementById('s4o');
  o.style.borderColor = sel ? '${C.beige}' : 'transparent';
  o.style.transform = 'scale(' + (t > 14.6 && t < 14.8 ? .97 : 1) + ')';
  const ok = ease((t - 15.6) / .4), s4ok = document.getElementById('s4ok');
  s4ok.style.opacity = ok; s4ok.style.transform = 'scale(' + (.92 + .08 * ok) + ')';
  // 5. Propriétaire prévenu
  entre('s5a', t, 17.7); entre('s5n', t, 18.4, .5, -120); entre('s5c', t, 19, .5, 60);
  // 6. Fin
  const l = ease((t - 21.1) / .6), s6l = document.getElementById('s6l');
  s6l.style.opacity = l; s6l.style.transform = 'scale(' + (.6 + .4 * l) + ') rotate(' + (1 - l) * -20 + 'deg)';
  entre('s6a', t, 21.5); entre('s6b', t, 22); entre('s6c', t, 22.6, .5, 40); entre('s6d', t, 23);
};
</script></body></html>`;

(async () => {
  const images = fs.mkdtempSync(path.join(os.tmpdir(), 'werdhe-'));
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const total = FPS * DUREE;
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.rendu(t), i / FPS);
    await page.screenshot({ path: path.join(images, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await navigateur.close();
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  // Piste audio silencieuse : TikTok accepte mieux une vidéo avec son, et
  // la musique se choisit ensuite dans l'application.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(images, '%04d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart',
    '-c:a', 'aac', '-shortest', sortie]);
  fs.rmSync(images, { recursive: true });
  console.log(sortie);
})();
