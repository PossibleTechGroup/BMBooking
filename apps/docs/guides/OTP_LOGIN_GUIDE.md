# 📲 OTP Login Integration Guide

Use this guide to implement the passwordless phone login flow.

---

## 1. Request OTP
**Endpoint**: `POST /api/auth/request-otp`

**Payload (Existing User / Login)**:
```json
{
  "phone": "0911223344"
}
```
*Note: Backend will automatically detect the user's role.*

**Payload (New User / Registration)**:
```json
{
  "phone": "0911223344",
  "role": "doctor", 
  "isRegistration": true
}
```

---

## 2. Verify OTP
**Endpoint**: `POST /api/auth/verify-otp`

**Payload**:
```json
{
  "phone": "0911223344",
  "code": "123456"
}
```

**Success Response**:
```json
{
  "status": "success",
  "data": {
    "token": "JWT_TOKEN_HERE",
    "user": {
      "id": 1,
      "phone": "0911223344",
      "role": "doctor"
    }
  }
}
```

---

## 🛠️ Development & Testing
Since real SMS requires a gateway (Twilio/InfoBip), use the **Development Simulation**:

1. Start the backend: `npm run dev`
2. After calling `request-otp`, check your **Terminal Console**.
3. Look for a line like: `[OTP Simulation] Code for 0911223344 is: 123456`
4. Use that code to complete the login.

---

## 🔒 Security Headers
For all subsequent requests (Profile, Wallet, etc.), include the token in the header:
`Authorization: Bearer <JWT_TOKEN_HERE>`
