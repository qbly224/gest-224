// Génère la vidéo TikTok « Comment ça marche ? » de Gest-224 (1080×1920,
// 30 i/s, MP4) à partir de vraies captures de l'application
// (tutoriel/captures/, produites par tutoriel/capturer-*.js).
// Chaque capture fait 800×1600 px (écran de 400×800 en densité 2) ; la vidéo
// en montre une fenêtre zoomée qui défile de y0 à y1 (en pixels CSS).
// Usage : node docs/reseaux-sociaux/video-tutoriel-gest-224.js [fichier.mp4]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ici = __dirname;
const sortie = process.argv[2] || path.join(ici, 'videos', 'gest-224-tutoriel.mp4');
const FPS = 30;

const dataUri = (f, type) => `data:${type};base64,${fs.readFileSync(path.join(ici, f)).toString('base64')}`;
const capture = nom => dataUri(`tutoriel/captures/${nom}.png`, 'image/png');
const symbole = dataUri('visuels/logo-symbole.png', 'image/png');
const polices = [400, 600, 700].map(w => `@font-face{font-family:Poppins;font-weight:${w};src:url(${dataUri(`polices/poppins-latin-${w}-normal.woff2`, 'font/woff2')})}`).join('');

const C = { noir: '#111111', gris: '#1C1C1C', ivoire: '#F3ECE0', beige: '#C8B08A' };

// Étapes : titre, sous-titre, puis les plans [capture, durée (s), y0, y1].
const ETAPES = [
  { titre: 'Crée ton espace', sous: 'Plan gratuit, sans carte bancaire', plans: [['01-inscription-vide', 2.2, 0, 120], ['02-inscription-entreprise', 1.6, 250, 300], ['03-inscription-remplie', 1.8, 280, 320]] },
  { titre: 'Ajoute ton client', sous: 'Une seule fois, il est gardé pour la suite', plans: [['06-client-nom', 1.4, 20, 40], ['07-client-adresse', 1.4, 300, 330], ['08-client-contact', 1.4, 330, 350], ['09-client-cree', 1.6, 321, 321]] },
  { titre: 'Crée ton devis', sous: 'Choisis le client, ajoute tes lignes', plans: [['11-devis-client', 1.4, 0, 20], ['12-devis-ligne1', 1.3, 50, 80], ['13-devis-ligne2', 1.3, 120, 150], ['14-devis-ligne3', 1.3, 0, 30]] },
  { titre: 'Les totaux se calculent seuls', sous: 'Total HT, TVA et TTC, sans calculatrice', plans: [['15-devis-totaux', 2.4, 0, 30], ['16-devis-cree', 2.2, 0, 150]] },
  { titre: 'Un PDF propre, tout de suite', sous: 'Télécharge-le ou affiche-le en un clic', pdf: true, plans: [['pdf-devis', 3.4, 0, 0]] },
  { titre: 'Envoie-le par WhatsApp', sous: 'Ou par Gmail, le message est déjà rédigé', plans: [['17-envoyer-menu', 2.4, 0, 20], ['18-devis-envoye', 1.6, 0, 0]] },
  { titre: 'Accepté ? Il devient facture', sous: '« Convertir en facture » : un seul clic', plans: [['19-devis-accepte', 2, 0, 0], ['20-facture-creee', 2.2, 0, 321]] },
  { titre: 'Payée ? Ta compta suit', sous: 'La recette s\'enregistre toute seule', plans: [['21-facture-envoyee', 1.8, 0, 0], ['22-facture-paiement', 1.8, 150, 321], ['25-recettes', 2, 0, 0], ['24-tableau-de-bord-solde', 2.4, 0, 60]] },
];
const INTRO = 3.2;
const FIN = 4.2;

// Calendrier : début et fin de chaque étape et de chaque plan.
let t = INTRO;
const plans = [];
ETAPES.forEach((e, i) => {
  e.debut = t;
  e.plans.forEach(([nom, d, y0, y1]) => { plans.push({ etape: i, nom, debut: t, fin: t + d, y0, y1, pdf: !!e.pdf }); t += d; });
  e.fin = t;
});
const DUREE = t + FIN;

// Fenêtre d'affichage : 960 px de large ; une capture (800 px) y est agrandie 1,2× (soit 2,4× l'écran CSS).
const LARGEUR = 960, HAUTEUR = 1120, ECHELLE = 2.4;

