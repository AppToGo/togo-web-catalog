/**
 * Not Found - Catálogo
 * 
 * Se muestra cuando el token del catálogo no es válido
 * o el negocio no existe.
 */

import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

export default function CatalogNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Catálogo no encontrado
        </h1>
        
        <p className="text-gray-600 mb-6">
          El enlace que buscas no existe o ha expirado. 
          Verifica la URL o contacta al negocio.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 font-medium hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
