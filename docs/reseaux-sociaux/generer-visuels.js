// Génère les visuels réseaux sociaux QbelyTech (PNG) à partir de blocs HTML.
// Usage : node docs/reseaux-sociaux/generer-visuels.js <dossier-de-sortie>
const { chromium } = require('playwright');
const out = process.argv[2] || 'docs/reseaux-sociaux/visuels';
const C = { encre:'#1F3D2C', light:'#2D5741', ivoire:'#F6F1E7', ocre:'#C8963E' };
const base = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif}
.serif{font-family:Caladea,'DejaVu Serif',serif}
.grain{background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 2px,transparent 2px 4px)}`;
const mono = (s)=>`<span style="font-family:Inter;font-weight:600;letter-spacing:.28em;text-transform:uppercase">${s}</span>`;
const logoQ = (size, fg, accent)=>`<div class="serif" style="position:relative;font-size:${size}px;font-weight:700;line-height:1;color:${fg}">Q<span style="position:absolute;right:-${size*.12}px;bottom:${size*.08}px;width:${size*.14}px;height:${size*.14}px;border-radius:50%;background:${accent}"></span></div>`;
const designs = {
 'photo-profil': [1080,1080, `<div class="grain" style="width:1080px;height:1080px;background:radial-gradient(circle at 50% 40%,${C.light},${C.encre} 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
   ${logoQ(560,C.ivoire,C.ocre)}
   <div style="color:${C.ivoire};font-size:62px;margin-top:-10px">${mono('QbelyTech')}</div></div>`],
 'couverture-facebook': [1640,624, `<div class="grain" style="width:1640px;height:624px;background:linear-gradient(120deg,${C.encre} 55%,${C.light});position:relative;overflow:hidden;color:${C.ivoire}">
   <div class="serif" style="position:absolute;right:-60px;top:-170px;font-size:900px;font-weight:700;color:rgba(246,241,231,.06)">Q</div>
   <div style="position:absolute;left:300px;right:300px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
     <div style="font-size:22px;color:${C.ocre}">${mono('Solutions numériques')}</div>
     <div class="serif" style="font-size:118px;font-weight:700;margin:14px 0 18px">QbelyTech</div>
     <div style="font-size:30px;opacity:.9;max-width:900px;line-height:1.35">Nous concevons des outils simples et fiables<br>pour les entrepreneurs et les petites entreprises.</div>
     <div style="margin-top:34px;height:4px;width:120px;background:${C.ocre}"></div></div></div>`],
 'post-realisation-gest-224': [1080,1350, `<div style="width:1080px;height:1350px;background:${C.ivoire};color:${C.encre};padding:90px 84px;display:flex;flex-direction:column">
   <div style="display:flex;justify-content:space-between;align-items:center;font-size:22px">${mono('Nouvelle réalisation')}<span style="font-size:22px;opacity:.6">${mono('QbelyTech')}</span></div>
   <div style="height:3px;background:${C.encre};margin:28px 0 70px"></div>
   <div class="serif" style="font-size:150px;font-weight:700;line-height:1">Gest-224</div>
   <div style="font-size:40px;line-height:1.35;margin-top:30px;color:${C.light}">La gestion commerciale complète des petites entreprises, du devis à la facture.</div>
   <div style="margin-top:64px;display:grid;gap:26px;font-size:34px">
     ${['Devis, bons de commande et de livraison','Factures, acomptes et avoirs conformes','Clients et catalogue produits/services','Comptabilité simplifiée et tableau de bord'].map(t=>`<div style="display:flex;gap:22px;align-items:center"><span style="width:18px;height:18px;background:${C.ocre};flex:none"></span>${t}</div>`).join('')}</div>
   <div style="margin-top:auto;background:${C.encre};color:${C.ivoire};padding:34px 40px;display:flex;justify-content:space-between;align-items:center;font-size:30px">
     <span>Découvrez-le - lien dans la bio</span><span class="serif" style="font-size:44px;font-weight:700">Q<span style="color:${C.ocre}">.</span></span></div></div>`],
 'couverture-video-tiktok': [1080,1920, `<div class="grain" style="width:1080px;height:1920px;background:linear-gradient(180deg,${C.encre},${C.light});color:${C.ivoire};position:relative">
   <div style="position:absolute;left:90px;right:90px;top:430px;bottom:520px;display:flex;flex-direction:column;justify-content:center">
     <div style="font-size:34px;color:${C.ocre}">${mono('Réalisation #01')}</div>
     <div class="serif" style="font-size:170px;font-weight:700;line-height:1;margin:30px 0">Gest-224</div>
     <div style="font-size:54px;line-height:1.3">Du devis à la facture<br>en quelques clics.</div>
     <div style="margin-top:60px;height:6px;width:160px;background:${C.ocre}"></div></div>
   <div style="position:absolute;top:200px;left:90px;font-size:30px;opacity:.85">${mono('QbelyTech')}</div></div>`],
};
(async()=>{
  const b = await chromium.launch();
  for (const [name,[w,h,html]] of Object.entries(designs)) {
    const p = await b.newPage({viewport:{width:w,height:h}});
    await p.setContent(`<html><head><style>${base}</style></head><body>${html}</body></html>`);
    await p.screenshot({path:`${out}/${name}.png`});
  }
  await b.close();
})();
