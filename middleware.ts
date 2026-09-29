import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Mesure d'audience du site public, strictement anonyme : ni cookie, ni
// adresse IP, ni identifiant ne sont envoyés ou conservés — seuls le
// chemin visité et le domaine du site référent (le cas échéant) sont
// transmis à /api/analytics/pageview, en tâche de fond (event.waitUntil),
// sans jamais retarder la réponse au visiteur.
export function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
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
  matcher: ["/", "/a-propos", "/tarifs", "/cgu", "/cgv", "/confidentialite", "/mentions-legales"],
};
