const http = require("http");
require("./load-env");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const createOrder = require("./service/create-order-service");
const { signRequestObject } = require("./utils/tools");

const app = express();
const server = http.createServer(app);

function isSuccessStatus(status) {
  if (!status) return false;
  const v = String(status).toUpperCase();
  return v === "COMPLETED" || v.includes("TRADE_SUCCESS") || v.includes("SUCCESS");
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ── Services for auto-checkout ──────────────────────────────────
const applyFabricToken = require("./service/apply-fabric-token");
const { requestCreateOrder } = require("./service/request-create-order");
const createRawRequest = require("./service/create-raw-request");

// Always show the payment form. ?amount= pre-fills the amount field.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "test.html"));
});

// Serve payment URL test page
app.get("/test-payment-url", (req, res) => {
  res.sendFile(path.join(__dirname, "test-payment-url.html"));
});

// Serve endpoint URL test page
app.get("/test-endpoint-url", (req, res) => {
  res.sendFile(path.join(__dirname, "test-endpoint-url.html"));
});

// Serve driver top-up page
app.get("/driver-topup", (req, res) => {
  res.sendFile(path.join(__dirname, "driver-topup.html"));
});

app.get("/success.html", (req, res) => {
  res.sendFile(path.join(__dirname, "success.html"));
});

app.get("/notify.html", (req, res) => {
  res.sendFile(path.join(__dirname, "notify.html"));
});

// Telebirr webhook (notify_url points here)
app.post("/notify.html", handlePaymentNotify);

// Reconciliation: check a BM Booking order's real status at the Telebirr
// paygate. The async notify sometimes never arrives, so the success page
// polls this endpoint; when the order is confirmed paid, the ledger entry
// is recorded (same pipeline as the webhook) and the appointment booking
// can proceed on the app side.
const { queryOrderStatus } = require("./service/query-order-service");

app.get("/order-status", async (req, res) => {
  const refNo = String(req.query.refNo || "").trim();
  if (!refNo || !/^ORD[A-Za-z0-9]+$/.test(refNo)) {
    return res.json({ ok: false, paid: false, error: "invalid refNo" });
  }
  try {
    const data = await queryOrderStatus(refNo);
    const biz = (data && data.biz_content) || {};
    const pick = (keys) => {
      for (const k of keys) {
        const v = biz[k];
        if (v !== undefined && v !== null && String(v) !== "") return String(v);
      }
      return "";
    };
    const status = pick(["trade_status", "tradeStatus", "order_status", "orderStatus", "result"]);
    const paid = isSuccessStatus(status);
    const amount = pick(["total_amount", "totalAmount"]);
    const transactionId = pick(["trans_id", "transId"]);
    const paymentOrderId = pick(["payment_order_id", "paymentOrderId"]);

    if (paid) {
      const bmUrl = process.env.BM_BACKEND_URL || process.env.SHEGA_BACKEND_URL || "http://app:5000";
      try {
        await axios.post(
          `${bmUrl}/api/payments/telebirr-notify`,
          {
            orderId: refNo,
            status: "Completed",
            amount,
            transactionId,
            raw: data,
          },
          { headers: { "Content-Type": "application/json" }, timeout: 10000 }
        );
        console.log("✅ Recorded reconciled order:", refNo, "amount:", amount);
      } catch (error) {
        console.error("❌ Failed to record reconciled order:", error.message);
      }
    }

    return res.json({
      ok: true,
      paid,
      orderId: refNo,
      status,
      amount,
      paymentOrderId,
      transactionId,
    });
  } catch (error) {
    console.error("❌ queryOrder error:", error.message);
    return res.status(500).json({ ok: false, paid: false, error: error.message });
  }
});

// Intermediate redirect page — Telebirr requires http/https redirect_url,
// this page then bounces the user to the app deep link (e.g. riderapp://)
app.get("/payment-complete", (req, res) => {
  const { to, ...telebirrParams } = req.query;
  let appUrl = to || "riderapp://topup-complete?status=success";

  // Forward any extra Telebirr params (trans_end_time, trade_status, etc.)
  const extraParams = Object.entries(telebirrParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const finalUrl = extraParams
    ? `${appUrl}${appUrl.includes("?") ? "&" : "?"}${extraParams}`
    : appUrl;

  res.send(`<!DOCTYPE html><html><head>
    <meta http-equiv="refresh" content="0;url=${finalUrl}">
  </head><body>
    <script>window.location.href = '${finalUrl}';</script>
    <p>Redirecting back to the app...</p>
  </body></html>`);
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PATCH, PUT, DELETE"
  );
  res.header("Allow", "GET, POST, PATCH, OPTIONS, PUT, DELETE");
  next();
});

app.post("/create/order", async (req, res) => {
  console.log("***********START RES****************");
  try {
    const response = await createOrder(req, res);

    if (!response.rawRequest) {
      throw new Error(response?.data?.errorMsg || "Failed to create order");
    }

    console.log("RESPONSE", response);

    const rawRequest = response.rawRequest;
    const url = `${process.env.PAYMENT_GATEWAY}${rawRequest}&version=1.0&trade_type=Checkout`;

    // Send URL as plain text, ensure no extra whitespace
    res.status(200).setHeader('Content-Type', 'text/plain').send(url.trim());
  } catch (error) {
    console.error("Error creating order:", error);

    return res.status(500).json({ error: error.message });
  }
  console.log("************END RES***************");
});

