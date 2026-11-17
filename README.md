# Kredibly II

> **The Social Commerce Operating System for Nigerian Online Retailers**

Kredibly II is an online storefront builder designed for social media sellers (Instagram, WhatsApp, and TikTok merchants) in Nigeria. It allows vendors to launch an official online storefront (`kredibly.shop/[brand]`) in under 2 minutes, showcase custom catalog categories, accept automated instant bank transfers & cards with built-in buyer delivery escrow protection, and cash out 100% of their earnings directly to any Nigerian commercial bank or licensed FinTech.

---

## 🚀 Key Capabilities

* **2-Minute Storefront Setup**: Instant store handle reservation (`kredibly.shop/yourbrand`) with zero coding or hosting setup.
* **30-Second Guest Checkout**: Phone-first checkout flow with no forced shopper accounts or passwords, reducing cart abandonment.
* **Automated Instant Bank Transfers & Cards**: Automated payment detection with zero manual transfer receipt checking.
* **Escrow Delivery Guarantee**: Buyer payments are safely protected until the merchant marks the package as delivered, eliminating scam hesitation.
* **Smart Catalog & Dynamic WebP Optimizer**: Custom categories (e.g., *iPhones*, *Bone-Straight Wigs*, *Sneakers*, *Skincare*) with client-side/server photo compression keeping images under 85KB for sub-second mobile loads.
* **Post-Payment WhatsApp Dispatch**: Direct WhatsApp order routing only unlocks on the verified receipt *after* payment is confirmed, stopping unpaid "How much?" chat time-wasters.
* **1-Click Bank Payouts**: Real-time NUBAN name enquiry and direct withdrawal to GTBank, Access, Zenith, OPay, Palmpay, Kuda, Moniepoint, etc.

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Components**: Radix UI (shadcn/ui Accordion) & Lucide Icons
* **State Management**: Zustand

### Backend
* **Runtime**: Node.js & Express
* **Language**: TypeScript
* **ORM & Database**: Prisma ORM with PostgreSQL
* **Security & Auth**: JWT, bcrypt, Helmet, Rate Limiting, Input Sanitization

---

## 📦 Project Structure

```
Kredibly II/
├── Frontend/                 # Next.js 14 App Router client
│   ├── src/
│   │   ├── app/              # Routes: landing, auth, dashboard, storefronts
│   │   ├── components/       # Storefront & UI components
│   │   └── store/            # Zustand global state (cart, auth)
│   └── public/               # Brand assets & logos
├── Backend/                  # Express & TypeScript API server
│   ├── prisma/               # Schema definitions & migrations
│   └── src/
│       ├── controllers/      # Route controllers
│       ├── routes/           # REST endpoints
│       └── services/         # Business logic & payment services
├── PRD.md                    # Product Requirements Document
└── ROADMAP.md                # Development Roadmap & Feature Specs
```

---

## ⚡ Getting Started

### 1. Prerequisites
* Node.js v18+
* PostgreSQL database

### 2. Backend Setup
```bash
cd Backend
npm install
npx prisma generate
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📄 License
Private & Proprietary. All rights reserved.
