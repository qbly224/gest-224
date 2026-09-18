import "server-only";
import puppeteer, { type Browser } from "puppeteer-core";

const TIMEOUT_MS = 15_000;
const CONCURRENCE_MAX = 3;

// Une seule instance de navigateur réutilisée entre les requêtes du même
// processus serveur (Next.js self-hosted, process Node long-vivant) — ne
// convient pas tel quel à un déploiement serverless, qui devrait relancer
// un navigateur par invocation.
let browserPromise: Promise<Browser> | null = null;

function getExecutablePath(): string {
  const configured = process.env.CHROMIUM_EXECUTABLE_PATH;
  if (!configured) {
    throw new Error(
      "CHROMIUM_EXECUTABLE_PATH n'est pas défini. En local, pointez-la vers un " +
        "Chromium installé sur la machine ; l'image Docker de production la " +
        "définit automatiquement (voir Dockerfile)."
    );
  }
  return configured;
}

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: getExecutablePath(),
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      .catch((err) => {
        // Sans ce reset, un premier échec de lancement (Chromium absent,
        // OOM...) empoisonnerait définitivement toutes les requêtes PDF
        // suivantes avec la même promesse rejetée, jusqu'au redémarrage du
        // process.
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

// Limite le nombre de générations PDF simultanées : chaque onglet Chromium
// consomme 50-100 Mo, un afflux de requêtes concurrentes sur un seul
// processus Node partagé par tous les tenants pourrait sinon épuiser la
// mémoire du conteneur (DoS depuis un unique compte authentifié).
let enCours = 0;
const enAttente: (() => void)[] = [];

async function acquerirCreneau(): Promise<() => void> {
  if (enCours >= CONCURRENCE_MAX) {
    await new Promise<void>((resolve) => enAttente.push(resolve));
  }
  enCours += 1;
  return () => {
    enCours -= 1;
    enAttente.shift()?.();
  };
}

export async function genererPdf(html: string): Promise<Buffer> {
  const liberer = await acquerirCreneau();
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "load", timeout: TIMEOUT_MS });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        timeout: TIMEOUT_MS,
        margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  } finally {
    liberer();
  }
}
