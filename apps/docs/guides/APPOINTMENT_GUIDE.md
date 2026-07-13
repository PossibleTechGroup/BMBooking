# BM Booking Appointment Documentation

## 🩺 DOCTOR-ONLY APPOINTMENT GUIDE (Quick Start)
*For Frontend Developers & Integration Testing*

This section summarizes the doctor-specific workflow for managing the patient journey within the mobile app.

### 1. Appointment Triage (Accept/Decline)
- **Pending List**: Doctors see incoming requests in a "Pending" list. 
- **Declining**: Doctors can decline a request but **must** provide a reason (e.g., "Out of office", "Conflict"). This reason is sent back to the patient.

### 2. Patient Consultation & Payment
- **Consultation**: The doctor treats the patient.
- **Marking Complete**: Once the visit is over, the doctor marks it "Completed". This is a **critical action** as it triggers the automated transfer of the consultation fee to the doctor's wallet.

### 3. External Forwarding (Sharing)
- **Context**: Doctors often need to send their schedule to receptionists or assistants who do **not** use the app.
- **Mechanism**: The app generates a formatted text list (for SMS/WhatsApp/Telegram) or a CSV file (for Excel). This allows the doctor to forward the daily schedule to any external person in seconds.

---

## 🏥 PATIENT APPOINTMENT GUIDE (Quick Start)
*For Frontend Developers & Integration Testing*

This section summarizes the patient-specific workflow for booking and tracking medical consultations.

### 1. Smart Issue Selection
- **Categories**: Patients don't just book a "doctor"; they start by selecting an **issue category** (e.g., Dental, Orthopedics, Cardiology).
- **Recommendations**: Based on the selected category, the system provides a checklist of **recommended documents** (e.g., "Do you have a recent MRI?"). This ensures the patient arrives prepared for the visit.

### 2. Booking Request
- **Availability**: Patients pick a date and time from the doctor's available slots.
- **Context**: Patients can add additional notes or symptoms to the request to give the doctor context before they even meet.

### 3. Appointment Outcomes
- **Accepted**: Patient prepares for the visit.
- **Declined**: If a doctor declines, the patient sees the specific **Decline Reason** (e.g., "Doctor has an emergency").
- **Completed**: Once finished, the visit history moves to the "Completed" tab for future reference.

---

## 1. System Overview
The system facilitates a multi-step workflow:
1. **Patient Discovery**: Patients select an issue category.
2. **Recommendation**: System suggests documents (MRI, X-ray) based on the issue.
3. **Booking**: Patient requests a slot.
4. **Doctor Triage**: Doctor accepts or declines from the mobile app.
5. **Completion**: Doctor marks appointment as done, triggering payment to their wallet.

---

## 2. Sharing & External Forwarding
The system is designed for doctors to easily share their daily schedule or patient lists with people **outside the app** (e.g., receptionists, assistants, or clinics).

### Available Channels
- **SMS / iMessage**: Forwards a formatted text list of today's patients.
- **WhatsApp / Telegram**: Opens the respective app with a pre-filled, formatted message including patient names, contact numbers.
- **Excel (CSV)**: Generates a `.csv` file that can be opened in Excel or Google Sheets.
- **Native Share**: Uses the system share sheet to send data to Email, Notes, or any other installed app.

### Technical Implementation
Sharing is handled client-side in the mobile app using `expo-sharing` and `expo-file-system`. The data is fetched from the `GET /api/appointments/doctor/export` endpoint.

---

## 3. Recommendation Engine
Located in `backend/src/config/recommendations.config.js`. It maps medical categories to required/suggested documentation.

| Category | Icon | Suggested Docs |
|----------|------|----------------|
| Dental | `happy-outline` | Dental X-Ray, Treatment History |
| Cardiology | `heart-outline` | ECG/EKG, Echo, Lipid Panel |
| Orthopedics | `body-outline` | MRI, X-Ray, CT Scan |
| Neurology | `flash-outline` | Brain MRI, EEG, CT Scan |

---

## 4. API Route Reference

### Base URL: `{{host}}/api/appointments`

#### Public / Discovery
- `GET /categories`: List all medical categories.
- `GET /recommendations/:category`: Get suggested docs for a category.

#### Patient Endpoints (Requires 'patient' role)
- `POST /`: Book an appointment.
  - Body: `{ doctorId, dateTime, fee, reason, issueCategory, notes, attachments: [] }`
- `GET /my`: Get my appointment history.

