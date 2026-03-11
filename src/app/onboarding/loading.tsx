export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-indigo-50/40">
      <div className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900">Preparando onboarding</h2>
        <p className="mt-1 text-sm text-gray-500">En segundos continuas donde te quedaste.</p>
      </div>
    </div>
  );
}
