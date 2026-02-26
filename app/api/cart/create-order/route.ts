/**
 * API Route: /api/cart/create-order
 * 
 * Crea una orden real desde el carrito y la envía al backend.
 * Esto permite tracking del pedido en el sistema del negocio.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, notes } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Crear orden en el backend
    const response = await fetch(`${API_BASE_URL}/web-catalog/${token}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: notes || undefined,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      message: 'Order created successfully',
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', message: String(error) },
      { status: 500 }
    );
  }
}
