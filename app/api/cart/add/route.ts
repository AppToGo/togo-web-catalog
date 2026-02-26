import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, productId, name, price, quantity } = body;

    if (!token || !productId) {
      return NextResponse.json(
        { error: 'Token and productId are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/web-catalog/${token}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, name, price, quantity }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
