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
    endpoints: ['/oracle', '/ai'],
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

// AI endpoint - uses OpenAI for analysis
app.post('/ai', async (c) => {
  const paymentTxid = c.req.header('X-Payment');

  if (!paymentTxid) {
    return paymentRequired(c, '/ai');
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
  const prompt = body.prompt || 'What is the current state of the Stacks ecosystem?';

  // Check for OpenAI key
  const apiKey = c.env?.OPENAI_API_KEY;
  if (!apiKey) {
    return c.json({
      success: true,
      paymentVerified: true,
      caller: verification.caller,
      data: {
        response: `AI analysis requested: "${prompt}"`,
        note: 'OpenAI not configured - returning mock response',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Call OpenAI
  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful blockchain analyst specializing in Stacks and Bitcoin.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    }),
  });

  const aiData = await aiResponse.json() as any;

  return c.json({
    success: true,
    paymentVerified: true,
    caller: verification.caller,
    data: {
      prompt,
      response: aiData.choices?.[0]?.message?.content || 'No response',
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
