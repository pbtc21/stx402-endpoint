import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Contract configuration
const CONTRACT = {
  address: 'SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M',
  name: 'simple-oracle',
  price: 1000, // microSTX
  recipient: 'SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M',
};

const HIRO_API = 'https://api.hiro.so';

type Bindings = {
  OPENAI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'stx402-endpoint',
    description: 'x402 payment-gated API endpoint on Stacks',
    contract: `${CONTRACT.address}.${CONTRACT.name}`,
    price: `${CONTRACT.price} microSTX (${CONTRACT.price / 1_000_000} STX)`,
    endpoints: ['/oracle', '/sentiment'],
  });
});

// x402 Payment Required response
function paymentRequired(c: any, resource: string) {
  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  return c.json({
    error: 'Payment Required',
    code: 'PAYMENT_REQUIRED',
    resource,
    payment: {
      contract: `${CONTRACT.address}.${CONTRACT.name}`,
      function: 'call-with-stx',
      price: CONTRACT.price,
      token: 'STX',
      recipient: CONTRACT.recipient,
      network: 'mainnet',
    },
    instructions: [
      '1. Call the contract function with STX payment',
      '2. Wait for transaction confirmation',
      '3. Retry request with X-Payment header containing txid',
    ],
    nonce,
    expiresAt,
  }, 402);
}

// Verify payment on-chain
async function verifyPayment(txid: string): Promise<{ valid: boolean; error?: string; caller?: string }> {
  try {
    // Normalize txid
    const normalizedTxid = txid.startsWith('0x') ? txid : `0x${txid}`;

    const response = await fetch(`${HIRO_API}/extended/v1/tx/${normalizedTxid}`);
    if (!response.ok) {
      return { valid: false, error: 'Transaction not found' };
    }

    const tx = await response.json() as any;

    // Check transaction status
    if (tx.tx_status !== 'success') {
      return { valid: false, error: `Transaction status: ${tx.tx_status}` };
    }

    // Check it's a contract call to our contract
    if (tx.tx_type !== 'contract_call') {
      return { valid: false, error: 'Not a contract call' };
    }

    const expectedContract = `${CONTRACT.address}.${CONTRACT.name}`;
    if (tx.contract_call?.contract_id !== expectedContract) {
      return { valid: false, error: 'Wrong contract' };
    }

    if (tx.contract_call?.function_name !== 'call-with-stx') {
      return { valid: false, error: 'Wrong function' };
    }

    // Payment verified!
    return { valid: true, caller: tx.sender_address };
  } catch (error) {
    return { valid: false, error: `Verification failed: ${error}` };
  }
}

