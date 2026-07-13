# BM Booking - Patient Appointment Journey Guide

This guide describes the end-to-end journey for a patient in BM Booking. Use this to implement the frontend logic and integrate with the backend APIs.

---

## 1. Doctor Discovery & Rich Media
The frontend should provide a premium discovery experience:
- **Profile Media**: Each doctor has a `profilePicture` and an `introVideo`. 
  - Render the video using `expo-av` in a small preview or a dedicated "Bio" section.
- **Rich Profiles**: Display the doctor's specialization, years of experience, clinic address, and a list of languages they speak.
- **Ratings & Reviews**: Show the rating (e.g., 4.9) and total number of reviews.

---

## 2. Smart Booking & Availability
- **Availability JSON**: Fetch the doctor's profile to get the `availability` field. This is a JSON object containing working hours/days.
- **Step A (Categorization)**: User selects an issue (e.g., Orthopedics).
- **Step B (Recommendation Engine)**: 
  - Call `GET /api/appointments/recommendations/:category`.
  - Show the "Promotion Prompt" (e.g., "Do you have an MRI?").
  - This step is critical for medical readiness.

---

## 3. Payment Integration (Chapa SDK)
Every appointment requires a pre-payment using the **Chapa SDK**.

### Test Credentials
Use these keys for implementing and testing the payment flow:
- **Public Key**: `CHAPUBK_TEST-LUXcfuTl4WlCCWX3vOHKb3lx57Rz3KTa`
- **Currency**: `ETB`

### Implementation Logic
1. **Fetch Fee**: Get `appointmentFee` from the doctor's profile.
2. **Initiate Chapa**: On the "Confirm" step, call the Chapa SDK with the fee and public key.
3. **Capture Reference**: Once the payment is successful, capture the `transaction_id` or `reference`.
4. **Submit Appointment**: Call `POST /api/appointments` only after the payment is confirmed.

---

## 4. Notifications & Status Tracking
Patients are notified of their appointment progress through the **Appointments Tab**.

- **Status Polling**: The frontend should poll `GET /api/appointments/my` every 30-60 seconds.
- **Live Statuses**:
  - `pending`: Waiting for doctor review.
  - `accepted`: Doctor has confirmed. **UI MUST show the Queue Position (e.g. #3).**
  - `declined`: Show the `declineReason` provided by the doctor.
  - `completed`: Visit is finished.
- **Notification Bubbles**: Use the `TelegramBubble` component to show status changes (e.g., "Dr. Abel accepted your appointment!").

---

## 5. Search & Filter Spec
Implement the following in the `Doctors` tab:
- **Search**: Filters by `name`, `specialty`, and `hospital`.
- **Advanced Filters**: 
  - Rating: 3.5+, 4.0+, 4.5+
  - Experience: 5+, 10+, 15+ years
  - Fee: $0-$100, $100-$150, $150+

---

## 6. Postman Collection (Frontend Ready)

```json
{
	"info": {
		"name": "BM Booking - Patient Frontend API",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Find Doctors",
			"request": {
				"method": "GET",
				"url": "{{host}}/api/doctors/profile"
			}
		},
		{
			"name": "Get Recommendations",
			"request": {
				"method": "GET",
				"url": "{{host}}/api/appointments/recommendations/orthopedics"
			}
		},
		{
			"name": "Submit Paid Appointment",
			"request": {
				"method": "POST",
				"header": [
					{ "key": "Authorization", "value": "Bearer {{token}}" }
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"doctorId\": 1,\n    \"dateTime\": \"2026-05-20T10:30:00Z\",\n    \"fee\": 250.00,\n    \"reason\": \"Back Pain\",\n    \"issueCategory\": \"orthopedics\",\n    \"notes\": \"Notes here...\",\n    \"isPaid\": true\n}",
					"options": { "raw": { "language": "json" } }
				},
				"url": "{{host}}/api/appointments"
			}
		},
		{
			"name": "Track Queue Status",
			"request": {
				"method": "GET",
				"header": [
					{ "key": "Authorization", "value": "Bearer {{token}}" }
				],
				"url": "{{host}}/api/appointments/my"
			}
		}
	],
	"variable": [
		{ "key": "host", "value": "http://localhost:5000" },
		{ "key": "token", "value": "your_token_here" }
	]
}
```


