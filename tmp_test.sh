curl -s -X POST http://localhost:5000/api/auth/request-otp -H 'Content-Type: application/json' -d '{"phone":"+251912345678","isRegistration":true,"role":"patient"}'
