# 🏥 Medical Equipment Finder: Frontend Implementation Guide

This guide is for the **Frontend Agent** responsible for implementing the mobile UI in the BM Booking.

## 🏗️ Architecture Overview
The system has been refactored from a hospital-centric model to a flattened **Item-Centric** model. This allows for rapid inventory updates without managing complex facility infrastructure.

### Data Structure (`MedicalEquipment`)
Each tool (MRI, CT Scan, etc.) stores its own location and facility metadata directly:
```typescript
{
  id: number;
  name: string;           // e.g., "Siemens 3T MRI"
  category: string;       // MRI, CT_SCAN, DIALYSIS, etc.
  hospitalName: string;   // The facility where it's located
  hospitalPhone: string;  // Contact for booking (+251 format)
  address: string;        // Physical address
  city: string;           // City (e.g., "Addis Ababa")
  latitude: number;       // GPS Coordinate
  longitude: number;      // GPS Coordinate
  photo: string | null;   // Image URL
  description: string;    // Special instructions or notes
  isOperational: boolean; // Availability status
}
```

---

## 📡 API Endpoints

### 1. Equipment Discovery
*   **GET `/api/equipment/search`**
    *   **Query Params**: `category`, `city`, `isOperational`
    *   **Usage**: The main feed for users to find tools.
*   **GET `/api/equipment/categories`**
    *   **Usage**: Populates the category filter chips at the top of the mobile screen.
*   **GET `/api/equipment/detail/:id`**
    *   **Usage**: Full data for the Item Detail screen.

### 2. Broadcasts (Announcements)
*   **GET `/api/equipment/announcements`**
    *   **Usage**: Real-time alerts for tool availability. These are displayed in the app's notification center or home feed.

---

## 📱 Mobile UI Components (Requested)

### 1. Discovery Tab (`app/(tabs)/equipment.tsx`)
*   **Filters**: Horizontal scroll of categories (MRI, CT Scan, etc.).
*   **Search**: City-based filtering (e.g., search for "Addis Ababa").
*   **List**: Cards showing Tool Name, Hospital Name, and an "Available/Busy" badge.

### 2. Detail Screen (`app/item-detail.tsx`)
*   **Header**: High-quality photo of the tool.
*   **Status Badge**: Pulsing "Available" or "Busy" status.
*   **Map Integration**: Use `react-native-maps` to show a pin at `latitude/longitude`.
*   **Action Buttons**:
    *   **📞 Call Facility**: Triggers `Linking.openURL('tel:' + hospitalPhone)`.
    *   **📍 Directions**: Opens Google Maps or Apple Maps to the coordinates.

---

## 🔔 Push & SMS Notifications
When an admin creates an announcement:
1.  **Push**: Sent via Expo Push Service.
2.  **SMS**: Sent via **AfroMessage** to the user's phone number.
*   **Payload**: Includes `title`, `message`, and `hospitalName`.

---

## 🛠️ Testing the Flow
1.  **Admin**: Use the Dashboard to post a tool. Use the **Google Maps search** to set the location.
2.  **Mobile**: The tool should appear in the "Equipment" tab.
3.  **Admin**: Create an announcement.
4.  **Mobile**: User receives a push notification. The test user `+251978458870` receives an SMS.

---

### Implementation Tips for Agent:
*   Use the `equipmentSlice.ts` in Redux to manage the global list.
*   Ensure the `hospitalPhone` always has a click-to-call handler.
*   The `latitude` and `longitude` are floats; ensure the map component handles them correctly.
