import "server-only";
import puppeteer, { type Browser } from "puppeteer-core";

// Une seule instance de navigateur réutilisée entre les requêtes du même
// processus serveur (Next.js self-hosted, process Node long-vivant) — ne
// convient pas tel quel à un déploiement serverless, qui devrait relancer
// un navigateur par invocation.
let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/opt/pw-browsers/chromium",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

export async function genererPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