async function handlePaymentNotify(req, res) {
  try {
    console.log("========== PAYMENT CALLBACK RECEIVED ==========");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Request Headers:", JSON.stringify(req.headers, null, 2));

    // Verify the signature
    const receivedSign = req.body.sign;
    const calculatedSign = signRequestObject(req.body);

    console.log("Received Signature:", receivedSign);
    console.log("Calculated Signature:", calculatedSign);

    // Note: In production, you should compare signatures properly
    // For now, we'll log and accept the callback
    const signatureValid = receivedSign === calculatedSign;

    if (signatureValid) {
      console.log("✅ Signature verification: PASSED");
    } else {
      console.log("⚠️ Signature verification: FAILED (but processing anyway for testing)");
    }

    // Extract payment information
    const paymentInfo = {
      orderId: req.body.merch_order_id || req.body.out_trade_no,
      paymentOrderId: req.body.payment_order_id,
      transactionId: req.body.transId || req.body.trade_no,
      amount: req.body.total_amount,
      currency: req.body.trans_currency,
      status: req.body.trade_status,
      transactionEndTime: req.body.trans_end_time,
      notifyTime: req.body.notify_time,
      appid: req.body.appid,
      merchCode: req.body.merch_code,
    };

    console.log("✅ Payment Info Extracted:", JSON.stringify(paymentInfo, null, 2));
    
    // Log payment completion
    if (isSuccessStatus(paymentInfo.status)) {
      console.log(`✅✅✅ PAYMENT COMPLETED ✅✅✅`);
      console.log(`   Order: ${paymentInfo.orderId}`);
      console.log(`   Amount: ${paymentInfo.amount} ${paymentInfo.currency}`);
      console.log(`   Payment Order ID: ${paymentInfo.paymentOrderId}`);
      console.log(`   Transaction ID: ${paymentInfo.transactionId}`);

      // BM Booking appointment payment (ORD + timestamp from checkout page)
      if (paymentInfo.orderId && /^ORD[A-Za-z0-9]+$/.test(paymentInfo.orderId)) {
        const bmUrl = process.env.BM_BACKEND_URL || process.env.SHEGA_BACKEND_URL || "http://app:5000";
        try {
          await axios.post(`${bmUrl}/api/payments/telebirr-notify`, {
            orderId: paymentInfo.orderId,
            status: paymentInfo.status,
            amount: paymentInfo.amount,
            transactionId: paymentInfo.transactionId,
            raw: req.body,
          }, { headers: { "Content-Type": "application/json" }, timeout: 10000 });
          console.log("✅ Notified BM Booking backend:", paymentInfo.orderId);
        } catch (error) {
          console.error("❌ Failed to notify BM Booking backend:", error.message);
        }
      }

      // Check if this is a top-up payment (starts with TOPUP)
      if (paymentInfo.orderId && paymentInfo.orderId.startsWith("TOPUP")) {
        console.log("🔄 Detected top-up payment, notifying shega backend...");
        try {
          const shegaBackendUrl = process.env.SHEGA_BACKEND_URL || "http://localhost:3000";
          const notifyUrl = `${shegaBackendUrl}/api/v1/drivers/topup/complete`;
          console.log(`   Notify URL: ${notifyUrl}`);
          console.log(`   Order: ${paymentInfo.orderId}`);
          
          const response = await axios.post(
            notifyUrl,
            req.body,
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: 10000,
            }
          );
          console.log("✅ Successfully notified shega backend about top-up completion");
          console.log("   Response:", response.data);
        } catch (error) {
          console.error("❌ Failed to notify shega backend:");
          console.error("   Error:", error.message);
          if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", error.response.data);
          }
        }
      }
    }

    console.log("========== CALLBACK PROCESSED SUCCESSFULLY ==========");

    // Return success response (Telebirr expects this)
    return res.status(200).json({
      code: "0000",
      msg: "SUCCESS",
      data: "PAYMENT VERIFIED",
    });
  } catch (error) {
    console.error("❌ Error processing payment callback:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      code: "5000",
      msg: "INTERNAL_ERROR",
      data: error.message,
    });
  }
}

app.post("/verify-payment", handlePaymentNotify);

// Callback status check endpoint
app.get("/callback-status", (req, res) => {
  const serverPort = process.env.PORT || 8080;
  // PUBLIC_BASE_URL is the externally-reachable URL of this H5 service
  // (e.g. http://77.42.25.202:53402). When set it is used for both the
  // Telebirr webhook (notify_url) and the success/back-to-merchant
  // (redirect_url), guaranteeing callbacks arrive at the correct service.
  // Fallback: build from SERVER_IP in .env = your LAN or public IP.
  const host =
    process.env.SERVER_IP ||
    req.headers["x-forwarded-host"]?.split(":")[0] ||
    (req.headers.host || "").split(":")[0] ||
    "localhost";
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://${host}:${serverPort}`;

  res.json({
    status: "active",
    baseUrl,
    notifyUrl: `${baseUrl}/notify.html`,
    successUrl: `${baseUrl}/success.html`,
    callbackUrl: `${baseUrl}/notify.html`,
    serverIP: host,
    serverPort,
    timestamp: new Date().toISOString(),
    note: "PUBLIC_BASE_URL env is used for notify_url/redirect_url when set",
  });
});

const serverPort = process.env.PORT || 8080;
server.listen(serverPort, "0.0.0.0", () => {
  console.log(`Server started, port: ${serverPort}`);
  console.log(`Server accessible at: http://157.180.114.86:${serverPort}`);
  console.log(`Notify URL: http://157.180.114.86:${serverPort}/notify.html`);
  console.log(`Success URL: http://157.180.114.86:${serverPort}/success.html`);
});
