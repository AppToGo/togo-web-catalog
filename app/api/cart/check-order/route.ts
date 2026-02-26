/**
 * API Route: /api/cart/check-order
 * 
 * Verifica si existe una orden vinculada al token y retorna su estado.
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
    const response = await fetch(`${API_BASE_URL}/web-catalog/${token}/order`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      // Si no hay orden o hay error, retornar hasOrder: false
      return NextResponse.json({ hasOrder: false });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error checking order:', error);
    return NextResponse.json({ hasOrder: false });
  }
}
