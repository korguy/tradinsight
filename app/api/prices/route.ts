import { NextResponse } from 'next/server';

const BINANCE_BASE_URL = process.env.BINANCE_END_POINT || '';

export async function GET(request: Request) {
  try {
    // Get symbols from query params
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }
    
    // Parse the symbols and add USDT suffix
    const symbols = symbolsParam.split(',').map(symbol => `${symbol}USDT`);
    
    // Create the request to Binance
    const endpoint = "/api/v3/ticker/price";
    const url = `${BINANCE_BASE_URL}${endpoint}`;
    
    // Manually construct the URL with the symbols parameter
    // This avoids double-encoding of the commas in the JSON array
    const symbolsJson = JSON.stringify(symbols);
    
    // Use URLSearchParams but don't encode the value
    const params = new URLSearchParams();
    params.append('symbols', symbolsJson);

    
    const response = await fetch(`${url}?${params.toString().replace(/%2C/g, ',')}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Format the response
    const prices = Object.fromEntries(
      data.map((item: any) => [
        item.symbol.replace('USDT', ''), // Remove USDT suffix
        parseFloat(item.price)
      ])
    );
    
    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
} 