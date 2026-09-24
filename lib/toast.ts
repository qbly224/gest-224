/**
 * Ajoute un message de confirmation à une URL de redirection, affiché une
 * fois par le composant <Toast /> puis retiré de l'URL (voir
 * components/app/toast.tsx).
 */
export function withToast(path: string, message: string): string {
  const separateur = path.includes("?") ? "&" : "?";
  return `${path}${separateur}toast=${encodeURIComponent(message)}`;
}
