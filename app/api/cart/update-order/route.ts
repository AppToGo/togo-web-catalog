/**
 * API Route: /api/cart/update-order
 * 
 * Actualiza una orden DRAFT existente con los nuevos items del carrito.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, orderId, notes } = body;

    if (!token || !orderId) {
      return NextResponse.json(
        { error: 'Token and orderId are required' },
        { status: 400 }
      );
    }

    // Actualizar orden en el backend (PATCH)
    const response = await fetch(`${API_BASE_URL}/web-catalog/${token}/order`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        notes: notes || undefined,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      status: data.status,
      total: data.total,
      itemCount: data.itemCount,
      businessPhone: data.businessPhone,
      message: 'Order updated successfully',
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', message: String(error) },
      { status: 500 }
    );
  }
}
