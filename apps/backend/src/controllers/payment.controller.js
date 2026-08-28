const PaymentService = require('../services/payment.service');
const prisma = require('../lib/prisma');
const TelebirrLedger = require('../lib/telebirrLedger');

const PaymentController = {
  /**
   * POST /api/payments/initialize
   * Initialize a payment for an appointment
   */
  initialize: async (req, res) => {
    try {
      const { doctorId, amount, returnUrl } = req.body;
      const user = req.user;

      if (!doctorId || !amount) {
        return res.status(400).json({ status: 'fail', message: 'doctorId and amount are required' });
      }

      const doctor = await prisma.doctorProfile.findUnique({ where: { id: parseInt(doctorId) } });
      if (!doctor) {
        return res.status(404).json({ status: 'fail', message: 'Doctor not found' });
      }

      // Generate a unique transaction reference
      const txRef = `TX${Date.now()}${user.id}${doctorId}`;

      const paymentData = {
        amount: Number(amount),
        txRef,
        email: user.phone ? `${user.phone}@gmail.com` : 'customer@gmail.com', // Guaranteed valid gmail format
        firstName: user.patientProfile?.fullName?.split(' ')[0] || 'Patient',
        lastName: user.patientProfile?.fullName?.split(' ')[1] || 'User',
        doctorName: doctor.fullName,
        returnUrl: `${process.env.BASE_URL || 'https://api.weleba.tech'}/api/payments/success-redirect`,
        callbackUrl: `${process.env.BASE_URL || 'https://api.weleba.tech'}/api/payments/webhook`
      };

      console.log('📝 [PAYMENT] Initializing with data:', JSON.stringify(paymentData, null, 2));

      const result = await PaymentService.initializePayment(paymentData);
      
      res.status(200).json({
        status: 'success',
        data: {
          checkoutUrl: result.data.checkout_url,
          txRef: txRef
        }
      });
    } catch (err) {
      console.error('❌ [PAYMENT] Initialize error:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  /**
   * GET /api/payments/success-redirect
   * A landing page that returns the patient to BM Booking (web or mobile)
   */
  successRedirect: (req, res) => {
    const webUrl =
      process.env.WEB_APP_URL || 'https://bmbooking.possibletechplc.com/patient/appointments';

    // Telegram Mini App flow: Telegram's webview refuses plain-http pages and
    // custom schemes, so no auto-redirect and no deep link here. The user just
    // goes back to Telegram and the book is auto-completed by polling.
    if (req.query.from === 'tg') {
      return res.send(`
        <html>
          <head>
            <title>Payment Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 50px 24px; margin: 0; background: #f9f7f2; }
              .card { background: white; padding: 34px 26px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); max-width: 380px; margin: 0 auto; }
              .ring { width: 72px; height: 72px; border-radius: 50%; background: #ecfdf3; border: 1px solid #d1fadf; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 34px; color: #039855; }
              h1 { color: #101828; font-size: 22px; margin: 0 0 10px; }
              p { color: #667085; font-size: 15px; line-height: 1.55; margin: 0 0 6px; }
              .botline { color: #98a2b3; font-size: 13px; margin-top: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="ring">✓</div>
              <h1>Payment Successful</h1>
              <p>Your payment was received.</p>
              <p>Return to the Telegram chat and reopen the app to finish your booking.</p>
              <p class="botline">Your appointment will be created automatically.</p>
            </div>
          </body>
        </html>
      `);
    }

    res.send(`
      <html>
        <head>
          <title>Payment Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f7f6; }
            .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 400px; margin: auto; }
            .icon { font-size: 50px; color: #2ecc71; margin-bottom: 20px; }
            h1 { color: #2c3e50; font-size: 24px; margin-bottom: 10px; }
            p { color: #7f8c8d; margin-bottom: 30px; }
            .btn { background: #0088cc; color: white; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; margin: 6px; }
            .btn-mobile { background: #6b7280; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Payment Received!</h1>
            <p>Thank you for your payment. Return below to finish booking your appointment.</p>
            <a href="${webUrl}" class="btn">Return to BM Booking (Web)</a>
            <a href="bmbooking://payment-success" class="btn btn-mobile">Return (Mobile App)</a>
          </div>
          <script>
            setTimeout(function() {
              window.location.href = "${webUrl}";
            }, 2000);
          </script>
        </body>
      </html>
    `);
  },

  /**
   * GET /api/payments/verify/:txRef
   * Verify if a payment was successful
   */
  verify: async (req, res) => {
    try {
      const { txRef } = req.params;

      // Telebirr (BM Booking appointment flow)
      const telebirrEntry = TelebirrLedger.findByOrderId(txRef);
      if (telebirrEntry) {
        return res.status(200).json({
          status: 'success',
          data: { paid: true, provider: 'telebirr', details: telebirrEntry },
        });
      }

      const result = await PaymentService.verifyPayment(txRef);

      if (result.status === 'success' && result.data.status === 'success') {
        res.status(200).json({ status: 'success', data: { paid: true, details: result.data } });
      } else {
        res.status(200).json({ status: 'fail', data: { paid: false, message: 'Payment not completed' } });
      }
    } catch (err) {
      console.error('❌ [PAYMENT] Verify error:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  /**
   * POST /api/payments/telebirr-notify
   * Called by telebirr-h5-integration when a TX- order is paid
   */
  telebirrNotify: async (req, res) => {
    const { orderId, status, amount, transactionId } = req.body;
    console.log('🔔 [TELEBIRR] Notify:', orderId, status, amount);

    TelebirrLedger.record({ orderId, status, amount, transactionId });

    res.status(200).json({ status: 'success' });
  },

  /**
   * POST /api/payments/verify-telebirr
   * Body: { amount } — matches ORD order paid via telebirr-h5 webhook
   */
  verifyTelebirr: async (req, res) => {
    const { amount } = req.body;

    const paid = TelebirrLedger.findByAmount(amount);

    if (paid) {
      return res.status(200).json({
        status: 'success',
        data: { paid: true, provider: 'telebirr', orderId: paid.orderId, details: paid },
      });
    }

    res.status(200).json({
      status: 'fail',
      data: { paid: false, message: 'No matching Telebirr payment found for this amount' },
    });
  },

  /**
   * POST /api/payments/webhook
   * Handle Chapa webhooks
   */
  webhook: async (req, res) => {
    console.log('🔔 [PAYMENT] Webhook received:', req.body);
    res.status(200).send('OK');
  }
};

module.exports = PaymentController;
