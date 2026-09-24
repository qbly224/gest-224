"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const param = searchParams.get("toast");
    if (!param) return;
    setMessage(param);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });

    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-sm bg-encre px-4 py-3 text-center font-sans text-sm text-ivoire shadow-lg sm:inset-x-auto sm:bottom-6 sm:right-6 sm:mx-0 sm:text-left"
    >
      {message}
    </div>
  );
}
