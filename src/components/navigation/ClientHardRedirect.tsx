'use client';

import { useEffect } from 'react';
import { Rocket } from 'lucide-react';

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
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-indigo-50/70 p-6 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-violet-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-7 max-w-xs">
        {/* Ícono animado */}
        <div className="animate-pulse">
          <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
            <Rocket className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
          <p className="text-slate-500 text-base leading-relaxed">{description}</p>
        </div>

        {/* Dots animados */}
        <div className="flex gap-2 pt-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
