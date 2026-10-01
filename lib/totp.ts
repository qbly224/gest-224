import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PAS_SECONDES = 30;
const NB_CHIFFRES = 6;
// Tolère un décalage d'horloge client/serveur d'une étape avant et après
// l'étape courante (RFC 6238 recommande une fenêtre étroite).
const FENETRE_ETAPES = 1;

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let valeur = 0;
  let sortie = "";
  for (const octet of buffer) {
    valeur = (valeur << 8) | octet;
    bits += 8;
    while (bits >= 5) {
      sortie += BASE32_ALPHABET[(valeur >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    sortie += BASE32_ALPHABET[(valeur << (5 - bits)) & 31];
  }
  return sortie;
}

function base32Decode(secret: string): Buffer {
  const nettoye = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let valeur = 0;
  const octets: number[] = [];
  for (const car of nettoye) {
    const index = BASE32_ALPHABET.indexOf(car);
    if (index === -1) continue;
    valeur = (valeur << 5) | index;
    bits += 5;
    if (bits >= 8) {
      octets.push((valeur >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(octets);
}

export function genererSecretTotp(): string {
  return base32Encode(randomBytes(20));
}

function hotp(secret: Buffer, compteur: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(compteur));
  const hmac = createHmac("sha1", secret).update(buffer).digest();
  const decalage = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[decalage] & 0x7f) << 24) |
    ((hmac[decalage + 1] & 0xff) << 16) |
    ((hmac[decalage + 2] & 0xff) << 8) |
    (hmac[decalage + 3] & 0xff);
  return String(code % 10 ** NB_CHIFFRES).padStart(NB_CHIFFRES, "0");
}

export function verifierCodeTotp(secretBase32: string, code: string): boolean {
  const codeNettoye = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(codeNettoye)) return false;

  const secret = base32Decode(secretBase32);
  const etapeCourante = Math.floor(Date.now() / 1000 / PAS_SECONDES);

  for (let delta = -FENETRE_ETAPES; delta <= FENETRE_ETAPES; delta++) {
    const attendu = hotp(secret, etapeCourante + delta);
    if (
      timingSafeEqual(Buffer.from(attendu), Buffer.from(codeNettoye))
    ) {
      return true;
    }
  }
  return false;
}

export function construireUriOtpAuth(
  secretBase32: string,
  compte: string,
  emetteur = "Gest-224"
): string {
  const label = encodeURIComponent(`${emetteur}:${compte}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer: emetteur,
    algorithm: "SHA1",
    digits: String(NB_CHIFFRES),
    period: String(PAS_SECONDES),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Codes de secours : 10 caractères alphanumériques, lisibles sans ambiguïté (sans 0/O/1/I/L). */
const ALPHABET_CODE_SECOURS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genererCodesSecours(nombre = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < nombre; i++) {
    let code = "";
    const octets = randomBytes(10);
    for (let j = 0; j < 10; j++) {
      code += ALPHABET_CODE_SECOURS[octets[j] % ALPHABET_CODE_SECOURS.length];
    }
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}
