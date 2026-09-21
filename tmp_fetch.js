const http = require('http');
// Test /api/doctors/profile without auth - should get JSON from backend
const urls = [
  '/api/doctors/profile',
  '/api/hospitals?t=123',
  '/api/auth/request-otp',
];
let done = 0;
urls.forEach(path => {
  const req = http.request({ hostname: '127.0.0.1', port: 53411, path, method: 'GET' }, res => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      const ct = res.headers['content-type'] || '';
      const isJson = ct.includes('json');
      console.log(`[${res.statusCode}] ${path} -> CT: ${ct}, isJson: ${isJson}, body: ${body.substring(0, 200)}`);
      if (++done === urls.length) process.exit(0);
    });
  });
  req.on('error', e => { console.error(`ERROR ${path}:`, e.message); if (++done === urls.length) process.exit(1); });
  req.end();
});