// Get contract stats
async function getContractStats() {
  const response = await fetch(
    `${HIRO_API}/v2/contracts/call-read/${CONTRACT.address}/${CONTRACT.name}/get-info`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: CONTRACT.address,
        arguments: [],
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json() as any;
  // Parse Clarity response (simplified)
  return data;
}

// Oracle endpoint - returns blockchain data
app.get('/oracle', async (c) => {
  const paymentTxid = c.req.header('X-Payment');

  if (!paymentTxid) {
    return paymentRequired(c, '/oracle');
  }

  // Verify payment
  const verification = await verifyPayment(paymentTxid);
  if (!verification.valid) {
    return c.json({
      error: 'Payment verification failed',
      details: verification.error,
    }, 403);
  }

  // Payment verified - return oracle data
  const [btcPrice, stxPrice, blockInfo] = await Promise.all([
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      .then(r => r.json())
      .catch(() => ({ bitcoin: { usd: null } })),
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd')
      .then(r => r.json())
      .catch(() => ({ blockstack: { usd: null } })),
    fetch(`${HIRO_API}/extended/v1/block?limit=1`)
      .then(r => r.json())
      .catch(() => ({ results: [] })),
  ]);

  const latestBlock = (blockInfo as any).results?.[0];

  return c.json({
    success: true,
    paymentVerified: true,
    caller: verification.caller,
    data: {
      prices: {
        btc_usd: (btcPrice as any).bitcoin?.usd,
        stx_usd: (stxPrice as any).blockstack?.usd,
      },
      stacks: {
        block_height: latestBlock?.height,
        block_hash: latestBlock?.hash,
        block_time: latestBlock?.block_time,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// Sentiment analyzer endpoint
app.post('/sentiment', async (c) => {
  const paymentTxid = c.req.header('X-Payment');

  if (!paymentTxid) {
    return paymentRequired(c, '/sentiment');
  }

  // Verify payment
  const verification = await verifyPayment(paymentTxid);
  if (!verification.valid) {
    return c.json({
      error: 'Payment verification failed',
      details: verification.error,
    }, 403);
  }

  // Get request body
  const body = await c.req.json().catch(() => ({}));
  const token = (body.token || 'STX').toUpperCase();

  // Fetch market data for context
  const [priceData, fearGreedData] = await Promise.all([
    fetch(`https://api.coingecko.com/api/v3/coins/${token === 'BTC' ? 'bitcoin' : token === 'STX' ? 'blockstack' : 'bitcoin'}?localization=false&tickers=false&community_data=true&developer_data=false`)
      .then(r => r.json())
      .catch(() => null),
    fetch('https://api.alternative.me/fng/?limit=1')
      .then(r => r.json())
      .catch(() => null),
  ]);

  const price = (priceData as any)?.market_data?.current_price?.usd;
  const priceChange24h = (priceData as any)?.market_data?.price_change_percentage_24h;
  const priceChange7d = (priceData as any)?.market_data?.price_change_percentage_7d;
  const fearGreed = (fearGreedData as any)?.data?.[0];

  // Check for OpenAI key
  const apiKey = c.env?.OPENAI_API_KEY;

  if (!apiKey) {
    // Return algorithmic sentiment without AI
    const momentum = (priceChange24h || 0) + (priceChange7d || 0) / 2;
    const fgScore = parseInt(fearGreed?.value || '50');

    let sentiment: 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';
    let score: number;

    if (momentum < -10) { sentiment = 'very_bearish'; score = 15; }
    else if (momentum < -3) { sentiment = 'bearish'; score = 35; }
    else if (momentum < 3) { sentiment = 'neutral'; score = 50; }
    else if (momentum < 10) { sentiment = 'bullish'; score = 65; }
    else { sentiment = 'very_bullish'; score = 85; }

    // Blend with fear/greed
    score = Math.round((score + fgScore) / 2);

    return c.json({
      success: true,
      paymentVerified: true,
      caller: verification.caller,
      data: {
        token,
        sentiment,
        score,
        confidence: 0.7,
        analysis: {
          price_usd: price,
          change_24h: priceChange24h,
          change_7d: priceChange7d,
          fear_greed_index: fgScore,
          fear_greed_label: fearGreed?.value_classification,
        },
        signals: [
          priceChange24h > 5 ? '📈 Strong 24h momentum' : priceChange24h < -5 ? '📉 Weak 24h momentum' : '➡️ Stable 24h',
          priceChange7d > 10 ? '🚀 Weekly uptrend' : priceChange7d < -10 ? '🔻 Weekly downtrend' : '📊 Weekly consolidation',
          fgScore > 60 ? '😀 Market greed' : fgScore < 40 ? '😰 Market fear' : '😐 Market neutral',
        ],
        method: 'algorithmic',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // AI-powered sentiment analysis
  const prompt = `Analyze the current market sentiment for ${token}.

Current data:
- Price: $${price}
- 24h change: ${priceChange24h?.toFixed(2)}%
- 7d change: ${priceChange7d?.toFixed(2)}%
- Fear & Greed Index: ${fearGreed?.value} (${fearGreed?.value_classification})

Provide a JSON response with:
1. sentiment: one of "very_bearish", "bearish", "neutral", "bullish", "very_bullish"
2. score: 0-100 (0 = extreme fear, 100 = extreme greed)
3. confidence: 0-1
4. summary: 2-3 sentence analysis
5. signals: array of 3 key observations

Respond ONLY with valid JSON, no markdown.`;

  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a crypto market sentiment analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    }),
  });

  const aiData = await aiResponse.json() as any;
  const aiContent = aiData.choices?.[0]?.message?.content || '{}';

  let aiAnalysis;
  try {
    aiAnalysis = JSON.parse(aiContent);
  } catch {
    aiAnalysis = { sentiment: 'neutral', score: 50, summary: aiContent };
  }

  return c.json({
    success: true,
    paymentVerified: true,
    caller: verification.caller,
    data: {
      token,
      sentiment: aiAnalysis.sentiment,
      score: aiAnalysis.score,
      confidence: aiAnalysis.confidence || 0.8,
      summary: aiAnalysis.summary,
      analysis: {
        price_usd: price,
        change_24h: priceChange24h,
        change_7d: priceChange7d,
        fear_greed_index: parseInt(fearGreed?.value || '50'),
        fear_greed_label: fearGreed?.value_classification,
      },
      signals: aiAnalysis.signals || [],
      method: 'ai',
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString(),
    },
  });
});

// Stats endpoint (free)
app.get('/stats', async (c) => {
  const stats = await getContractStats();
  return c.json({
    contract: `${CONTRACT.address}.${CONTRACT.name}`,
    stats,
  });
});

export default app;
