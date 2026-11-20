# Kredibly II — Product Requirements Document (PRD)

---

## 1. Executive Summary & Vision

**Kredibly II** is a modern, ultra-fast, multi-tenant e-commerce platform designed specifically for social media merchants, independent vendors, and direct-to-consumer (D2C) brands in emerging markets (starting with Nigeria).

The platform allows any seller to set up an online storefront in under 2 minutes, add products, generate clean, memorable bio links (e.g., `kred.shop/storename` or `usekredibly.com/storename`), and accept payments directly into their bank account or wallet.

### The Problem It Solves:
1. **The Trust Deficit in Social Commerce:** In Nigeria, buyers frequently hesitate to pay via bank transfers on Instagram or WhatsApp due to rampant delivery and product scams ("What I ordered vs. What I got").
2. **Expensive & Complex Software:** Shopify is too expensive ($39/mo in USD) and complex. Local tools (Bumpa, etc.) enforce rigid monthly debit cards that fail or push merchants out during low-sales months.
3. **Slow Mobile Storefronts:** Existing storefronts are cluttered with heavy scripts that lag on 3G/4G connections.
4. **Poor Social Link Previews:** When vendors share links in WhatsApp chats or Instagram DMs, scrapers often show broken thumbnails or generic logos instead of the actual product picture and price.

### The Kredibly Solution & Core Edges:
* **The "Zero-Scam" Buyer Trust Shield:** Storefront checkouts feature a prominent Kredibly Escrow/Trust badge, reassuring the buyer that their funds are protected.
* **Lean, Predictable Monthly Model:** Monthly subscriptions with a unique twist: merchants can pay subscription fees directly from their store balance/wallet, with a "results-first" free threshold.
* **Lightning-Fast Next.js Storefronts:** Server-Side Rendered (SSR) with instantaneous mobile loading and automatic OpenGraph link previews for WhatsApp/Instagram.
* **Zero Cloud Bloat:** 100% self-hosted on a Contabo VPS with client-side image compression and Cloudflare CDN caching, maintaining hosting overhead at ~$0 extra.

---

## 2. Business & Monetization Architecture

### Pricing Strategy (4-Tier SaaS + Free-Tier Transaction Fee)

Kredibly II operates on a **4-Tier Value-First Model** with Pay-from-Wallet and Card billing (`/dashboard/billing`):

| Tier | Monthly Price | Product Limit | Images / Product | Transaction Fee | Core Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter (Free)** | **₦0** (up to ₦200k sales) | 20 Products | 2 | 2.5% (incl. processing) | Official `name.kredibly.shop`, instant bank transfer checkout, PWA push & WhatsApp alerts, 8:00 AM Auto T+1 & instant payouts |
| **Starter Plus** | **₦5,000 / mo** | 50 Products | 2 | 0% Kredibly commission | Everything in Starter, plus 0% commission, choose who covers processing fee, custom category pills, customer directory |
| **Deluxe (Pro)** | **₦10,000 / mo** | 200 Products | 3 | 0% Kredibly commission | Everything in Starter Plus, plus unlimited variants, discount slash & coupon codes, storefront exclusive offer banner |
| **Ultimate (Scale)** | **₦20,000 / mo** | 1,000+ Products | 5 | 0% Kredibly commission | Everything in Deluxe, plus free `.com.ng` domain on annual billing and priority support |

### Billing, Retention & Lifecycle Rules:
1. **Pay-From-Wallet & Card Checkout:** Merchants can upgrade or renew monthly/annually (2 months free on annual) directly from their Kredibly Wallet `availableBalance` or via card checkout.
2. **Automated Renewal Reminders & Grace Period:** Daily lifecycle cron sends Email + PWA Push reminders at **3 days** and **1 day** before expiry, followed by a **3-day grace period** before downgrading back to `STARTER` (without deleting existing products).
3. **Kredibly HQ Monitoring (`/admin/subscriptions`):** Tracks paid plan revenue per tier, Free Plan (2.5%) profit, active paid subscriptions, and per-store days-remaining countdowns, with live tier pricing/limit configuration.

