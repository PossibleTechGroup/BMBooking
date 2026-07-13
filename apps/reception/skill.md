# Receptionist App Development Guidelines & Architectural Rules

**CRITICAL RULE:** Adhere strictly to the architectural rules listed below. Any pull request or code change that violates these patterns breaks codebase integrity and will be rejected.

---

## 1. Redux State Management Enforcement
All data fetching, network operations, caching, and global state management MUST be handled exclusively via Redux Toolkit slices (`src/store/slices/`).

- **No Direct API Requests:** UI components (`pages/` or `components/`) must never import the `client` Axios instance or perform raw `client.get`, `client.post`, `client.patch`, or `client.delete` calls.
- **No Axios Leakage / Error Handling:** Components must never import `axios` or use `isAxiosError` to parse server responses. Network errors must be intercepted, normalized into clean string messages within the Redux Thunk's `rejectWithValue`, and handled as standard JS error strings in component `catch` blocks or slice state.
- **Use Redux Thunks:** All asynchronous backend operations must reside in `createAsyncThunk` functions within their respective slices.
- **Data Hook Access:** UI views must query data solely through the `useSelector` hook and perform actions via `useDispatch`.

---

## 2. Component Modularization & State Design
Monolithic files degrade codebase maintainability. We enforce modular design patterns:

- **Component Decomposition:** No single view/page file should exceed 200–250 lines of code. Extract self-contained units (e.g., list views, calendar views, modals, cards) into dedicated sub-components.
- **Strict UI Responsibility:** UI components must focus solely on presentation and local user interaction states. They must not contain complex business or sorting logic.

---

## 3. Style Management Enforcement (Strict Style Separation)
Components should be highly readable and decluttered. Direct inline style objects (`style={{ ... }}`) are forbidden for primary component layouts.

- **Class-Based CSS:** All reusable styles (like overlays, containers, headers, inputs, buttons, slots) must be separated into dedicated `.css` stylesheet files (e.g., `Modal.css`, `index.css`) or CSS Modules.
- **Page Stylesheets:** Complex page-level styles must be modularized and imported from a separate styled styles file (like `AppointmentsPage.styles.ts`) using TypeScript-safe `CSSProperties`.
