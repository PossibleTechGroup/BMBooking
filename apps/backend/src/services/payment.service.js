const CHAPA_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

const PaymentService = {
  /**
   * Initialize a Chapa transaction
   */
  initializePayment: async (data) => {
    try {
      const response = await fetch(`${CHAPA_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: 'ETB',
          email: data.email || 'customer@bm-booking.com',
          first_name: data.firstName || 'Patient',
          last_name: data.lastName || 'User',
          tx_ref: data.txRef,
          callback_url: data.callbackUrl,
          return_url: data.returnUrl,
          customization: {
            title: 'BM Booking',
            description: `Payment for Dr. ${data.doctorName}`
          }
        })
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('❌ [CHAPA] Initialize Error Body:', JSON.stringify(result, null, 2));
        throw new Error(result.message || 'Chapa initialization failed');
      }
      return result;
    } catch (err) {
      console.error('❌ [CHAPA] Initialize Exception:', err.message);
      throw err;
    }
  },

  /**
   * Verify a Chapa transaction
   */
  verifyPayment: async (txRef) => {
    try {
      const response = await fetch(`${CHAPA_URL}/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`
        }
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Chapa verification failed');
      }
      return result;
    } catch (err) {
      console.error('❌ [CHAPA] Verify error:', err.message);
      throw err;
    }
  }
};

module.exports = PaymentService;