---

## 3. URL, Routing & Multi-Tenancy Strategy

### Storefront Handle Architecture
When a merchant registers "Beca.ria Collections", the system sanitizes it into a unique, lowercase slug (`^[a-z0-9-]+$`):
* **Handle:** `becaria`
* **Primary URL:** `usekredibly.com/becaria` (or short link `kred.shop/becaria`)
* **Product Direct Link:** `usekredibly.com/becaria/p/vintage-leather-jacket`

### Subdomain & Custom Domain Roadmap:
1. **Phase 1 (MVP):** Path-based routing (`usekredibly.com/[storeSlug]`). Single SSL certificate, zero DNS complexity.
2. **Phase 2:** Subdomain routing (`becaria.usekredibly.com`) using Next.js middleware rewrites and wildcard DNS.
3. **Phase 3:** Custom Domains (`becariacollections.com`) via CNAME pointing to Nginx/Cloudflare for SaaS.

---

## 4. Technical Stack & Infrastructure (VPS-Optimized)

The entire platform is architected to run leanly on an existing **Contabo VPS** alongside existing services.

```
                      [ User Mobile Device ]
                                │
                   (Client-side WebP compression)
                                │
                                ▼
                   [ Cloudflare Free CDN ]
             (Lagos / Abuja Edge Caching for assets)
                                │
                                ▼
                       [ Contabo VPS ]
  ┌─────────────────────────────────────────────────────────────┐
  │ Nginx (Reverse Proxy, SSL, Gzip/Brotli, Static Cache)        │
  │   ├─ Next.js SSR Frontend & Storefronts (Port 3000)         │
  │   ├─ Node.js / Express API + Workers (Port 5000)            │
  │   ├─ Static Uploads Directory (/var/www/kredibly/uploads)   │
  │   └─ PostgreSQL 16 (Local Database Instance - Port 5432)    │
  └─────────────────────────────────────────────────────────────┘
```

### Stack Breakdown:
* **Frontend & Storefront:** Next.js (App Router) + TypeScript + Tailwind CSS + Lucide Icons + Framer Motion.
* **Backend API & Queue:** Node.js + TypeScript (Express or Fastify) with BullMQ / In-Memory job processing for webhooks and notifications.
* **Database & ORM:** PostgreSQL 16 + Prisma ORM (Strict relational integrity, atomic inventory transactions).
* **Image Pipeline & Auto-Cleanup:**
  * Client-side compression before upload (max 1080px width, WebP format, ~100KB per image).
  * Tiered multi-image upload per product (**2** on Starter / Starter Plus, **3** on Deluxe Pro, **5** on Ultimate Scale) with multi-select support.
  * Stored on VPS SSD disk (`Backend/uploads/`) and served via Nginx/Express, with a daily DB-referenced orphan cleanup (`CleanupService`) that removes unreferenced files older than 24 hours.
  * **Cost:** $0 cloud media bills.
* **Payment, Payout & KYC Gateways:** Nomba DVA instant bank transfer checkout & transfers (8:00 AM WAT Auto T+1 + instant OTP-verified withdrawals), Paystack subscription billing, Resend transactional emails, Prembly REST API NIN/BVN KYC, and VAPID Web Push (`sw.js`) for iOS/Android PWA notifications.
* **Kredibly HQ Super Admin (`/admin`):** Role-gated (`ADMIN`) read-only monitoring for platform GMV, stores, orders, payouts, KYC queue, and `/admin/subscriptions`.

---

## 5. Core Entities & Database Schema (Prisma / PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  MERCHANT
  ADMIN
  STAFF
}

