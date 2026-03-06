/**
 * PhoneCaptureModal - Client Component
 * 
 * Modal para capturar teléfono del cliente en catálogo público.
 * Es independiente del CartDrawer para evitar problemas de z-index.
 */

'use client';

import { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';
import { useCart } from './cart-context';

interface PhoneCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function PhoneCaptureModal({ isOpen, onClose, onSubmit }: PhoneCaptureModalProps) {
  const { customer, setCustomerPhone, setCustomerName } = useCart();
  const [phone, setPhone] = useState(customer.phone || '');
  const [name, setName] = useState(customer.name || '');
  const [error, setError] = useState('');
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  // Manejar animación
  useEffect(() => {
    if (isOpen) {
      setAnimationState('opening');
      const timer = setTimeout(() => setAnimationState('open'), 50);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setAnimationState('closing');
      const timer = setTimeout(() => {
        setAnimationState('closed');
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (animationState === 'closed' && !isOpen) return null;

  const isClosing = animationState === 'closing';

  const validatePhone = (value: string): boolean => {
    // Validación básica de teléfono colombiano
    const cleanPhone = value.replace(/\s/g, '');
    return /^\+?\d{10,12}$/.test(cleanPhone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!validatePhone(cleanPhone)) {
      setError('Ingresa un número de teléfono válido (10 dígitos)');
      return;
    }

    setCustomerPhone(cleanPhone);
    if (name.trim()) {
      setCustomerName(name.trim());
    }
    onSubmit();
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Completa tu pedido</h2>
                <p className="text-sm text-white/80">Necesitamos tu teléfono para contactarte</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 3001234567"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa tu número con código de área (10 dígitos)
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿Cómo te llaman?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all"
          >
            Continuar con el pedido
          </button>

          <p className="text-xs text-center text-gray-500">
            Tu información solo se usará para contactarte sobre tu pedido
          </p>
        </form>
      </div>
    </div>
  );
}
