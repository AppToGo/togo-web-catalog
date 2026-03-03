/**
 * API Route: /api/cart/notify-modified
 * 
 * Notifica al backend que la orden ha sido modificada para enviar
 * notificación WhatsApp al cliente.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, orderId } = body;

    if (!token || !orderId) {
      return NextResponse.json(
        { error: 'Token and orderId are required' },
        { status: 400 }
      );
    }

    // Llamar al backend para notificar modificación
    const response = await fetch(`${API_BASE_URL}/web-catalog/notify-order-modified`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        orderId,
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
      message: 'Notification sent successfully',
    });

  } catch (error) {
    console.error('Error notifying order modification:', error);
    return NextResponse.json(
      { error: 'Failed to notify modification', message: String(error) },
      { status: 500 }
    );
  }
}
