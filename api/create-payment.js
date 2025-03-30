import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Endast POST är tillåtet' });
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body);

      const {
        payeeAlias = '1230765727',
        payerSSN = '198905074129',
        amount = '499',
        message = 'Testbetalning',
        callbackUrl = 'https://glpx.pages.dev/swish-callback',
        paymentReference = Math.random().toString(36).substring(2, 12)
      } = parsed;

      const cert = Buffer.from(process.env.SWISH_CERT, 'base64');
      const key = Buffer.from(process.env.SWISH_KEY, 'base64');
      const ca = Buffer.from(process.env.SWISH_ROOT_CA, 'base64');

      const agent = new https.Agent({
        cert,
        key,
        ca,
        rejectUnauthorized: true
      });

      const swishPayload = JSON.stringify({
        payeeAlias,
        payerSSN,
        amount,
        currency: 'SEK',
        message,
        callbackUrl,
        paymentReference
      });

      const fetch = (await import('node-fetch')).default;

      const swishRes = await fetch('https://staging.getswish.pub.tds.tieto.com/swish-cpcapi/api/v2/paymentrequests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(swishPayload)
        },
        agent,
        body: swishPayload
      });

      const data = await swishRes.json();
      res.status(swishRes.status).json(data);
    } catch (err) {
      console.error('❌ Swish error:', err);
      res.status(500).json({ error: err.message });
    }
  });
}
