export default function OnboardingLoading() {
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
            {/* Rocket SVG inline para no necesitar 'use client' */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Preparando tu tienda</h2>
          <p className="text-slate-500 text-base leading-relaxed">
            En segundos continuas donde te quedaste.
          </p>
        </div>

        {/* Dots animados */}
        <div className="flex gap-2 pt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
