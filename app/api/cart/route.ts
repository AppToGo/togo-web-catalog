/**
 * API Route: /api/cart
 * 
 * Endpoint para obtener el carrito desde el servidor.
 * Usado por el cliente para evitar re-renderizados del server component.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/web-catalog/${token}/cart`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { items: [], total: 0, itemCount: 0, updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
