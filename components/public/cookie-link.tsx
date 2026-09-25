"use client";

import { OUVRIR_COOKIES_EVENT } from "@/components/app/cookie-consent";

export function CookieLink() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OUVRIR_COOKIES_EVENT))}
      className="text-left hover:text-encre hover:underline"
    >
      Cookies
    </button>
  );
}
