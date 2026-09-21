const http = require('http');
const data = JSON.stringify({phone: '+251912345678', isRegistration: true, role: 'patient'});
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/request-otp',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => { console.log('STATUS:', res.statusCode); console.log('BODY:', body.substring(0, 500)); process.exit(0); });
});
req.write(data);
req.end();