enum SubscriptionTier {
  STARTER
  PRO
  BUSINESS
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
  FAILED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phoneNumber   String    @unique
  passwordHash  String
  fullName      String
  role          Role      @default(MERCHANT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  stores        Store[]
}

model Store {
  id              String            @id @default(cuid())
  ownerId         String
  owner           User              @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  name            String
  slug            String            @unique // e.g. "becaria"
  description     String?
  logoUrl         String?
  bannerUrl       String?
  themeColor      String            @default("#0f172a")
  whatsappNumber  String
  currency        String            @default("NGN")
  
  subscriptionTier SubscriptionTier @default(STARTER)
  subscriptionEnd  DateTime?
  payFromWallet    Boolean          @default(true)

  bankCode        String?
  bankName        String?
  accountNumber   String?
  accountName     String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  products        Product[]
  orders          Order[]
  wallet          Wallet?
  customers       Customer[]
}

model Product {
  id              String           @id @default(cuid())
  storeId         String
  store           Store            @relation(fields: [storeId], references: [id], onDelete: Cascade)
  title           String
  slug            String
  description     String?
  basePrice       Decimal          @db.Decimal(12, 2)
  comparePrice    Decimal?         @db.Decimal(12, 2)
  images          String[]         // Maximum 2 URLs (WebP on VPS storage)
  isActive        Boolean          @default(true)
  stockQuantity   Int              @default(0)
  hasVariants     Boolean          @default(false)
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  variants        ProductVariant[]
  orderItems      OrderItem[]

  @@unique([storeId, slug])
}

model ProductVariant {
  id              String    @id @default(cuid())
  productId       String
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  name            String    // e.g. "Size: 42, Color: Black"
  price           Decimal   @db.Decimal(12, 2)
  stockQuantity   Int       @default(0)
  sku             String?
  
  orderItems      OrderItem[]
}

model Customer {
  id            String    @id @default(cuid())
  storeId       String
  store         Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  fullName      String
  phoneNumber   String
  email         String?
  address       String?
  city          String?
  state         String?
  createdAt     DateTime  @default(now())

  orders        Order[]

  @@unique([storeId, phoneNumber])
}

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique // e.g. "KRD-10492"
  storeId         String
  store           Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])
  
  subtotal        Decimal       @db.Decimal(12, 2)
  shippingFee     Decimal       @db.Decimal(12, 2) @default(0)
  totalAmount     Decimal       @db.Decimal(12, 2)
  
  orderStatus     OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(UNPAID)
  paymentRef      String?       @unique

  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  items           OrderItem[]
  transaction     Transaction?
}

model OrderItem {
  id              String          @id @default(cuid())
  orderId         String
  order           Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId       String
  product         Product         @relation(fields: [productId], references: [id])
  variantId       String?
  variant         ProductVariant? @relation(fields: [variantId], references: [id])
  
  productTitle    String
  variantName     String?
  unitPrice       Decimal         @db.Decimal(12, 2)
  quantity        Int
  subtotal        Decimal         @db.Decimal(12, 2)
}

model Wallet {
  id              String        @id @default(cuid())
  storeId         String        @unique
  store           Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  availableBalance Decimal      @db.Decimal(12, 2) @default(0)
  escrowBalance   Decimal       @db.Decimal(12, 2) @default(0)
  updatedAt       DateTime      @updatedAt

  transactions    Transaction[]
}

