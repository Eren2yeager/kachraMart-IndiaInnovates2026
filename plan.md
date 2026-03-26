# ♻️ Waste-to-Resource Exchange Platform (AI + IoT + Marketplace)

## 🎯 Objective

Build a **full-stack AI-powered circular waste management system** that:

* Classifies waste using AI (Roboflow)
* Manages pickup logistics (collectors)
* Tracks waste lifecycle end-to-end
* Stores waste in hubs (inventory system)
* Enables dealers to purchase waste (marketplace)
* Provides analytics for admin

---

# 🧠 SYSTEM DESIGN OVERVIEW

## Core Flow

```
Citizen → Upload Waste → AI Classification → Create Request
→ Assign Collector → Pickup → Transport → Waste Hub
→ Inventory → Dealer Purchase → Processing → Analytics
```

---

# 🧱 DATABASE DESIGN (STRICT SCHEMA)

## 1. User Model

```js
User {
  _id
  name: String
  email: String (unique)
  password: String
  role: "citizen" | "collector" | "dealer" | "admin"

  phone: String
  avatar: String

  location: {
    type: "Point",
    coordinates: [lng, lat]
  }

  isVerified: Boolean
  createdAt
}
```

---

## 2. Waste Listing Model

```js
WasteListing {
  _id
  userId: ObjectId (ref: User)

  imageUrl: String
  detectedClass: String
  category: "biodegradable" | "recyclable" | "hazardous" | "ewaste" | "construction"

  quantity: Number (kg)
  description: String

  pickupLocation: {
    address: String
    coordinates: [lng, lat]
  }

  status: 
    "created" |
    "classified" |
    "collector_assigned" |
    "picked_up" |
    "in_transit" |
    "at_hub" |
    "listed_for_sale" |
    "sold"

  assignedCollector: ObjectId (ref: User)

  createdAt
  updatedAt
}
```

---

## 3. Collector Task Model

```js
CollectorTask {
  _id
  collectorId: ObjectId (ref: User)
  wasteId: ObjectId (ref: WasteListing)

  status:
    "assigned" |
    "accepted" |
    "on_the_way" |
    "picked" |
    "delivered"

  route: {
    distance: Number
    estimatedTime: Number
    polyline: String
  }

  startedAt
  completedAt
}
```

---

## 4. Waste Inventory (Hub Storage)

```js
WasteInventory {
  _id
  wasteId: ObjectId (ref: WasteListing)

  hubId: String
  category: String

  quantity: Number
  qualityScore: Number

  status:
    "stored" |
    "available" |
    "reserved" |
    "sold"

  storedAt
}
```

---

## 5. Dealer Order Model

```js
Order {
  _id
  dealerId: ObjectId (ref: User)

  items: [
    {
      inventoryId: ObjectId
      quantity: Number
      pricePerKg: Number
    }
  ]

  totalAmount: Number

  status:
    "requested" |
    "approved" |
    "in_delivery" |
    "completed"

  createdAt
}
```

---

## 6. Reward Model (Citizen Incentives)

```js
Reward {
  _id
  userId: ObjectId

  points: Number
  reason: String

  wasteId: ObjectId

  createdAt
}
```

---

# 🔌 API CONTRACTS (STRICT)

## AUTH

POST `/api/auth/register`
POST `/api/auth/login`

---

## AI PREDICTION

POST `/api/predict`

Input:

```json
{ "image": "base64 or file" }
```

Output:

```json
{
  "class": "plastic bottle",
  "category": "recyclable",
  "confidence": 0.92
}
```

---

## WASTE

POST `/api/waste/create`
GET `/api/waste/my`
GET `/api/waste/:id`

PATCH `/api/waste/status`

---

## COLLECTOR

GET `/api/collector/tasks`
PATCH `/api/collector/update-status`

---

## INVENTORY

POST `/api/inventory/add`
GET `/api/inventory`

---

## MARKETPLACE

GET `/api/marketplace`
POST `/api/order/create`

---

## ADMIN

GET `/api/admin/analytics`

---

# ⚙️ BUSINESS LOGIC RULES

## Waste Lifecycle

```
created → classified → collector_assigned → picked_up
→ in_transit → at_hub → listed_for_sale → sold
```

---

## Collector Assignment Logic

* Find nearest collector using geolocation
* Assign only if available
* Create CollectorTask

---

## Reward Logic

* +10 points for correct segregation
* +5 bonus for recyclable waste
* +20 for >10kg waste

---

## Inventory Logic

* When waste reaches hub:
  → move WasteListing → Inventory
  → mark status = "available"

---

# 🧑‍💻 FRONTEND STRUCTURE (NEXT.JS)

## Routes

```
/citizen
/collector
/dealer
/admin
```

---

## Pages

### Citizen

* Upload Waste
* View Requests
* Track Pickup

### Collector

* Task Dashboard
* Map Navigation
* Status Update

### Dealer

* Marketplace
* Orders

### Admin

* Analytics Dashboard

---

# 🚀 PHASE-WISE DEVELOPMENT PLAN

## 🔹 PHASE 1 — Setup (Day 1)

* Initialize Next.js app
* Setup MongoDB connection
* Create all models
* Setup authentication (role-based)

---

## 🔹 PHASE 2 — AI Integration (Day 1–2)

* Image upload UI
* API route for Roboflow
* Map predictions → category

---

## 🔹 PHASE 3 — Waste Flow (Day 2–3)

* Create waste listing
* Implement status lifecycle
* Display user dashboard

---

## 🔹 PHASE 4 — Collector System (Day 3)

* Collector dashboard
* Task assignment logic
* Status updates

---

## 🔹 PHASE 5 — Inventory System (Day 4)

* Hub storage logic
* Inventory APIs
* Quality scoring

---

## 🔹 PHASE 6 — Marketplace (Day 4–5)

* Dealer UI
* Order system
* Inventory browsing

---

## 🔹 PHASE 7 — Analytics (Day 5)

* Waste metrics
* charts (Recharts)
* CO₂ / landfill estimates

---

# 🎯 DEMO FLOW (IMPORTANT)

1. Upload waste image
2. AI classification
3. Create pickup request
4. Assign collector
5. Collector picks waste
6. Waste stored in hub
7. Dealer purchases waste
8. Dashboard updates

---

# 🧠 KEY DIFFERENTIATORS

* AI + Logistics + Marketplace (ALL IN ONE)
* End-to-end traceability
* Circular economy implementation
* Scalable for smart cities

---

# ⚠️ RULES FOR AI CODING AGENT

* Follow schema strictly
* Maintain status transitions exactly
* Do not skip lifecycle steps
* Use modular API structure
* Ensure role-based access control
* Keep UI simple but functional
* Prioritize working flow over perfection

---
