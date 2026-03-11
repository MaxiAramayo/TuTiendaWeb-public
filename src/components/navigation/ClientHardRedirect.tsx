'use client';

import { useEffect } from 'react';

interface ClientHardRedirectProps {
  to: string;
  title?: string;
  description?: string;
}

export default function ClientHardRedirect({
  to,
  title = 'Redirigiendo...',
  description = 'Estamos llevando tu cuenta a la pantalla correcta.',
}: ClientHardRedirectProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(to);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [to]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-indigo-50/40">
      <div className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white/95 backdrop-blur p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
