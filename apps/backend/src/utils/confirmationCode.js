const crypto = require('crypto');

function generateConfirmationCode() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(now);
  const [yyyy, mm, dd] = dateStr.split('-');
  const yy = yyyy.slice(2);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `KTR${yy}${mm}${dd}${rand}`;
}

module.exports = { generateConfirmationCode };
