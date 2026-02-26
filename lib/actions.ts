/**
 * Server Actions
 * Ultra ligero - todo en el servidor
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addToCart, getCart, createOrder, removeFromCart } from './api';
import type { CartItem } from './types';

// ═══════════════════════════════════════════════════════════
// Cart Actions
// ═══════════════════════════════════════════════════════════

export async function addToCartAction(formData: FormData) {
  const token = formData.get('token') as string;
  const productId = formData.get('productId') as string;
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);

  if (!token || !productId) {
    throw new Error('Datos inválidos');
  }

  const item: CartItem = {
    productId,
    name,
    quantity: 1,
    price,
  };

  await addToCart(token, item);
  revalidatePath(`/catalog/${token}`);
}

export async function updateCartAction(formData: FormData) {
  const token = formData.get('token') as string;
  const productId = formData.get('productId') as string;
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const delta = parseInt(formData.get('delta') as string);

  // Obtener carrito actual
  const currentCart = await getCart(token);
  const existingItem = currentCart.items.find(i => i.productId === productId);
  
  let newQuantity = delta;
  if (existingItem) {
    newQuantity = existingItem.quantity + delta;
  }

  if (newQuantity <= 0) {
    // Eliminar item
    // El API no tiene endpoint DELETE, así que seteamos cantidad mínima
    newQuantity = 1;
  }

  const item: CartItem = {
    productId,
    name,
    quantity: newQuantity - (existingItem?.quantity || 0), // Delta para el API
    price,
  };

  await addToCart(token, item);
  revalidatePath(`/catalog/${token}`);
}

export async function removeFromCartAction(formData: FormData) {
  const token = formData.get('token') as string;
  const productId = formData.get('productId') as string;

  if (!token || !productId) {
    throw new Error('Datos inválidos');
  }

  // Usar el endpoint DELETE del backend
  await removeFromCart(token, productId);

  revalidatePath(`/catalog/${token}`);
}

// ═══════════════════════════════════════════════════════════
// Order Actions
// ═══════════════════════════════════════════════════════════

export async function createOrderAction(formData: FormData) {
  const token = formData.get('token') as string;
  const notes = formData.get('notes') as string;

  if (!token) {
    throw new Error('Token requerido');
  }

  // Crear orden - si falla, dejar que el error se propague
  const result = await createOrder(token, { notes })
  
  // Construir URL de éxito con número de orden y teléfono del negocio
  const params = new URLSearchParams();
  params.set('order', result.orderNumber);
  if (result.businessPhone) {
    params.set('phone', result.businessPhone);
  }
  
  // Redirigir a página de éxito (esto lanza un NEXT_REDIRECT interno)
  redirect(`/catalog/${token}/success?${params.toString()}`);
}
