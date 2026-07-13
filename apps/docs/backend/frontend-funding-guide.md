# MedConnect Funding & Wallet: Frontend Integration Guide

This document provides the technical specifications for frontend developers to integrate the **Funding, Wallet, and Payout** systems into the BM Booking Mobile (Doctor) and Admin Dashboard.

---

## 1. The "Doctor Safety Lock" (Mandatory Setup)

To ensure financial compliance, doctors are **blocked** from professional features until they provide valid bank details.

### 🚩 Detection Logic
If a doctor attempts to use a professional route (Availability, Appointments, Wallet) without bank details, the API returns:
- **Status Code:** `403 Forbidden`
- **Error Code:** `PAYMENT_METHOD_REQUIRED`

**Frontend Action:** Catch this error globally. If received, redirect the doctor to the **"Bank Details Setup"** screen.

---

## 2. Wallet & Transactions

### GET `/api/wallet`
Fetch the doctor's current balance and recent transaction history.

**Response Structure:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "balance": "1250.00",
    "transactions": [
      {
        "id": 10,
        "amount": "500.00",
        "type": "CREDIT",
        "description": "Earnings from Appointment #45",
        "createdAt": "2026-05-12T10:00:00Z"
      }
    ]
  }
}
```

---

## 3. Withdrawal Requests (Doctor App)

### POST `/api/wallet/withdraw`
Request to transfer funds to the bank account on file.

**Request Body:**
```json
{
  "amount": 500,
  "bankName": "CBE",
  "accountNumber": "100012345678",
  "accountName": "Abel Tesfaye"
}
```

---

## 4. Admin Payout Processing (Dashboard)

Admins must review requests and provide proof of transfer to complete the payout.

### GET `/api/admin/withdrawals`
List all withdrawal requests across the platform.

### POST `/api/admin/withdrawals/:id/complete`
Mark a payout as done. **Requires a multipart/form-data upload.**

**Form Fields:**
- `receipt`: (File) Photo/Screenshot of the bank transfer receipt.
- `referenceId`: (String) The bank's transaction reference code.

---

## 5. Appointment Integration

Earnings are automated. When the doctor marks an appointment as completed, the funds move instantly.

### POST `/api/appointments/:id/complete` (Conceptual)
Completing an appointment triggers a server-side `CREDIT` to the doctor's wallet.

---

## 🎨 UI/UX Design Tips
- **Wallet Screen:** Use a clean "Claude-style" card for the balance. Show `ETB` (Ethiopian Birr) clearly.
- **Transaction List:** Use green for `CREDIT` and red for `DEBIT` (Withdrawals).
- **Withdrawal Modal:** Show a "Transferring..." state while the request is pending.
- **Admin Dashboard:** Use the `lucide-react` icons (Camera, FileCheck) for the receipt upload process.
