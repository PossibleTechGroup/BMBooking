# ⭐ Doctor Ratings & Reviews System

This system allows patients to rate and review doctors, helping the BM Booking community find the best healthcare providers.

## 🚀 Key Features
*   **Star Ratings (1-5)**: Patients can rate their experience after a consultation.
*   **Written Reviews**: Detailed feedback to share specific experiences.
*   **Live Average Rating**: Doctors' profiles show a weighted average rating and total review count.
*   **Search Integration**: Patients can filter doctors by a "Minimum Rating" (e.g., only show doctors with 4+ stars).
*   **Speciality Filtering**: Combined search for speciality and rating for precise discovery.

---

## 📡 API Usage Guide

### 1. Submitting a Review
**Endpoint**: `POST /api/reviews`  
**Authentication**: Required (Patient Token)

**Request Body**:
```json
{
  "doctorId": 5,
  "rating": 5,
  "comment": "Excellent care and very knowledgeable!"
}
```

### 2. Fetching Reviews for a Doctor
**Endpoint**: `GET /api/reviews/doctor/:id`  
**Authentication**: Public

**Response Example**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Amazing doctor!",
      "createdAt": "2024-05-16T10:00:00Z",
      "patient": {
        "patientProfile": {
          "fullName": "Abel T."
        }
      }
    }
  ]
}
```

### 3. Advanced Doctor Search
**Endpoint**: `GET /api/doctors/search`  
**Parameters**:
*   `specialty`: Filter by field (e.g., `Cardiology`)
*   `minRating`: Minimum stars (e.g., `4.5`)
*   `name`: Search by doctor's name

---

## 🛠️ How it Works (Technical Details)
1.  **Atomic Updates**: Every time a review is posted, the backend uses an aggregate query to find the new average for that specific doctor.
2.  **Schema Integrity**: Ratings are stored on the `DoctorProfile` model for rapid sorting, while individual logs are kept in the `Review` model for historical data.
3.  **Frontend Implementation**:
    *   **Mobile**: Use the `rating` and `totalReviews` fields from the doctor object to display stars in the search results.
    *   **Review Section**: Map through the reviews array on the doctor's detail page to show community feedback.

---

## 🛡️ Best Practices
*   **Booking History**: It is recommended to only allow reviews from patients who have had a `completed` appointment with the doctor (can be enforced in the controller if desired).
*   **Moderation**: Use the `comment` field carefully; you can add a reporting feature later if needed.
