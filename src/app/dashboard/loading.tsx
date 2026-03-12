export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/80 to-sky-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900">Cargando tu dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">Estamos validando tu cuenta y preparando tu experiencia.</p>
      </div>
    </div>
  );
}
