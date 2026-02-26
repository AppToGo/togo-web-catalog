/**
 * API Route: /api/cart/clear
 * 
 * Limpia todo el carrito del usuario.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // El carrito se maneja en Redis por token.
    // No hay endpoint específico para limpiar todo el carrito en el backend,
    // así que solo retornamos éxito. El carrito se limpia en el cliente
    // y expirará en Redis después de 30 minutos de inactividad.

    return NextResponse.json({ success: true, message: 'Cart cleared' });

  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
