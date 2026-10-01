"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  gererActivation2fa,
  desactiver2fa,
  regenererCodesSecours,
  type Etat2fa,
  type EtatSecuriteAction,
} from "@/lib/actions/securite";
import { inputClass, labelClass } from "@/lib/ui";

const etatInitial2fa: Etat2fa = { etape: "inactif" };
const etatActionInitial: EtatSecuriteAction = {};

export function TotpSection({ totpEnabled }: { totpEnabled: boolean }) {
  const t = useTranslations("app.entreprise");

  if (totpEnabled) {
    return <TotpActif t={t} />;
  }
  return <TotpInactif t={t} />;
}

function TotpInactif({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [etat, action] = useActionState(gererActivation2fa, etatInitial2fa);
  const [codesNotes, setCodesNotes] = useState(false);

  if (etat.etape === "confirme" && etat.codesSecours) {
    return (
      <div className="mt-4 space-y-3">
        <p className="rounded-sm bg-green-50 px-3 py-2 font-sans text-sm text-green-800">
          {t("totpActivee")}
        </p>
        <CodesSecoursAffichage codes={etat.codesSecours} t={t} />
        <label className="flex items-start gap-2 font-sans text-sm text-encre/80">
          <input
            type="checkbox"
            checked={codesNotes}
            onChange={(e) => setCodesNotes(e.target.checked)}
            className="mt-0.5"
          />
          {t("totpCodesNotes")}
        </label>
      </div>
    );
  }

  if (etat.etape === "qr") {
    return (
      <form action={action} className="mt-4 max-w-sm space-y-4">
        <input type="hidden" name="etape" value="confirmer" />
        {etat.error && (
          <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
            {etat.error}
          </p>
        )}
        <p className="font-sans text-sm text-encre/70">{t("totpScanDescription")}</p>
        {etat.qrSvg && (
          <div
            className="w-fit rounded-sm border border-encre/20 bg-white p-3"
            dangerouslySetInnerHTML={{ __html: etat.qrSvg }}
          />
        )}
        {etat.secret && (
          <p className="font-mono text-xs text-encre/75">
            {t("totpCleManuelle")} <span className="select-all">{etat.secret}</span>
          </p>
        )}
        <div>
          <label className={labelClass} htmlFor="code">
            {t("totpChampCode")}
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className={`${inputClass} font-mono tracking-widest`}
          />
        </div>
        <button
          type="submit"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("totpConfirmer")}
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="etape" value="demarrer" />
      {etat.error && (
        <p className="mb-3 rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {etat.error}
        </p>
      )}
      <button
        type="submit"
        className="rounded-sm border border-encre bg-encre px-4 py-2 font-sans text-sm text-ivoire hover:bg-encre-light"
      >
        {t("totpActiver")}
      </button>
    </form>
  );
}

function TotpActif({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [etatDesactiver, actionDesactiver] = useActionState(desactiver2fa, etatActionInitial);
  const [etatRegen, actionRegen] = useActionState(regenererCodesSecours, etatActionInitial);
  const [afficherDesactiver, setAfficherDesactiver] = useState(false);
  const [afficherRegen, setAfficherRegen] = useState(false);

  return (
    <div className="mt-4 space-y-4">
      <p className="rounded-sm bg-green-50 px-3 py-2 font-sans text-sm text-green-800">
        {t("totpActivee")}
      </p>

      {etatRegen.codesSecours && <CodesSecoursAffichage codes={etatRegen.codesSecours} t={t} />}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAfficherRegen((v) => !v)}
          className="rounded-sm border border-encre/30 px-3 py-1.5 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {t("totpRegenererCodes")}
        </button>
        <button
          type="button"
          onClick={() => setAfficherDesactiver((v) => !v)}
          className="rounded-sm border border-red-300 px-3 py-1.5 font-sans text-sm text-red-700 hover:bg-red-50"
        >
          {t("totpDesactiver")}
        </button>
      </div>

      {afficherRegen && (
        <form action={actionRegen} className="max-w-sm space-y-3 rounded-sm border border-encre/15 p-4">
          {etatRegen.error && (
            <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
              {etatRegen.error}
            </p>
          )}
          <div>
            <label className={labelClass} htmlFor="password-regen">
              {t("totpConfirmerMotDePasse")}
            </label>
            <input id="password-regen" name="password" type="password" required className={inputClass} />
          </div>
          <button
            type="submit"
            className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
          >
            {t("totpRegenererCodes")}
          </button>
        </form>
      )}

      {afficherDesactiver && (
        <form
          action={actionDesactiver}
          className="max-w-sm space-y-3 rounded-sm border border-red-200 bg-red-50/40 p-4"
        >
          {etatDesactiver.error && (
            <p className="rounded-sm bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
              {etatDesactiver.error}
            </p>
          )}
          <div>
            <label className={labelClass} htmlFor="password-desactiver">
              {t("totpConfirmerMotDePasse")}
            </label>
            <input
              id="password-desactiver"
              name="password"
              type="password"
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-sm bg-red-700 px-4 py-2 font-sans text-sm font-medium text-white hover:bg-red-800"
          >
            {t("totpDesactiver")}
          </button>
        </form>
      )}
    </div>
  );
}

function CodesSecoursAffichage({
  codes,
  t,
}: {
  codes: string[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rounded-sm border border-amber-300 bg-amber-50 p-4">
      <p className="font-sans text-sm font-medium text-amber-900">{t("totpCodesSecoursTitre")}</p>
      <p className="mt-1 font-sans text-xs text-amber-800">{t("totpCodesSecoursDescription")}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-amber-950">
        {codes.map((code) => (
          <li key={code} className="select-all rounded-sm bg-white/70 px-2 py-1">
            {code}
          </li>
        ))}
      </ul>
    </div>
  );
}
