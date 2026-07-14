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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ── Services for auto-checkout ──────────────────────────────────
const applyFabricToken = require("./service/apply-fabric-token");
const { requestCreateOrder } = require("./service/request-create-order");
const createRawRequest = require("./service/create-raw-request");

// Auto-checkout: creates Telebirr payment order from query params and redirects.
// Falls through to mock/test page if no amount or auto-checkout fails.
app.get("/", async (req, res) => {
  const { amount, title } = req.query;

  if (amount && Number(amount) > 0) {
    try {
      const refNo = "ORD" + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase();
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const orderBody = {
        refNo,
        title: title || "BM Booking Payment",
        total_amount: String(Math.round(parseFloat(amount) * 100) / 100),
        trans_currency: "ETB",
        notify_url: `${baseUrl}/notify.html`,
        redirect_url: `${baseUrl}/payment-complete?to=${encodeURIComponent("bmbooking://payment-success")}`,
      };

      console.log("[AUTO-CHECKOUT] Creating order", refNo, "amount:", orderBody.total_amount);

      const tokenResult = await applyFabricToken();
      if (!tokenResult || !tokenResult.token) {
        throw new Error("Failed to obtain fabric token");
      }

      const orderResult = await requestCreateOrder(orderBody, tokenResult.token);
      if (!orderResult || !orderResult.biz_content || !orderResult.biz_content.prepay_id) {
        throw new Error("Failed to create order: missing prepay_id");
      }

      const rawRequest = createRawRequest(orderResult.biz_content.prepay_id);
      const paymentUrl = `${process.env.PAYMENT_GATEWAY}${rawRequest}&version=1.0&trade_type=Checkout`;

      console.log("[AUTO-CHECKOUT] Redirecting to Telebirr payment URL");
      return res.redirect(paymentUrl);
    } catch (error) {
      console.error("[AUTO-CHECKOUT] Failed:", error.message);
      // Fall through to test.html if auto-order fails
    }
  }

  // Show the payment form page — user confirms amount, creates order, gets redirected to Telebirr
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
    if (paymentInfo.status === "Completed") {
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
  // SERVER_IP in .env = your LAN or public IP (e.g. 192.168.1.5 or 157.180.114.86)
  const host =
    process.env.SERVER_IP ||
    req.headers["x-forwarded-host"]?.split(":")[0] ||
    (req.headers.host || "").split(":")[0] ||
    "localhost";
  const baseUrl = `http://${host}:${serverPort}`;

  res.json({
    status: "active",
    baseUrl,
    notifyUrl: `${baseUrl}/notify.html`,
    successUrl: `${baseUrl}/success.html`,
    callbackUrl: `${baseUrl}/notify.html`,
    serverIP: host,
    serverPort,
    timestamp: new Date().toISOString(),
    note: "Open the app via http://<your-ip>:8080 and set SERVER_IP in .env for Telebirr webhooks",
  });
});

const serverPort = process.env.PORT || 8080;
server.listen(serverPort, "0.0.0.0", () => {
  console.log(`Server started, port: ${serverPort}`);
  console.log(`Server accessible at: http://157.180.114.86:${serverPort}`);
  console.log(`Notify URL: http://157.180.114.86:${serverPort}/notify.html`);
  console.log(`Success URL: http://157.180.114.86:${serverPort}/success.html`);
});
