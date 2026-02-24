/**
 * Server Actions
 * Ultra ligero - todo en el servidor
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addToCart, getCart, createOrder } from './api';
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

  // El API no tiene DELETE, así que implementamos workaround
  // Obtenemos el carrito y seteamos cantidad a 0 (o eliminamos en el futuro)
  const currentCart = await getCart(token);
  const item = currentCart.items.find(i => i.productId === productId);
  
  if (item) {
    // Agregar con cantidad negativa para "eliminar"
    await addToCart(token, {
      productId,
      name: item.name,
      quantity: -item.quantity,
      price: item.price,
    });
  }

  revalidatePath(`/catalog/${token}`);
}

// ═══════════════════════════════════════════════════════════
// Order Actions
// ═══════════════════════════════════════════════════════════

export async function createOrderAction(formData: FormData) {
  const token = formData.get('token') as string;
  const address = formData.get('address') as string;
  const notes = formData.get('notes') as string;

  if (!token) {
    throw new Error('Token requerido');
  }

  // Crear orden - si falla, dejar que el error se propague
  const result = await createOrder(token, { address, notes });
  
  // Redirigir a página de éxito (esto lanza un NEXT_REDIRECT interno)
  redirect(`/catalog/${token}/success?order=${result.orderNumber}`);
}