model Transaction {
  id              String        @id @default(cuid())
  walletId        String
  wallet          Wallet        @relation(fields: [walletId], references: [id], onDelete: Cascade)
  orderId         String?       @unique
  order           Order?        @relation(fields: [orderId], references: [id])
  amount          Decimal       @db.Decimal(12, 2)
  platformFee     Decimal       @db.Decimal(12, 2) @default(0)
  netAmount       Decimal       @db.Decimal(12, 2)
  type            String        // "SALE", "WITHDRAWAL", "SUBSCRIPTION_DEDUCTION"
  status          String        // "PENDING", "COMPLETED", "FAILED"
  reference       String        @unique
  createdAt       DateTime      @default(now())
}
```

---

## 6. Functional Specifications & User Journeys

### A. Merchant Onboarding & Store Creation (Under 2 Minutes)
1. User enters: Name, Phone (WhatsApp), Email, Password, Store Name.
2. System auto-generates slug handle preview: `usekredibly.com/storename`. Real-time debounced availability check.
3. Merchant lands on dashboard with an interactive checklist:
   * [ ] Add your first product (Title, Price, 2 Photos).
   * [ ] Add your payout bank details.
   * [ ] Copy & share your store link.

### B. Product Management (Lightweight & Rapid)
* Title, Description (optional short text), Price, Compare-at/Discount Price.
* Variant toggle: Option to add Sizes/Colors with stock count.
* **Image Uploader:** Max 2 images. The browser client compresses images to WebP `<100KB` before POSTing to `/api/upload`.
* Instant Stock Counter & "Out of Stock" automated badge.

### C. Buyer Storefront & Checkout Experience
* **Ultra-Fast Landing Page:** Server-rendered via Next.js.
* Clean product cards with clear pricing and high-contrast "Buy Now" / "Add to Cart" actions.
* **Mobile Floating Cart Bar:** Direct 1-tap checkout.
* **Trust & Security Banner:** *"🔒 Protected by Kredibly Escrow Guarantee."*
* **1-Step Checkout:** Buyer enters Name, Phone (WhatsApp), Delivery Address.
* Payment triggers Paystack Popup (Cards, Bank Transfer, USSD).
* **Instant Confirmation:** Redirects to order success screen with a 1-tap button: *"Contact Seller on WhatsApp"*.
* Automated WhatsApp notification fired to both customer and merchant.

### D. Merchant Order Management & Wallet
* Order status flow: `Pending` → `Paid` → `Dispatched` → `Delivered`.
* Revenue updates to Wallet:
  * Inflow moves to `EscrowBalance` upon customer payment.
  * Dispatched/Delivered order shifts funds to `AvailableBalance`.
* 1-Click Payout: Merchant requests withdrawal directly to their linked Nigerian bank account.

---

## 7. Implementation Roadmap & Phases

### Milestone 1: Environment & Base Setup (Week 1)
- [ ] Initialize `Kredibly II/Backend` with Node.js, TypeScript, Express, and Prisma.
- [ ] Initialize `Kredibly II/Frontend` with Next.js (App Router), TypeScript, and Tailwind CSS.
- [ ] Configure PostgreSQL instance and run initial Prisma migrations.
- [ ] Set up client-side WebP image compression pipeline and local upload endpoint.

### Milestone 2: Multi-Tenancy & Storefront Rendering (Week 2)
- [ ] Dynamic storefront routing: `/[storeSlug]` and `/[storeSlug]/p/[productSlug]`.
- [ ] Dynamic OpenGraph metadata generation for rich social sharing cards (WhatsApp/IG).
- [ ] Mobile-first responsive storefront UI and shopping cart state.

### Milestone 3: Checkout, Payments & Webhooks (Week 3)
- [ ] Integrated Paystack checkout flow.
- [ ] Idempotent webhook receiver: Handles `charge.success`, decrements stock atomically, and creates verified `Order` records.
- [ ] Automated receipt delivery via WhatsApp/Email.

### Milestone 4: Merchant Dashboard & Wallet Engine (Week 4)
- [ ] Merchant auth, product CRUD, and inventory management.
- [ ] Order management table with status triggers.
- [ ] Wallet ledger (escrow vs. available balances, subscription deductions, bank withdrawals).

### Milestone 5: VPS Deployment & Optimization (Week 5)
- [ ] Docker / PM2 deployment to Contabo VPS.
- [ ] Nginx reverse proxy configuration with gzip/brotli and static image caching.
- [ ] Cloudflare DNS & SSL setup for global edge acceleration.
