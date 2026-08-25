// Shared in-memory ledger of completed Telebirr orders.
// Populated by /api/payments/telebirr-notify (called by telebirr-h5-integration
// when Telebirr confirms a payment). Consumed server-side when a paid booking
// is actually created, so one payment can only ever be used for one booking.

const paidOrders = new Map(); // orderId -> { orderId, amount, transactionId, paidAt }

const normAmount = (amount) => Math.round(Number(amount) * 100) / 100;

const TelebirrLedger = {
  record: ({ orderId, status, amount, transactionId }) => {
    if (!orderId || !(status === 'Completed' || status === 'SUCCESS')) return false;
    paidOrders.set(orderId, {
      orderId,
      amount: String(normAmount(amount)),
      transactionId,
      paidAt: new Date().toISOString(),
    });
    return true;
  },

  // Non-destructive check (used by /api/payments/verify-telebirr)
  findByOrderId: (orderId) => paidOrders.get(orderId) || null,

  // Non-destructive check (used by /api/payments/verify-telebirr)
  findByAmount: (amount) => {
    const target = normAmount(amount);
    for (const entry of paidOrders.values()) {
      if (normAmount(entry.amount) === target) return entry;
    }
    return null;
  },

  // Destructive check: removes and returns one matching paid order so it
  // cannot be reused for a second booking.
  consumeByAmount: (amount) => {
    const target = normAmount(amount);
    for (const [orderId, entry] of paidOrders.entries()) {
      if (normAmount(entry.amount) === target) {
        paidOrders.delete(orderId);
        return entry;
      }
    }
    return null;
  },
};

module.exports = TelebirrLedger;
