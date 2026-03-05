/**
 * Error Boundary
 * 
 * Captura errores en el catálogo y muestra UI de recuperación.
 * Permite reintentar la carga sin perder el estado.
 */

'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CatalogError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log para monitoreo
    console.error('Catalog Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Algo salió mal
        </h2>
        
        <p className="text-gray-600 mb-6">
          No pudimos cargar el catálogo. Por favor intenta de nuevo.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        
        <button
          onClick={reset}
          className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
