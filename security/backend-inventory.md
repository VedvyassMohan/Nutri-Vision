# Backend Architecture & Technology Inventory — Nutri-Vision

## 1. Technology Stack

- **Programming Language:** JavaScript (Node.js ES Modules)
- **Framework:** Express.js v5.2.1
- **Runtime Environment:** Node.js v20+ / v22+
- **Database Engine:** SQLite3 (embedded file-based `server/nutrivision.db`)
- **Package Manager:** npm

---

## 2. API Architecture & Endpoint Inventory

- **Architecture:** Layered REST API Service
- **Authentication:** Local Session / Token-based User Identification
- **Endpoints:**
  - `GET /api/health` — Service Liveness Check
  - `POST /api/auth/login` — User Authentication
  - `POST /api/auth/register` — User Registration
  - `GET /api/meals` — Fetch Daily Logged Meals
  - `POST /api/meals` — Log New Meal with Calorie & Macro Calculations
  - `DELETE /api/meals/:id` — Delete Logged Meal Item
  - `GET /api/user/profile` — User Nutrition Goals & Theme Preferences
  - `PUT /api/user/profile` — Update Target Macros & Theme

---

## 3. Machine Learning & Vision Service Integration

- **Model Base:** MobileNetV2 Feature Extractor (`@tensorflow/tfjs` + `@tensorflow-models/mobilenet`)
- **Classification Head:** Custom 3-Layer Dense + BatchNorm Head trained on 2,400 Indian Food Images (80 Classes)
- **Inference Pipeline:** Local Client & Node.js Inference via `nutritionVisionService.js` using weight matrices (`head_weights.json`).
