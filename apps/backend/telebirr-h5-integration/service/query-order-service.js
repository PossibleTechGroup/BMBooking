require("../load-env");
const axios = require("axios");
const https = require("https");
const applyFabricToken = require("./apply-fabric-token");
const {
  createNonceStr,
  createTimeStamp,
  signRequestObject,
} = require("../utils/tools");

// Telebirr H5 C2B queryOrder — server-to-server confirmation of an order's
// real status, used when the async notify (webhook) never arrives.
// https://developer.ethiotelecom.et/docs/H5%20C2B%20Web%20Payment%20Integration%20Quick%20Guide/queryOrder
async function queryOrderStatus(merchOrderId) {
  const fabric = await applyFabricToken();

  const requestObject = {
    nonce_str: createNonceStr(),
    method: "payment.queryorder",
    version: "1.0",
    timestamp: createTimeStamp(),
    biz_content: {
      appid: process.env.MERCHANT_APP_ID,
      merch_code: process.env.MERCHANT_CODE,
      merch_order_id: merchOrderId,
    },
  };

  requestObject.sign = signRequestObject(requestObject);
  requestObject.sign_type = "SHA256WithRSA";

  const agent = new https.Agent({ rejectUnauthorized: false });
  const response = await axios.post(
    `${process.env.BASE_URL}/payment/v1/merchant/queryOrder`,
    requestObject,
    {
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": process.env.FABRIC_APP_ID,
        Authorization: fabric.token,
      },
      httpsAgent: agent,
      timeout: 20000,
    }
  );

  console.log("QUERY ORDER RESPONSE:", JSON.stringify(response.data, null, 2));
  return response.data;
}

module.exports = { queryOrderStatus };