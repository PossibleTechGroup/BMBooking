const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function computeDataCheckString(data) {
  const pairs = Object.keys(data)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${data[k]}`);
  return pairs.join('\n');
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function verifyTelegramInitData(initData, botToken) {
  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) return { ok: false, reason: 'Missing hash' };

  const dataCheckString = computeDataCheckString(data);
  const secretKey = hmacSha256('WebAppData', botToken); // per Telegram docs
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Timing-safe compare
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(hash, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'Invalid hash' };
  }

  // Optional freshness check (default: 24h)
  const authDate = Number(data.auth_date || 0);
  const maxAgeSeconds = Number(process.env.TELEGRAM_INITDATA_MAX_AGE_SECONDS || 86400);
  const now = Math.floor(Date.now() / 1000);
  if (authDate && now - authDate > maxAgeSeconds) {
    return { ok: false, reason: 'initData expired' };
  }

  let user = null;
  try {
    if (data.user) user = JSON.parse(data.user);
  } catch {
    user = null;
  }

  return { ok: true, user, data };
}

const TelegramController = {
  verify: async (req, res) => {
    try {
      const { initData } = req.body || {};
      if (!initData) {
        return res.status(400).json({ status: 'fail', message: 'initData is required' });
      }
      const botToken = process.env.BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ status: 'error', message: 'BOT_TOKEN is not configured on backend' });
      }

      const result = verifyTelegramInitData(initData, botToken);
      if (!result.ok) {
        return res.status(401).json({ status: 'fail', message: result.reason || 'Unauthorized' });
      }

      const jwtSecret = process.env.JWT_SECRET || 'supersecret';
      const payload = {
        tg: {
          id: result.user?.id,
          username: result.user?.username,
          first_name: result.user?.first_name,
          last_name: result.user?.last_name,
        },
      };
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });

      return res.status(200).json({
        status: 'success',
        data: {
          token,
          telegramUser: result.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

module.exports = TelegramController;

