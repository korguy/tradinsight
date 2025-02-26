import { NextResponse } from 'next/server';
import crypto from 'crypto';

const BINANCE_BASE_URL = process.env.BINANCE_END_POINT || '';
const API_CLIENT = process.env.BINANCE_API_KEY || '';
const API_SECRET = process.env.BINANCE_API_SECRET || '';

export async function GET(request: Request) {
  try {
    // Get symbols from query params
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    console.log(API_CLIENT)
    
    // Check if environment variables are set
    if (!BINANCE_BASE_URL || !API_CLIENT || !API_SECRET) {
      console.error('Missing Binance environment variables', { 
        hasEndpoint: !!BINANCE_BASE_URL, 
        hasApiKey: !!API_CLIENT, 
        hasSecret: !!API_SECRET 
      });
      return NextResponse.json({ 
        error: 'Binance API configuration missing', 
        debug: { 
          hasEndpoint: !!BINANCE_BASE_URL, 
          hasApiKey: !!API_CLIENT, 
          hasSecret: !!API_SECRET 
        } 
      }, { status: 500 });
    }
    
    const symbols = symbolsParam.split(',');
    
    // Create timestamp and signature
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(queryString)
      .digest('hex');
    
    // Make request to Binance
    const response = await fetch(
      `${BINANCE_BASE_URL}/api/v3/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': API_CLIENT
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Binance API error:', { status: response.status, error: errorData });
      return NextResponse.json({ 
        error: 'Binance API error', 
        details: errorData,
        status: response.status
      }, { status: response.status });
    }
    
    const data = await response.json();
    const balances = data.balances;
    
    // Filter and format balances
    const symbolSet = new Set([...symbols.map(s => s.slice(0, 3)), 'USDT']);
    const portfolio: Record<string, number> = {};
    
    for (const balance of balances) {
      if (symbolSet.has(balance.asset)) {
        portfolio[balance.asset] = parseFloat(balance.free);
      }
    }
    
    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch portfolio', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 