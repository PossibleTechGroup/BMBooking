    # 🔐 BM Booking Login Guide

    This guide explains how to access different parts of the BM Booking ecosystem.

    ---

    ## 📱 Mobile App (Doctors & Patients)
    The mobile app uses a **Passwordless OTP (One-Time Password)** system for maximum security and ease of use.

    ### 1. Requesting Access
    1. Open the BM Booking on your device.
    2. Select your role: **Doctor** or **Patient**.
    3. Enter your **Ethiopian Phone Number** (e.g., `0911223344`).
    4. Tap **"Send OTP"**.a

    ### 2. Verification
    1. You will receive a 6-digit code via SMS (or simulated in development logs).
    2. Enter the 6-digit code into the app.
    3. Tap **"Verify & Login"**.

    ### 3. First-Time Users (Onboarding)
    - **Doctors**: If you are new, you will be directed to the **Profile Setup** (License, Specialty, Clinic info). Once submitted, your account remains "Pending" until the Admin approves you.
    - **Patients**: You will be directed to enter your basic profile information.

    ---

    ## 🖥️ Admin Dashboard
    The dashboard is used by the medical board to manage doctors and verify payouts.

    ### 1. Accessing the Dashboard
    - **URL**: `http://localhost:5173` (Local Development) or the production domain provided by the DevOps team.

    ### 2. Credentials
    | Field | Value |
    | :--- | :--- |
    | **Email** | `admin@bm-booking.com` |
    | **Password** | `Password@123` |

    ### 3. Key Admin Actions
    - **Approve Doctors**: Go to the "Pending" tab to review licenses and approve/reject doctors.
    - **Process Payouts**: Review withdrawal requests and upload bank transfer receipts to finalize payments.

    ---

    ## 👨‍💻 Developer Notes (Backend Integration)
    If you are testing via Postman or integrating a new frontend:

    - **OTP Request**: `POST /api/auth/request-otp`
    - **OTP Verify**: `POST /api/auth/verify-otp` (Returns a Bearer Token)
    - **Admin Login**: `POST /api/auth/admin-login`

    > [!IMPORTANT]
    > Ensure the Backend Server is running (`npm run dev` in the `backend` folder) before attempting to login.
