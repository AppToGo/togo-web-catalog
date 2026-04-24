/**
 * PhoneCaptureModal - Client Component
 *
 * Modal para capturar teléfono del cliente en catálogo público.
 * Es independiente del CartDrawer para evitar problemas de z-index.
 */

'use client';

import { useState, useEffect } from 'react';
import { Phone, X, ChevronDown } from 'lucide-react';
import { useCart } from './cart-context';

interface CountryCode {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'CO', name: 'Colombia',          dial: '+57',   flag: '🇨🇴' },
  { code: 'MX', name: 'México',            dial: '+52',   flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina',         dial: '+54',   flag: '🇦🇷' },
  { code: 'CL', name: 'Chile',             dial: '+56',   flag: '🇨🇱' },
  { code: 'PE', name: 'Perú',              dial: '+51',   flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador',           dial: '+593',  flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela',         dial: '+58',   flag: '🇻🇪' },
  { code: 'BO', name: 'Bolivia',           dial: '+591',  flag: '🇧🇴' },
  { code: 'UY', name: 'Uruguay',           dial: '+598',  flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay',          dial: '+595',  flag: '🇵🇾' },
  { code: 'PA', name: 'Panamá',            dial: '+507',  flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica',        dial: '+506',  flag: '🇨🇷' },
  { code: 'GT', name: 'Guatemala',         dial: '+502',  flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras',          dial: '+504',  flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador',       dial: '+503',  flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua',         dial: '+505',  flag: '🇳🇮' },
  { code: 'DO', name: 'Rep. Dominicana',   dial: '+1809', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba',             dial: '+53',   flag: '🇨🇺' },
  { code: 'US', name: 'Estados Unidos',    dial: '+1',    flag: '🇺🇸' },
  { code: 'ES', name: 'España',            dial: '+34',   flag: '🇪🇸' },
];

const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Colombia

interface PhoneCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function PhoneCaptureModal({ isOpen, onClose, onSubmit }: PhoneCaptureModalProps) {
  const { customer, setCustomerPhone, setCustomerName } = useCart();
  const [selectedDial, setSelectedDial] = useState(DEFAULT_COUNTRY.dial);
  const [localPhone, setLocalPhone] = useState('');
  const [name, setName] = useState(customer.name || '');
  const [error, setError] = useState('');
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  // Pre-fill local number from existing customer phone (strip known dial prefix if present)
  useEffect(() => {
    if (customer.phone && !localPhone) {
      const match = COUNTRY_CODES.find(c => customer.phone!.startsWith(c.dial));
      if (match) {
        setSelectedDial(match.dial);
        setLocalPhone(customer.phone.slice(match.dial.length));
      } else {
        setLocalPhone(customer.phone.replace(/^\+/, ''));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.phone]);

  useEffect(() => {
    if (isOpen) {
      setAnimationState('opening');
      const timer = setTimeout(() => setAnimationState('open'), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimationState('closing');
      const timer = setTimeout(() => setAnimationState('closed'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (animationState === 'closed' && !isOpen) return null;

  const isClosing = animationState === 'closing';

  const selectedCountry = COUNTRY_CODES.find(c => c.dial === selectedDial) ?? DEFAULT_COUNTRY;

  const validateLocalPhone = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 6 && digits.length <= 12;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const digits = localPhone.replace(/\D/g, '');

    if (!validateLocalPhone(digits)) {
      setError('Ingresa un número local válido (sin el indicativo del país)');
      return;
    }

    setCustomerPhone(`${selectedDial}${digits}`);
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
        className={`bg-[var(--surface)] w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Completa tu pedido</h2>
                <p className="text-sm" style={{ color: 'var(--accent-ink)', opacity: 0.8 }}>
                  Necesitamos tu teléfono para contactarte
                </p>
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
          {/* Phone field with country code picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink-2)] mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-xl border border-[var(--line)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)] transition-all overflow-hidden">
              {/* Country code selector */}
              <div className="relative flex items-center shrink-0 border-r border-[var(--line)] bg-[var(--bg)]">
                <span className="pl-3 text-base leading-none pointer-events-none select-none">
                  {selectedCountry.flag}
                </span>
                <span className="pl-1 pr-1 text-sm font-medium text-[var(--ink-2)] pointer-events-none">
                  {selectedDial}
                </span>
                <ChevronDown size={13} className="mr-2 text-[var(--ink-3)] pointer-events-none" />
                <select
                  value={selectedDial}
                  onChange={(e) => setSelectedDial(e.target.value)}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  aria-label="Código de país"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.dial}>
                      {c.flag} {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
              </div>
              {/* Local number input */}
              <input
                type="tel"
                id="phone"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                placeholder="Número local"
                className="flex-1 px-3 py-3 bg-transparent text-[var(--ink)] text-sm outline-none placeholder:text-[var(--ink-3)]"
                autoFocus
              />
            </div>
            <p className="text-xs text-[var(--ink-3)] mt-1">
              Ingresá solo el número local, sin el código de país
            </p>
          </div>

          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--ink-2)] mb-1">
              Nombre <span className="text-[var(--ink-3)]">(opcional)</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿Cómo te llaman?"
              className="w-full px-4 py-3 rounded-xl border border-[var(--line)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] bg-transparent text-[var(--ink)] text-sm outline-none transition-all placeholder:text-[var(--ink-3)]"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-[var(--accent)] text-[var(--accent-ink)] font-bold rounded-xl shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all"
          >
            Continuar con el pedido
          </button>

          <p className="text-xs text-center text-[var(--ink-3)]">
            Tu información solo se usará para contactarte sobre tu pedido
          </p>
        </form>
      </div>
    </div>
  );
}
