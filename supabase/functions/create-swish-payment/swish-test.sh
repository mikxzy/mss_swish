#!/bin/bash

curl --cert myCertificate.p12:swish \
     --cert-type P12 \
     --cacert Swish_TLS_Root_CA.pem \
     -H "Content-Type: application/json" \
     -d '{
       "payeeAlias": "1230765727",
       "payerSSN": "198905074129",
       "amount": "499",
       "currency": "SEK",
       "message": "Testbetalning via script",
       "callbackUrl": "https://glpx.pages.dev/swish-callback",
       "paymentReference": "script123"
     }' \
     https://mss.cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests
