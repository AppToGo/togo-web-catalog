/**
 * Home Page
 * Server Component - Landing con formulario simple
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  async function goToCatalog(formData: FormData) {
    "use server";
    const token = formData.get("token") as string;
    if (token?.trim()) {
      redirect(`/${token.trim()}`);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto bg-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
          🚀
        </div>

        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold text-stone-900">ToGo</h1>
          <p className="text-stone-600 mt-2">
            Catálogos digitales para tu negocio
          </p>
        </div>

        {/* Token Input */}
        <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-200">
          <p className="text-sm text-stone-500 mb-3">
            ¿Tienes un token de acceso?
          </p>

          <form action={goToCatalog} className="flex gap-2">
            <input
              type="text"
              name="token"
              placeholder="Pega tu token aquí"
              className="flex-1 px-4 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
            >
              Ir
            </button>
          </form>
        </div>

        <p className="text-xs text-stone-400">
          Los tokens son proporcionados por el negocio vía WhatsApp
        </p>

        {/* Footer */}
        <footer className="pt-8 text-xs text-stone-400">
          <p>© 2025 ToGo. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
