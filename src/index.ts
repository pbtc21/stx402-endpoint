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

// Pyth Oracle configuration
const PYTH = {
  oracle: 'SP1CGXWEAMG6P6FT04W66NVGJ7PQWMDAC19R7PJ0Y.pyth-oracle-v4',
  storage: 'SP1CGXWEAMG6P6FT04W66NVGJ7PQWMDAC19R7PJ0Y.pyth-storage-v4',
  feeds: {
    BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    STX: '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17', // STX-USD
  },
};

type Bindings = {
  OPENAI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Frontend HTML
function getFrontendHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>x402 API | Stacks Payment-Gated Intelligence</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --surface-2: #1a1a25;
      --border: #2a2a3a;
      --text: #e4e4e7;
      --text-muted: #71717a;
      --accent: #8b5cf6;
      --accent-2: #a78bfa;
      --green: #22c55e;
      --orange: #f97316;
      --blue: #3b82f6;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }

    header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      color: var(--accent-2);
      margin-bottom: 1.5rem;
    }

    h1 {
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--text) 0%, var(--accent-2) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    .subtitle {
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      transition: border-color 0.2s, transform 0.2s;
    }

    .card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .card-icon {
      width: 40px;
      height: 40px;
      background: var(--surface-2);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .card h3 {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .card p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .endpoint {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      background: var(--surface-2);
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .method {
      font-weight: 600;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
    }

    .method.get { background: var(--green); color: #000; }
    .method.post { background: var(--blue); color: #fff; }

    .price-tag {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--orange);
      font-weight: 500;
    }

    .free-tag {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--green);
      font-weight: 500;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .demo-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 3rem;
    }

    .demo-controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    select, button {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      cursor: pointer;
      transition: all 0.2s;
    }

    button {
      background: var(--accent);
      border-color: var(--accent);
      font-weight: 500;
    }

    button:hover {
      background: var(--accent-2);
      border-color: var(--accent-2);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .response-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      max-height: 400px;
      overflow: auto;
      white-space: pre-wrap;
      color: var(--text-muted);
    }

    .response-box.success { border-color: var(--green); }
    .response-box.error { border-color: var(--orange); }

    .how-it-works {
      background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 3rem;
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .step {
      text-align: center;
    }

    .step-num {
      width: 40px;
      height: 40px;
      background: var(--accent);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      margin: 0 auto 1rem;
    }

    .step h4 {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .step p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    footer a {
      color: var(--accent-2);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }

    .contract-info {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      background: var(--surface-2);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
      word-break: break-all;
    }

    @media (max-width: 640px) {
      h1 { font-size: 2rem; }
      .container { padding: 2rem 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">
        <span>x402</span>
        <span>•</span>
        <span>Payment-Gated API</span>
      </div>
      <h1>Stacks Intelligence API</h1>
      <p class="subtitle">Real-time blockchain data, price aggregation, and AI-powered market sentiment. Pay-per-call with STX.</p>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-header">
          <div class="card-icon">📊</div>
          <h3>Price Aggregator</h3>
        </div>
        <p>Multi-source price data from 5+ exchanges including on-chain Pyth oracle verification.</p>
        <div class="endpoint">
          <span class="method get">GET</span>
          <span>/prices?token=BTC</span>
          <span class="free-tag">FREE</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon">🔮</div>
          <h3>Oracle Data</h3>
        </div>
        <p>On-chain verified price data with latest block information and timestamps.</p>
        <div class="endpoint">
          <span class="method get">GET</span>
          <span>/oracle</span>
          <span class="price-tag">1000 μSTX</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon">🧠</div>
          <h3>Sentiment Analysis</h3>
        </div>
        <p>AI-powered market sentiment with Fear & Greed integration and trading signals.</p>
        <div class="endpoint">
          <span class="method post">POST</span>
          <span>/sentiment</span>
          <span class="price-tag">1000 μSTX</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon">📈</div>
          <h3>All Prices</h3>
        </div>
        <p>Complete price data for BTC, STX, ETH, SOL with spread analysis across all sources.</p>
        <div class="endpoint">
          <span class="method get">GET</span>
          <span>/prices/all</span>
          <span class="free-tag">FREE</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h2 class="section-title">⚡ Try It Live</h2>
      <div class="demo-controls">
        <select id="endpoint-select">
          <option value="/prices?token=BTC">GET /prices?token=BTC (Free)</option>
          <option value="/prices?token=STX">GET /prices?token=STX (Free)</option>
          <option value="/prices/all">GET /prices/all (Free)</option>
          <option value="/stats">GET /stats (Free)</option>
        </select>
        <button onclick="tryEndpoint()">Send Request</button>
      </div>
      <div id="response" class="response-box">// Select an endpoint and click "Send Request"</div>
    </div>

    <div class="how-it-works">
      <h2 class="section-title">🔐 How x402 Payment Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <h4>Request</h4>
          <p>Call a paid endpoint without payment header</p>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <h4>Pay</h4>
          <p>Call the Clarity contract with STX</p>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <h4>Retry</h4>
          <p>Add X-Payment header with txid</p>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <h4>Access</h4>
          <p>Receive your data!</p>
        </div>
      </div>
      <div class="contract-info">
        <strong>Contract:</strong> SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M.simple-oracle
      </div>
    </div>

    <footer>
      <p>Part of the <a href="https://pbtc21.dev">pbtc21.dev</a> ecosystem</p>
      <p style="margin-top: 0.5rem;">Powered by Stacks • x402 Protocol</p>
    </footer>
  </div>

  <script>
    async function tryEndpoint() {
      const select = document.getElementById('endpoint-select');
      const response = document.getElementById('response');
      const endpoint = select.value;

      response.textContent = 'Loading...';
      response.className = 'response-box';

      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        response.textContent = JSON.stringify(data, null, 2);
        response.className = 'response-box success';
      } catch (err) {
        response.textContent = 'Error: ' + err.message;
        response.className = 'response-box error';
      }
    }
  </script>
</body>
</html>`;
}

// Health check / Frontend
app.get('/', (c) => {
  const accept = c.req.header('Accept') || '';
  if (accept.includes('text/html')) {
    return c.html(getFrontendHtml());
  }
  return c.json({
    name: 'stx402-endpoint',
    description: 'x402 payment-gated API endpoint on Stacks',
    contract: `${CONTRACT.address}.${CONTRACT.name}`,
    price: `${CONTRACT.price} microSTX (${CONTRACT.price / 1_000_000} STX)`,
    endpoints: {
      paid: ['/oracle', '/sentiment'],
      free: ['/prices', '/prices/all', '/stats'],
    },
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

// Parse Clarity hex value to BigInt (handles both int and uint)
function parseClarityInt(hex: string): bigint {
  // Remove leading zeros for parsing
  const value = BigInt('0x' + hex);
  return value;
}

// Fetch price from Pyth oracle (on-chain verified via storage contract)
async function getPythPrice(token: 'BTC' | 'STX'): Promise<{ price: number | null; expo: number; timestamp: number; source: string } | null> {
  const feedId = PYTH.feeds[token];
  if (!feedId) return null;

  try {
    const [storageAddress, storageName] = PYTH.storage.split('.');
    const feedIdHex = feedId.slice(2); // Remove 0x prefix

    // Call pyth-storage-v4.get-price directly (simpler interface)
    // Clarity buffer encoding: 0x02 (buffer type) + uint32 length + data
    const clarityBuffer = `0x0200000020${feedIdHex}`;

    const response = await fetch(
      `${HIRO_API}/v2/contracts/call-read/${storageAddress}/${storageName}/get-price`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: storageAddress,
          arguments: [clarityBuffer],
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json() as any;

    if (data.okay && data.result) {
      // Parse Clarity tuple response
      // Look for price field in the hex - format: "price" followed by int value
      const resultHex = data.result.slice(2); // Remove 0x

      // Find "price" field (057072696365 = length 5 + "price" in hex)
      const priceMarker = '057072696365'; // "price" as clarity string
      const priceIdx = resultHex.indexOf(priceMarker);

      if (priceIdx !== -1) {
        // After field name, next byte is type (00 = int), then 16 bytes of value
        const valueStart = priceIdx + priceMarker.length + 2; // +2 for type byte
        const valueHex = resultHex.slice(valueStart, valueStart + 32);
        const priceRaw = parseClarityInt(valueHex);

        // Pyth uses expo -8, so divide by 10^8
        const price = Number(priceRaw) / 100_000_000;

        return {
          price,
          expo: -8,
          timestamp: Date.now(),
          source: 'pyth',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Pyth fetch error:', error);
    return null;
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

  // Fetch market data for context (Pyth on-chain + CoinGecko off-chain)
  const [pythData, priceData, fearGreedData] = await Promise.all([
    // Try Pyth oracle for on-chain verified price
    (token === 'BTC' || token === 'STX') ? getPythPrice(token as 'BTC' | 'STX') : Promise.resolve(null),
    // CoinGecko for additional market data
    fetch(`https://api.coingecko.com/api/v3/coins/${token === 'BTC' ? 'bitcoin' : token === 'STX' ? 'blockstack' : 'bitcoin'}?localization=false&tickers=false&community_data=true&developer_data=false`)
      .then(r => r.json())
      .catch(() => null),
    fetch('https://api.alternative.me/fng/?limit=1')
      .then(r => r.json())
      .catch(() => null),
  ]);

  // Use Pyth price if available, otherwise CoinGecko
  const pythPrice = pythData?.price;
  const coingeckoPrice = (priceData as any)?.market_data?.current_price?.usd;
  const price = pythPrice ?? coingeckoPrice;
  const priceSource = pythPrice ? 'pyth' : 'coingecko';

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
          price_source: priceSource,
          pyth_available: !!pythPrice,
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
        price_source: priceSource,
        pyth_available: !!pythPrice,
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

// Token configuration for price sources
const TOKEN_CONFIG: Record<string, { coingecko: string; kucoin: string; coinpaprika: string; pyth?: 'BTC' | 'STX' }> = {
  BTC: { coingecko: 'bitcoin', kucoin: 'BTC-USDT', coinpaprika: 'btc-bitcoin', pyth: 'BTC' },
  STX: { coingecko: 'blockstack', kucoin: 'STX-USDT', coinpaprika: 'stx-stacks', pyth: 'STX' },
  ETH: { coingecko: 'ethereum', kucoin: 'ETH-USDT', coinpaprika: 'eth-ethereum' },
  SOL: { coingecko: 'solana', kucoin: 'SOL-USDT', coinpaprika: 'sol-solana' },
};

// Fetch aggregated prices for a token
async function fetchTokenPrices(token: string) {
  const ids = TOKEN_CONFIG[token];
  if (!ids) return null;

  // Fetch from all sources in parallel
  const sources = await Promise.all([
    // Pyth Oracle (on-chain, Stacks) - with timeout
    ids.pyth ? Promise.race([
      getPythPrice(ids.pyth).then(data => ({
        source: 'pyth',
        type: 'on-chain oracle',
        price: data?.price ?? null,
        timestamp: data?.timestamp ?? null,
        error: data ? null : 'No Pyth feed available',
      })),
      new Promise<{ source: string; type: string; price: null; error: string }>(resolve =>
        setTimeout(() => resolve({ source: 'pyth', type: 'on-chain oracle', price: null, error: 'Timeout' }), 5000)
      ),
    ]) : Promise.resolve(null),

    // CoinGecko
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.coingecko}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`)
      .then(r => r.json())
      .then((data: any) => ({
        source: 'coingecko',
        type: 'aggregator',
        price: data[ids.coingecko]?.usd ?? null,
        change_24h: data[ids.coingecko]?.usd_24h_change ?? null,
        timestamp: data[ids.coingecko]?.last_updated_at ? data[ids.coingecko].last_updated_at * 1000 : null,
        error: null,
      }))
      .catch(e => ({ source: 'coingecko', type: 'aggregator', price: null, error: e.message })),

    // KuCoin
    fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${ids.kucoin}`)
      .then(r => r.json())
      .then((data: any) => ({
        source: 'kucoin',
        type: 'exchange',
        price: data.data?.price ? parseFloat(data.data.price) : null,
        timestamp: data.data?.time ?? Date.now(),
        error: data.code !== '200000' ? data.msg : null,
      }))
      .catch(e => ({ source: 'kucoin', type: 'exchange', price: null, error: e.message })),

    // CoinPaprika
    fetch(`https://api.coinpaprika.com/v1/tickers/${ids.coinpaprika}`)
      .then(r => r.json())
      .then((data: any) => ({
        source: 'coinpaprika',
        type: 'aggregator',
        price: data.quotes?.USD?.price ?? null,
        change_24h: data.quotes?.USD?.percent_change_24h ?? null,
        timestamp: data.last_updated ? new Date(data.last_updated).getTime() : Date.now(),
        error: data.error ?? null,
      }))
      .catch(e => ({ source: 'coinpaprika', type: 'aggregator', price: null, error: e.message })),

    // Kraken
    fetch(`https://api.kraken.com/0/public/Ticker?pair=${token}USD`)
      .then(r => r.json())
      .then((data: any) => {
        const pair = Object.keys(data.result || {})[0];
        const price = pair ? parseFloat(data.result[pair]?.c?.[0]) : null;
        return {
          source: 'kraken',
          type: 'exchange',
          price: price || null,
          timestamp: Date.now(),
          error: data.error?.length ? data.error[0] : null,
        };
      })
      .catch(e => ({ source: 'kraken', type: 'exchange', price: null, error: e.message })),
  ]);

  // Filter out null entries and calculate stats
  const validSources = sources.filter((s): s is NonNullable<typeof s> => s !== null);
  const prices = validSources.filter(s => s.price !== null).map(s => s.price as number);

  let stats = null;
  if (prices.length > 0) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const spread = ((max - min) / avg) * 100;

    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    stats = {
      average: parseFloat(avg.toFixed(6)),
      median: parseFloat(median.toFixed(6)),
      min: parseFloat(min.toFixed(6)),
      max: parseFloat(max.toFixed(6)),
      spread_percent: parseFloat(spread.toFixed(4)),
      sources_available: prices.length,
      sources_total: validSources.length,
    };
  }

  return {
    token,
    timestamp: new Date().toISOString(),
    stats,
    sources: validSources.map(s => ({
      ...s,
      price: s.price !== null ? parseFloat((s.price as number).toFixed(6)) : null,
      deviation_from_avg: s.price !== null && stats
        ? parseFloat((((s.price as number) - stats.average) / stats.average * 100).toFixed(4))
        : null,
    })),
  };
}

// Aggregated prices endpoint (free) - multiple sources for comparison
app.get('/prices', async (c) => {
  const token = (c.req.query('token') || 'BTC').toUpperCase();

  if (!TOKEN_CONFIG[token]) {
    return c.json({
      error: 'Unsupported token',
      supported: Object.keys(TOKEN_CONFIG)
    }, 400);
  }

  const result = await fetchTokenPrices(token);
  return c.json(result);
});

// Get all prices for multiple tokens at once
app.get('/prices/all', async (c) => {
  const tokens = Object.keys(TOKEN_CONFIG);

  // Pre-fetch Pyth prices sequentially to avoid overwhelming Hiro API
  const pythPrices: Record<string, Awaited<ReturnType<typeof getPythPrice>>> = {};
  for (const token of ['BTC', 'STX'] as const) {
    pythPrices[token] = await getPythPrice(token).catch(() => null);
  }

  // Fetch all tokens in parallel, but use cached Pyth prices
  const results = await Promise.all(tokens.map(async (token) => {
    const ids = TOKEN_CONFIG[token];
    if (!ids) return null;

    // Fetch non-Pyth sources in parallel
    const sources = await Promise.all([
      // Use pre-fetched Pyth price if available
      ids.pyth ? Promise.resolve(pythPrices[ids.pyth] ? {
        source: 'pyth',
        type: 'on-chain oracle',
        price: pythPrices[ids.pyth]?.price ?? null,
        timestamp: pythPrices[ids.pyth]?.timestamp ?? null,
        error: pythPrices[ids.pyth] ? null : 'No Pyth feed available',
      } : {
        source: 'pyth',
        type: 'on-chain oracle',
        price: null,
        timestamp: null,
        error: 'No Pyth feed available',
      }) : Promise.resolve(null),

      // CoinGecko
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.coingecko}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`)
        .then(r => r.json())
        .then((data: any) => ({
          source: 'coingecko',
          type: 'aggregator',
          price: data[ids.coingecko]?.usd ?? null,
          change_24h: data[ids.coingecko]?.usd_24h_change ?? null,
          timestamp: data[ids.coingecko]?.last_updated_at ? data[ids.coingecko].last_updated_at * 1000 : null,
          error: null,
        }))
        .catch(e => ({ source: 'coingecko', type: 'aggregator', price: null, error: e.message })),

      // KuCoin
      fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${ids.kucoin}`)
        .then(r => r.json())
        .then((data: any) => ({
          source: 'kucoin',
          type: 'exchange',
          price: data.data?.price ? parseFloat(data.data.price) : null,
          timestamp: data.data?.time ?? Date.now(),
          error: data.code !== '200000' ? data.msg : null,
        }))
        .catch(e => ({ source: 'kucoin', type: 'exchange', price: null, error: e.message })),

      // CoinPaprika
      fetch(`https://api.coinpaprika.com/v1/tickers/${ids.coinpaprika}`)
        .then(r => r.json())
        .then((data: any) => ({
          source: 'coinpaprika',
          type: 'aggregator',
          price: data.quotes?.USD?.price ?? null,
          change_24h: data.quotes?.USD?.percent_change_24h ?? null,
          timestamp: data.last_updated ? new Date(data.last_updated).getTime() : Date.now(),
          error: data.error ?? null,
        }))
        .catch(e => ({ source: 'coinpaprika', type: 'aggregator', price: null, error: e.message })),

      // Kraken
      fetch(`https://api.kraken.com/0/public/Ticker?pair=${token}USD`)
        .then(r => r.json())
        .then((data: any) => {
          const pair = Object.keys(data.result || {})[0];
          const price = pair ? parseFloat(data.result[pair]?.c?.[0]) : null;
          return {
            source: 'kraken',
            type: 'exchange',
            price: price || null,
            timestamp: Date.now(),
            error: data.error?.length ? data.error[0] : null,
          };
        })
        .catch(e => ({ source: 'kraken', type: 'exchange', price: null, error: e.message })),
    ]);

    const validSources = sources.filter((s): s is NonNullable<typeof s> => s !== null);
    const prices = validSources.filter(s => s.price !== null).map(s => s.price as number);

    let stats = null;
    if (prices.length > 0) {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const spread = ((max - min) / avg) * 100;

      const sorted = [...prices].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

      stats = {
        average: parseFloat(avg.toFixed(6)),
        median: parseFloat(median.toFixed(6)),
        min: parseFloat(min.toFixed(6)),
        max: parseFloat(max.toFixed(6)),
        spread_percent: parseFloat(spread.toFixed(4)),
        sources_available: prices.length,
        sources_total: validSources.length,
      };
    }

    return {
      token,
      timestamp: new Date().toISOString(),
      stats,
      sources: validSources.map(s => ({
        ...s,
        price: s.price !== null ? parseFloat((s.price as number).toFixed(6)) : null,
        deviation_from_avg: s.price !== null && stats
          ? parseFloat((((s.price as number) - stats.average) / stats.average * 100).toFixed(4))
          : null,
      })),
    };
  }));

  return c.json({
    timestamp: new Date().toISOString(),
    prices: Object.fromEntries(tokens.map((t, i) => [t, results[i]])),
  });
});

export default app;
