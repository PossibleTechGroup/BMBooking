# 🌟 BM Booking: Ratings & Reviews Experience Guide

This guide explains how the **Doctor Ratings & Reviews** system works for Patients, Doctors, and Administrators. This feature is designed to build trust, improve healthcare quality, and help patients find the right specialists.

---

## 🤳 The Patient Experience

### 1. Discovery & Search
When a patient searches for a doctor, they no longer just see a list of names. They see **Trust Indicators**:
*   **Star Ratings**: Visible directly on the doctor cards in search results.
*   **Feedback Count**: Indicates how many other patients have shared their experiences (e.g., "4.8 ★ (120 Reviews)").
*   **Smart Filters**: Patients can filter the search to only show doctors with a specific minimum rating (e.g., "Show me doctors with 4+ stars").

### 2. The Doctor Profile
Inside the doctor's profile page, patients can read a dedicated **Community Feedback** section:
*   **Transparent Comments**: See honest feedback from other verified patients.
*   **Time Context**: Reviews are sorted by date, showing the most recent experiences first.
*   **Patient Privacy**: Only the patient's first name and initial are shown (e.g., "Abel T.") to protect privacy while maintaining authenticity.

### 3. Leaving a Review
After a **Completed Appointment**, patients are encouraged to leave feedback:
*   **Star Selection**: A simple 1-to-5 star rating for the overall experience.
*   **Written Comment**: A text box to share details about the consultation, bedside manner, or facility quality.

---

## 👨‍⚕️ The Doctor Experience

### 1. Performance Monitoring
Doctors can see their **Average Rating** prominently on their dashboard. This serves as a "Quality Score" that reflects their service level.

### 2. Feedback Loop
Doctors can view all comments left by their patients. This helps them:
*   Identify areas for improvement.
*   Understand patient needs better.
*   Build a strong professional reputation on the platform.

### 3. Growth & Visibility
The system rewards high-quality care. Doctors with higher ratings are:
*   **Ranked Higher**: Appear at the top of search results.
*   **More Trusted**: Experience a higher booking conversion rate as patients prefer providers with positive social proof.

---

## 🛡️ The Admin Experience

Administrators have a **Global View** of all platform feedback via the **"Reviews"** tab in the Admin Hub:

*   **Global Feed**: A real-time stream of every review posted across the entire system.
*   **Quality Oversight**: Admins can monitor for inappropriate content or suspicious activity.
*   **Drill-Down Analysis**: By clicking **"View Profile"** on any review, an admin can jump to the **Doctor's 360° Analysis** to see if a low rating is an isolated incident or part of a larger pattern (by looking at their full appointment history).

---

## ⚙️ Technical Summary for Developers

| Feature | Field | Data Source |
| :--- | :--- | :--- |
| **Search View** | `rating`, `totalReviews` | `DoctorProfile` Model |
| **Profile Feed** | `reviews[]` | `Review` Model (Joined) |
| **Patient Identity** | `patientProfile.fullName` | `User` -> `PatientProfile` |
| **Submission** | `doctorId`, `rating`, `comment` | `POST /api/reviews` |

---

> [!TIP]
> **Verified Reviews**: To ensure the highest quality of trust, only patients with a `COMPLETED` status on their appointment are eligible to submit a review for that specific consultation.
