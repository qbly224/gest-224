import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  refreshSessionToken,
} from "@/lib/session";

const PAGES_PUBLIQUES_AVEC_MESURE_AUDIENCE = new Set([
  "/",
  "/a-propos",
  "/tarifs",
  "/cgu",
  "/cgv",
  "/confidentialite",
  "/mentions-legales",
  "/logiciel-facturation-lyon",
  "/logiciel-facturation-paris",
]);

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Mesure d'audience du site public, strictement anonyme : ni cookie, ni
  // adresse IP, ni identifiant ne sont envoyés ou conservés - seuls le
  // chemin visité et le domaine du site référent (le cas échéant) sont
  // transmis à /api/analytics/pageview, en tâche de fond (event.waitUntil),
  // sans jamais retarder la réponse au visiteur.
  if (PAGES_PUBLIQUES_AVEC_MESURE_AUDIENCE.has(pathname)) {
    const url = new URL("/api/analytics/pageview", request.url);
    const body = JSON.stringify({
      path: pathname,
      referrerHost: extraireDomaineReferent(request.headers.get("referer")),
    });

    event.waitUntil(
      fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }).catch(() => {
        // Un souci réseau/serveur sur la mesure d'audience ne doit jamais
        // affecter la navigation du visiteur.
      })
    );
  }

  const response = NextResponse.next();

  // Déconnexion automatique après 1h sans activité (voir lib/session.ts) :
  // à chaque requête sur une page portant le cookie de session, on le
  // ré-émet avec une expiration repoussée. C'est le seul endroit possible
  // pour ça, les Server Components ne pouvant pas écrire de cookie.
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const nouveauJeton = await refreshSessionToken(token);
    if (nouveauJeton) {
      response.cookies.set(SESSION_COOKIE_NAME, nouveauJeton, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DURATION_SECONDS,
      });
    }
  }

  return response;
}

function extraireDomaineReferent(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).hostname;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
