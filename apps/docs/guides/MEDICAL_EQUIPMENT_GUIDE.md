# Medical Tools Finder — Feature Guide (Simplified)

The **Medical Tools Finder** lets patients discover medical machinery at hospitals. Each tool belongs to a **Hospital** record (name, address, map coordinates, **visit card price** in ETB).

See also: [HOSPITAL_ADMIN_GUIDE.md](HOSPITAL_ADMIN_GUIDE.md)

---

## 🌟 Overview

Admins create **hospitals** first (with card price and location), then **post tools** linked via `hospitalId`. Reception can update their hospital’s card price. Users search tools and see hospital name, contact, and location on each card.

---

## 🚀 Key Features

### 1. Mobile Application (Patient/Doctor View)
*   **Medical Tools Tab**: Premium search interface for MRI, Dialysis, and more.
*   **Direct Details**: Each tool card shows the hospital name and address immediately.
*   **One-Tap Actions**: Call the facility directly (+251 format) or open its location in **Google Maps**.
*   **Tool Alerts**: Real-time broadcasts for newly available machinery.

### 2. Admin Dashboard (Web View)
*   **Hospitals & Staff**: Create hospitals (with card price), assign receptionists.
*   **Medical Tools**: Post tools with a required hospital (select existing or create new in a popup).
*   **Broadcast Alerts**: Optional hospital filter; push notifications to all users.

---

## 🛠 Technology Stack

*   **Backend**: Node.js, Express, Prisma ORM.
*   **Mobile**: React Native (Expo), Redux Toolkit, React Native Maps.
*   **Web**: React (Vite), Redux Toolkit, Lucide Icons.
*   **Maps**: Google Maps API Integration.

---

## 📊 Database Schema (Flattened)

The model is now streamlined into a single primary record:

| Model | Key Fields |
|-------|-------------|
| **MedicalEquipment** | Name, Category, **Hospital Name**, **Hospital Phone**, Lat/Lng, City, Address. |
| **EquipmentAnnouncement**| Title, Message, Category, Hospital Name. |

---

## 🧪 Seeding & Data

The seed script (`backend/prisma/seed.js`) has been updated:
*   **Format**: All phone numbers are prefixed with `+251`.
*   **Items**: High-quality tools at Black Lion, St. Paul's, and Landmark hospitals.

---

## 📖 How to Use

### For Admins
1.  Navigate to **"Medical Tools"** in the sidebar.
2.  Click **"Post New Tool"**.
3.  Enter the tool details and the hospital where it's located.
4.  Navigate to **"Announce"** to broadcast availability.

### For Users
1.  Open the **"Equipment"** tab.
2.  Search by city or filter by tool type.
3.  Tap a tool to see the **Google Map** and **Call** the hospital.

---

## ✅ Test Scenarios

*   **Scenario A**: Add a new "MRI" tool and specify "Tikur Anbessa" and its coordinates. Verify it appears on the mobile map.
*   **Scenario B**: Tap the "Call Center" button on a tool detail page and verify it dials the `+251` number.
*   **Scenario C**: Verify that deleting a tool in the Admin panel removes it instantly from the mobile search results.
