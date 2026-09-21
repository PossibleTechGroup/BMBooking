const https = require('https');
const data = JSON.stringify({phone: '+251912345678', isRegistration: true, role: 'patient'});
const options = {
  hostname: 'bmbooking.possibletechplc.com',
  path: '/api/auth/request-otp',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
};
const req = https.request(options, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => { console.log('STATUS:', res.statusCode); console.log('BODY:', body.substring(0, 500)); process.exit(0); });
});
req.on('error', e => { console.error('ERROR:', e.message); process.exit(1); });
req.write(data);
req.end();
