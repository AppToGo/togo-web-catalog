import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, productId } = body;

    console.log('[CART REMOVE] Request body:', { token: token?.slice(0, 10), productId });

    if (!token || !productId) {
      console.error('[CART REMOVE] Missing token or productId:', { token, productId });
      return NextResponse.json(
        { error: 'Token and productId are required', received: { token: !!token, productId: !!productId } },
        { status: 400 }
      );
    }

    const url = `${API_BASE_URL}/web-catalog/${token}/cart/${productId}`;
    console.log('[CART REMOVE] Calling backend:', url);

    const response = await fetch(url, {
      method: 'DELETE',
    });

    console.log('[CART REMOVE] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[CART REMOVE] Backend error:', error);
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[CART REMOVE] Success:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('[CART REMOVE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
