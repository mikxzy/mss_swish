import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Endast POST tillåts", {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { callbackUrl, payeeAlias, amount, ssn } = await req.json();

    const uuid = crypto.randomUUID();
    const swishPayload = {
      payeeAlias: payeeAlias || "1230765727",
      payerSSN: ssn || "198905074129",
      amount: amount || "499",
      currency: "SEK",
      message: "Månadsabonnemang: 499 kr",
      callbackUrl: callbackUrl || "https://glpx.pages.dev/swish-callback",
      paymentReference: uuid.slice(0, 10)
    };

    // 🔐 Läs certifikat, nyckel och CA från miljövariabler
    const certPem = Deno.env.get("SWISH_CERT") ?? "";
    const keyPem = Deno.env.get("SWISH_KEY") ?? "";
    const rootCa = Deno.env.get("SWISH_ROOT_CA") ?? "";

    // ✅ Logga längder och innehållscheck
    const certOk = certPem.includes("BEGIN CERTIFICATE") || certPem.includes("BEGIN PKCS12");
    const keyOk = keyPem.includes("BEGIN PRIVATE KEY") || keyPem.includes("BEGIN ENCRYPTED PRIVATE KEY") || certPem.includes("BEGIN PKCS12");
    const caOk = rootCa.includes("BEGIN CERTIFICATE") || rootCa.includes("BEGIN TRUSTED CERTIFICATE") || rootCa.includes("DigiCert Global Root");

    console.log("🔍 Certifikatvalidering:", {
      certOk,
      keyOk,
      caOk,
      certLength: certPem.length,
      keyLength: keyPem.length,
      caLength: rootCa.length
    });

    if (!certOk || !keyOk || !caOk) {
      console.error("❌ Certifikatvalidering misslyckades", { certOk, keyOk, caOk });
      throw new Error("Ett eller flera certifikat saknas eller är felaktigt formaterade. Kontrollera miljövariablerna SWISH_CERT, SWISH_KEY och SWISH_ROOT_CA.");
    }

    const res = await fetch("https://cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(swishPayload),
      clientCert: certPem,
      clientKey: keyPem,
      caCerts: [rootCa]
    });

    let result;
    try {
      result = await res.json();
    } catch (_) {
      result = { raw: await res.text() };
    }

    return new Response(JSON.stringify(result), {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("❌ Edge Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