const html = `<html><head><style>${polices}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:${C.noir};color:${C.ivoire};font-family:Poppins,'Noto Color Emoji',sans-serif;overflow:hidden}
.couche{position:absolute;inset:0;opacity:0}
#entete{position:absolute;left:60px;right:60px;top:150px;height:230px}
#fenetre{position:absolute;left:60px;top:420px;width:${LARGEUR}px;height:${HAUTEUR}px;border-radius:36px;overflow:hidden;background:#F5F0E6;box-shadow:0 30px 80px rgba(0,0,0,.6);opacity:0}
.plan{position:absolute;left:0;top:0;width:${LARGEUR}px;opacity:0}
</style></head><body>

<div id="fond" style="position:absolute;right:-300px;bottom:-260px;opacity:.05"><img src="${symbole}" style="width:1000px"></div>

<div class="couche" id="intro" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-bottom:300px">
  <img src="${symbole}" style="width:150px;height:150px;border-radius:28px">
  <div style="font-size:120px;font-weight:700;letter-spacing:-.02em;margin-top:40px;line-height:1">Gest-224</div>
  <div id="introT" style="font-size:72px;font-weight:700;margin-top:40px;color:${C.beige}">Comment ça marche ?</div>
  <div style="font-size:40px;margin-top:20px;opacity:.85">Du devis à la facture payée, en vrai 👇</div>
</div>

<div id="entete" style="opacity:0">
  <div style="display:flex;gap:10px">${ETAPES.map((_, i) => `<div id="p${i}" style="flex:1;height:8px;border-radius:4px;background:rgba(243,236,224,.18)"></div>`).join('')}</div>
  <div id="num" style="font-size:30px;font-weight:600;letter-spacing:.24em;color:${C.beige};margin-top:34px">ÉTAPE 1</div>
  <div id="titre" style="font-size:64px;font-weight:700;line-height:1.1;margin-top:10px"></div>
  <div id="sous" style="font-size:34px;opacity:.8;margin-top:10px"></div>
</div>

<div id="fenetre">
  ${plans.map((p, i) => `<div class="plan${p.pdf ? ' pdf' : ''}" id="v${i}" style="height:${HAUTEUR}px"><img src="${capture(p.nom)}" style="display:block;width:${LARGEUR}px"></div>`).join('')}
</div>

<div class="couche" id="fin" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-bottom:300px">
  <img src="${symbole}" style="width:180px;height:180px;border-radius:34px">
  <div style="font-size:130px;font-weight:700;letter-spacing:-.02em;margin-top:40px;line-height:1">Gest-224</div>
  <div style="font-size:46px;margin-top:28px;opacity:.9">À toi de jouer.<br>C'est gratuit pour commencer.</div>
  <div style="margin-top:60px;font-size:46px;font-weight:600;background:${C.beige};color:${C.noir};padding:26px 56px;border-radius:999px">👉 gest-224.fr</div>
  <div style="margin-top:56px;font-size:30px;opacity:.6">Lien en bio · Une réalisation <b>Qbely</b>Tech</div>
</div>

<script>
const ETAPES = ${JSON.stringify(ETAPES.map(e => ({ titre: e.titre, sous: e.sous, debut: e.debut, fin: e.fin })))};
const PLANS = ${JSON.stringify(plans)};
const INTRO = ${INTRO}, DUREE = ${DUREE}, ECHELLE = ${ECHELLE};
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp(x); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const $ = id => document.getElementById(id);
let etapeAffichee = -1;
window.rendu = t => {
  const finEtapes = ETAPES[ETAPES.length - 1].fin;
  $('fond').style.transform = 'rotate(' + t * 1.2 + 'deg)';
  // Intro et fin
  $('intro').style.opacity = clamp(t / .3) * (1 - clamp((t - (INTRO - .3)) / .3));
  $('intro').style.transform = 'scale(' + (1 + t * .01) + ')';
  const f = clamp((t - finEtapes) / .4);
  $('fin').style.opacity = f;
  const visible = clamp((t - INTRO + .1) / .35) * (1 - f);
  $('entete').style.opacity = visible;
  $('fenetre').style.opacity = visible;
  $('fenetre').style.transform = 'translateY(' + (1 - clamp((t - INTRO + .1) / .45)) * 80 + 'px)';
  // Étape courante : barre de progression et textes
  const i = Math.max(0, ETAPES.findIndex(e => t < e.fin) === -1 ? ETAPES.length - 1 : ETAPES.findIndex(e => t < e.fin));
  const e = ETAPES[i];
  if (i !== etapeAffichee) {
    $('num').textContent = 'ÉTAPE ' + (i + 1);
    $('titre').textContent = e.titre;
    $('sous').textContent = e.sous;
    etapeAffichee = i;
  }
  const entree = clamp((t - e.debut) / .35);
  ['num', 'titre', 'sous'].forEach((id, k) => {
    const p = clamp((t - e.debut - k * .08) / .35);
    $(id).style.opacity = p;
    $(id).style.transform = 'translateX(' + (1 - p) * 40 + 'px)';
  });
  ETAPES.forEach((x, k) => {
    const rempli = k < i ? 1 : k === i ? clamp((t - x.debut) / (x.fin - x.debut)) : 0;
    $('p' + k).style.background = 'linear-gradient(90deg,${C.beige} ' + rempli * 100 + '%,rgba(243,236,224,.18) ' + rempli * 100 + '%)';
  });
  // Plans : fondu enchaîné de 0,25 s et défilement de y0 à y1
  PLANS.forEach((p, k) => {
    const el = $('v' + k);
    const op = clamp((t - p.debut + .25) / .25) * (1 - clamp((t - p.fin) / .25));
    el.style.opacity = k === 0 ? Math.min(op, 1) : op;
    if (op > 0) {
      const y = Math.min(800 - ${HAUTEUR} / ECHELLE, p.y0 + (p.y1 - p.y0) * ease((t - p.debut) / (p.fin - p.debut)));
      // Le PDF (1408×1988 px) occupe toute la largeur et descend vers les totaux.
      el.firstElementChild.style.transform = 'translateY(' + (p.pdf ? -(${LARGEUR} * 1988 / 1408 - ${HAUTEUR}) * ease((t - p.debut) / (p.fin - p.debut)) * .6 : -y * ECHELLE) + 'px)';
    }
  });
};
</script></body></html>`;

(async () => {
  const images = fs.mkdtempSync(path.join(os.tmpdir(), 'gest-224-tutoriel-'));
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const total = Math.round(FPS * DUREE);
  for (let i = 0; i < total; i++) {
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
  console.log(sortie, DUREE.toFixed(1) + ' s');
})();
