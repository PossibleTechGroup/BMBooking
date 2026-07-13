require("../load-env");
const axios = require("axios");
const https = require("https");

module.exports = async function applyFabricToken() {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.post(
      `${process.env.BASE_URL}/payment/v1/token`,
      { appSecret: process.env.APP_SECRET },
      {
        headers: {
          "Content-Type": "application/json",
          "X-APP-Key": process.env.FABRIC_APP_ID,
        },
        httpsAgent: agent,
      }
    );

    return response.data;
  } catch (error) {
    console.log("ERROR", error);
    console.error(
      "Error applying fabric token:",
      error.response?.data || error.message
    );
    throw error;
  }
};