#### Doctor Endpoints (Requires 'doctor' role)
- `GET /doctor`: Get all appointments (Filter by `status` or `date`).
- `PATCH /api/doctors/fee`: Set/Update consultation fee. Body: `{ "fee": 150 }`.
- `GET /doctor/calendar`: Get monthly appointment counts (for calendar dots).
- `GET /doctor/stats`: Dashboard stats (Today's count, pending requests).
- `GET /doctor/export`: Fetch patient list formatted for external sharing.
- `PATCH /:id/accept`: Move a pending request to 'accepted'.
- `PATCH /:id/decline`: Reject request. Body: `{ reason: "..." }`.
- `PATCH /:id/complete`: Finalize visit and receive payment.

---

## 5. Postman Collection (v2.1)

Copy the JSON below, save it as `bm_appointments.postman_collection.json`, and import it into Postman.

```json
{
	"info": {
		"_postman_id": "8b2a5d1c-3e4f-4a5b-9c8d-7e6f5a4b3c2d",
		"name": "BM Booking - Appointments",
		"description": "Collection for testing Patient-Doctor Appointment Handling",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Discovery",
			"item": [
				{
					"name": "Get Categories",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{host}}/api/appointments/categories",
							"host": ["{{host}}"],
							"path": ["api", "appointments", "categories"]
						}
					}
				},
				{
					"name": "Get Recommendations",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{host}}/api/appointments/recommendations/orthopedics",
							"host": ["{{host}}"],
							"path": ["api", "appointments", "recommendations", "orthopedics"]
						}
					}
				}
			]
		},
		{
			"name": "Patient",
			"item": [
				{
					"name": "Book Appointment",
					"request": {
						"method": "POST",
						"header": [
							{ "key": "Authorization", "value": "Bearer {{token}}", "type": "text" }
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"doctorId\": 1,\n    \"dateTime\": \"2026-05-20T10:30:00Z\",\n    \"fee\": 150.00,\n    \"reason\": \"Knee Pain\",\n    \"issueCategory\": \"orthopedics\",\n    \"notes\": \"Suffering for 2 weeks\",\n    \"attachments\": [\"uploads/mri_scan.pdf\"]\n}",
							"options": { "raw": { "language": "json" } }
						},
						"url": {
							"raw": "{{host}}/api/appointments",
							"host": ["{{host}}"],
							"path": ["api", "appointments"]
						}
					}
				},
				{
					"name": "My Appointments",
					"request": {
						"method": "GET",
						"header": [
							{ "key": "Authorization", "value": "Bearer {{token}}", "type": "text" }
						],
						"url": {
							"raw": "{{host}}/api/appointments/my",
							"host": ["{{host}}"],
							"path": ["api", "appointments", "my"]
						}
					}
				}
			]
		},
		{
			"name": "Doctor",
			"item": [
				{
					"name": "Doctor Dashboard Stats",
					"request": {
						"method": "GET",
						"header": [
							{ "key": "Authorization", "value": "Bearer {{token}}", "type": "text" }
						],
						"url": {
							"raw": "{{host}}/api/appointments/doctor/stats",
							"host": ["{{host}}"],
							"path": ["api", "appointments", "doctor", "stats"]
						}
					}
				},
				{
					"name": "Accept Appointment",
					"request": {
						"method": "PATCH",
						"header": [
							{ "key": "Authorization", "value": "Bearer {{token}}", "type": "text" }
						],
						"url": {
							"raw": "{{host}}/api/appointments/1/accept",
							"host": ["{{host}}"],
							"path": ["api", "appointments", "1", "accept"]
						}
					}
				},
				{
					"name": "Complete Appointment",
					"request": {
						"method": "PATCH",
						"header": [
							{ "key": "Authorization", "value": "Bearer {{token}}", "type": "text" }
						],
						"url": {
							"raw": "{{host}}/api/appointments/1/complete",
							"host": ["{{host}}"],
							"path": ["api", "appointments", "1", "complete"]
						}
					}
				},
				{
					"name": "Export Data",
					"request": {
						"method": "GET",
						"header": [
							{ "key": "Authorization", "value": "Bearer {{token}}", "type": "text" }
						],
						"url": {
							"raw": "{{host}}/api/appointments/doctor/export?date=2026-05-12",
							"host": ["{{host}}"],
							"path": ["api", "appointments", "doctor", "export"],
							"query": [
								{ "key": "date", "value": "2026-05-12" }
							]
						}
					}
				}
			]
		}
	],
	"event": [
		{
			"listen": "prerequest",
			"script": { "type": "text/javascript", "exec": [""] }
		},
		{
			"listen": "test",
			"script": { "type": "text/javascript", "exec": [""] }
		}
	],
	"variable": [
		{ "key": "host", "value": "http://localhost:5000", "type": "string" },
		{ "key": "token", "value": "your_jwt_here", "type": "string" }
	]
}
```
