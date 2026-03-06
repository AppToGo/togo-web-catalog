'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CustomerOrigin } from '@/lib/types';

interface CustomerContextType {
  origin: CustomerOrigin;
  phone?: string;
  tableNumber?: string;
  isIdentified: boolean;
  setPhone: (phone: string) => void;
  token?: string;
}

const CustomerContext = createContext<CustomerContextType | null>(null);

interface CustomerProviderProps {
  children: ReactNode;
  businessSlug: string;
  origin: CustomerOrigin;
  tableNumber?: string;
  initialPhone?: string;
  token?: string;
}

export function CustomerProvider({
  children,
  businessSlug,
  origin,
  tableNumber,
  initialPhone,
  token,
}: CustomerProviderProps) {
  const [phone, setPhoneState] = useState(initialPhone);

  // Load phone from localStorage on mount
  useEffect(() => {
    if (!initialPhone) {
      const saved = localStorage.getItem(`customer-phone-${businessSlug}`);
      if (saved) setPhoneState(saved);
    }
  }, [businessSlug, initialPhone]);

  // Save phone to localStorage when set
  const setPhone = (newPhone: string) => {
    setPhoneState(newPhone);
    localStorage.setItem(`customer-phone-${businessSlug}`, newPhone);
  };

  // Customer is identified if they came from WhatsApp or have provided phone
  const isIdentified = origin === 'whatsapp' || !!phone;

  return (
    <CustomerContext.Provider
      value={{
        origin,
        phone,
        tableNumber,
        isIdentified,
        setPhone,
        token,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
}
