// api/create-payment.js
import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Endast POST är tillåtet' });
  }

  const {
    payeeAlias = '1230765727',
    payerSSN = '198905074129',
    amount = '499',
    message = 'Testbetalning',
    callbackUrl = 'https://glpx.pages.dev/swish-callback',
    paymentReference = Math.random().toString(36).substring(2, 12)
  } = req.body;

  const cert = Buffer.from(process.env.SWISH_CERT, 'base64');
  const key = Buffer.from(process.env.SWISH_KEY, 'base64');
  const ca = Buffer.from(process.env.SWISH_ROOT_CA, 'base64');

  const agent = new https.Agent({
    cert,
    key,
    ca,
    rejectUnauthorized: true
  });

  const body = JSON.stringify({
    payeeAlias,
    payerSSN,
    amount,
    currency: 'SEK',
    message,
    callbackUrl,
    paymentReference
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    agent
  };

  const url = 'https://staging.getswish.pub.tds.tieto.com/swish-cpcapi/api/v2/paymentrequests';

  try {
    const swishRes = await fetch(url, { ...options, body });
    let data;
    try {
      data = await swishRes.json();
    } catch {
      const raw = await swishRes.text();
      data = { raw };
    }
    res.status(swishRes.status).json(data);
  } catch (err) {
    console.error('Swish error:', err);
    res.status(500).json({ error: err.message });
  }
}
