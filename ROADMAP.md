# Kredibly II — System Workflow & Implementation Roadmap

> **Architectural Principle:** Sequential, contract-driven development. Each stage builds the foundation for the next stage. A stage is only considered complete when its **Verification & Done Criteria** are satisfied, producing verified outputs that feed directly into the subsequent stage.

---

```
  ┌───────────────┐
  │    STAGE 1    │  Bedrock & Foundational Scaffolding
  │               │  (DB, Backend Express + TS, Frontend Next.js + Tailwind)
  └───────┬───────┘
          │ Outputs: Running services, Prisma schema, DB migrations, shared contracts
          ▼
  ┌───────────────┐
  │    STAGE 2    │  Merchant Identity, Multi-Tenancy & Auth
  │               │  (JWT, Slug generation, Onboarding Wizard, Bank Details)
  └───────┬───────┘
          │ Outputs: Authenticated merchant session, verified Store record & slug
          ▼
  ┌───────────────┐
  │    STAGE 3    │  Product Catalog & Client-Side Image Pipeline
  │               │  (WebP client compressor, Product/Variant CRUD, Inventory)
  └───────┬───────┘
          │ Outputs: Stored products with WebP images and atomic stock counts
          ▼
  ┌───────────────┐
  │    STAGE 4    │  Public SSR Storefront & Dynamic OpenGraph Previews
  │               │  (Next.js dynamic routes, WhatsApp/IG cards, Mobile Cart)
  └───────┬───────┘
          │ Outputs: Fast public store & product URLs, shareable links, cart state
          ▼
  ┌───────────────┐
  │    STAGE 5    │  1-Step Checkout, Paystack & Escrow Engine
  │               │  (1-Step Drawer, Paystack popup, Idempotent Webhook, Stock Lock)
  └───────┬───────┘
          │ Outputs: Verified Orders, atomic stock decrements, Escrow balance credited
          ▼
  ┌───────────────┐
  │    STAGE 6    │  Order Fulfillment Pipeline & Wallet Payouts
  │               │  (Status transitions, Escrow-to-Available release, Bank Payout)
  └───────┬───────┘
          │ Outputs: Complete order lifecycles, automated ledgering, bank withdrawals
          ▼
  ┌───────────────┐
  │    STAGE 7    │  Automated WhatsApp Notifications & Receipt Engine
  │               │  (Instant order receipts, merchant alert, dispatch updates)
  └───────┬───────┘
          │ Outputs: Verified real-time buyer/seller communication loops
          ▼
  ┌───────────────┐
  │    STAGE 8    │  VPS Deployment, Nginx Caching & Cloudflare CDN
  │               │  (PM2 cluster, Nginx direct static serving, edge caching)
  └───────────────┘
            Outputs: Production live system with $0 cloud media overhead
```

---

## Stage 1: Bedrock & Foundational Scaffolding

### 1. Objective:
Establish the unified TypeScript monorepo/workspace with running Backend (Express + Prisma) and Frontend (Next.js) instances, a validated PostgreSQL database, and centralized environment management.

### 2. Implementation Scope:
* **Backend (`/Backend`):**
  * Initialize Node.js + TypeScript environment with `tsconfig.json`.
  * Set up Express server with security headers (`helmet`), CORS, JSON parser, and central error middleware.
  * Initialize Prisma with the complete relational schema from PRD (Users, Stores, Products, Variants, Customers, Orders, Wallets, Transactions).
  * Run initial Prisma migration against PostgreSQL.
  * Establish health-check endpoint (`GET /api/health`).
* **Frontend (`/Frontend`):**
  * Initialize Next.js 14+ (App Router) with TypeScript, Tailwind CSS, and `lucide-react`.
  * Set up `shadcn/ui` foundational components (Button, Input, Form, Dialog/Drawer, Toast).
  * Configure API client utility (`fetch`/`axios` with typed response wrappers).
  * Configure base layout and global styles.

### 3. Connection & Handoff to Stage 2:
* **Outputs:** 
  * Running Backend API at `http://localhost:5000` with connected PostgreSQL database.
  * Running Frontend at `http://localhost:3000`.
  * Generated Prisma Client types ready for backend service consumption.
* **Stage 2 depends on:** The database tables and API base structure to implement merchant authentication and store creation.

---

## Stage 2: Merchant Identity, Multi-Tenancy & Authentication

### 1. Objective:
Allow vendors to sign up in under 2 minutes, claim a unique store handle/slug, set up their payout bank details, and establish authenticated sessions.

### 2. Implementation Scope:
* **Backend:**
  * Authentication endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
  * JWT issuance with `httpOnly` cookie or Bearer header, password hashing via `bcryptjs`.
  * Store handle sanitizer and debounced availability checker: `GET /api/stores/check-slug?slug=:slug`.
  * Store profile & bank details update endpoint: `PUT /api/stores/settings`.
  * Auto-provision a zero-balance `Wallet` record whenever a new `Store` is created.
* **Frontend:**
  * Authentication screens: `/register` and `/login` with real-time validation via `react-hook-form` and `zod`.
  * **2-Minute Onboarding Wizard:**
    * Step 1: Merchant basic credentials.
    * Step 2: Store Name with real-time handle preview (`usekredibly.com/yourbrand`).
    * Step 3: Payout bank selector (Nigerian bank list + account verification).
  * Authenticated route protection middleware in Next.js.

### 3. Connection & Handoff to Stage 3:
* **Outputs:**
  * Authenticated merchant session (`auth_token`).
  * Persisted `Store` entity linked to the merchant's `User` ID with an initialized `Wallet`.
* **Stage 3 depends on:** The authenticated merchant context and `storeId` to associate product catalog items.

---

## Stage 3: Product Catalog Engine & Lightweight Image Pipeline

### 1. Objective:
Equip merchants with a fast product creation flow supporting variants, stock management, and client-compressed WebP uploads stored on local VPS disk without third-party cloud hosting bills.

### 2. Implementation Scope:
* **Backend:**
  * Product CRUD endpoints:
    * `POST /api/products` (Create product with optional variants)
    * `GET /api/products` (List merchant's products with pagination and search)
    * `PUT /api/products/:id` (Update product details, price, and stock)
    * `DELETE /api/products/:id` (Soft delete or deactivate product)
  * Local File Storage Upload Handler (`POST /api/upload`):
    * Accepts max 2 images per product via `multer`.
    * Stores directly to `/uploads/products/` with unique hash names.
    * Returns static asset URLs.
* **Frontend:**
  * **Client-Side Image Pipeline:**
    * Intercept image selection in the browser using `browser-image-compression`.
    * Compress images to WebP `<100KB` and max width 1080px before uploading.
  * Product creation form with real-time preview:
    * Title, Price, Compare-at Price, Description.
    * Variant builder (e.g. Size: S/M/L, Color: Red/Black) with per-variant stock counters.
  * Merchant Product Catalog table with instant stock count toggles and "Out of Stock" badges.

### 3. Connection & Handoff to Stage 4:
* **Outputs:**
  * Database populated with active products linked to `storeId` with static image URLs and variant pricing.
* **Stage 4 depends on:** Product records to render the public customer-facing storefronts.

---

## Stage 4: Public SSR Storefront & Dynamic Social Previews (OpenGraph)

### 1. Objective:
Deliver sub-second, mobile-first storefront pages accessible via public store slugs with rich OpenGraph link preview cards when links are shared on WhatsApp and Instagram.

### 2. Implementation Scope:
* **Backend:**
  * Public cached endpoints (no auth required):
    * `GET /api/public/stores/:slug` (Store details, theme color, WhatsApp number)
    * `GET /api/public/stores/:slug/products` (Active products list)
    * `GET /api/public/stores/:slug/products/:productSlug` (Single product with variants)
* **Frontend:**
  * Dynamic Next.js SSR Routes:
    * `app/[storeSlug]/page.tsx` (Merchant store landing page)
    * `app/[storeSlug]/p/[productSlug]/page.tsx` (Individual product page)
  * **Dynamic OpenGraph Metadata (`generateMetadata`):**
    * Generates high-converting social preview cards for WhatsApp/Instagram showing Product Title, Price in ₦, and high-res WebP image.
  * **Mobile Storefront UI:**
    * Clean, distraction-free product catalog cards.
    * Escrow / Buyer Trust Shield banner prominently placed.
    * Zustand-powered slide-in cart drawer with instant quantity increment/decrement.
    * Persistent sticky bottom bar on mobile: *"Buy Now" / "View Cart"*.

### 3. Connection & Handoff to Stage 5:
* **Outputs:**
  * Live public storefronts where customers can browse, select variants, and trigger checkout from the cart drawer.
* **Stage 5 depends on:** The cart state and customer delivery inputs to initialize orders and payment transactions.

---

## Stage 5: Frictionless 1-Step Checkout, Paystack & Escrow Engine

### 1. Objective:
Enable buyers to complete purchases in a single step with Paystack, while atomically securing inventory and crediting funds safely into the merchant's Escrow ledger upon payment confirmation.

### 2. Implementation Scope:
* **Backend:**
  * `POST /api/checkout/initialize`:
    * Validates buyer data (Full Name, WhatsApp Phone Number, Delivery Address).
    * Validates stock availability for each item.
    * Generates `Order` record with `PENDING` status and unique order number (e.g., `KRD-10293`).
    * Initializes Paystack transaction and returns payment authorization URL / reference.
  * **Idempotent Paystack Webhook Handler (`POST /api/webhooks/paystack`):**
    * Verifies HMAC SHA512 signature using Paystack secret key.
    * Executes in an ACID database transaction (`prisma.$transaction`):
      1. Atomically decrements product / variant stock quantities.
      2. Updates `Order` status to `PAID` and `paymentStatus` to `PAID`.
      3. Creates a `Transaction` record (type: `SALE`).
      4. Increments merchant `Wallet.escrowBalance` by net amount (amount minus platform fee).
* **Frontend:**
  * 1-Step Checkout Drawer: Collects Buyer Name, Phone (WhatsApp), Address, and City/State.
  * Paystack Inline integration (Popup modal on mobile/desktop without jarring page re-routes).
  * Post-payment Success Screen:
    * Order reference number and summary.
    * High-contrast CTA: **"Message Seller on WhatsApp"** (pre-fills order number and product summary).

### 3. Connection & Handoff to Stage 6:
* **Outputs:**
  * Confirmed orders in `PAID` state.
  * Funds securely held in the merchant's `escrowBalance`.
  * Decremented inventory with zero race conditions.
* **Stage 6 depends on:** Paid orders to allow merchants to fulfill shipments and transition funds into available balances.

---

## Stage 6: Order Fulfillment Pipeline, Wallet Ledger & Payouts

### 1. Objective:
Provide merchants with an order fulfillment command center and a transparent financial wallet to track escrow releases and trigger payouts to their Nigerian bank accounts.

### 2. Implementation Scope:
* **Backend:**
  * Merchant Order Management endpoints:
    * `GET /api/orders` (Filter by `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
    * `PATCH /api/orders/:id/status` (Update status).
  * **Escrow Release Engine:**
    * When order is marked `DELIVERED`:
      * Deducts amount from `Wallet.escrowBalance`.
      * Credits amount to `Wallet.availableBalance`.
      * Logs audit transaction.
  * **Wallet & Payout Engine:**
    * `GET /api/wallet` (Returns available balance, escrow balance, transaction history).
    * `POST /api/wallet/withdraw` (Initiates withdrawal to merchant's registered bank via Paystack Transfer API).
    * Auto-deduction handler for monthly subscription renewals from `availableBalance`.
* **Frontend:**
  * Merchant Orders Screen: Filterable order cards, 1-click status update actions, and direct buyer WhatsApp contact button.
  * Merchant Wallet Screen:
    * Visual split: **Pending in Escrow (₦)** vs. **Available for Withdrawal (₦)**.
    * Transaction history table.
    * 1-Click "Withdraw Funds" modal with bank confirmation.

### 3. Connection & Handoff to Stage 7:
* **Outputs:**
  * Complete operational lifecycle from payment to delivery to cash in merchant bank.
* **Stage 7 depends on:** Order status change events to fire automated buyer/merchant notifications.

---

## Stage 7: Automated Notifications & Social Commerce Loops

### 1. Objective:
Keep both buyer and seller synchronized via instant WhatsApp and Email notifications on order placement, payment receipt, and dispatch.

### 2. Implementation Scope:
* **Backend:**
  * Background Notification Worker (BullMQ / In-memory queue):
    * `order.created` event -> WhatsApp message to Merchant ("🎉 New Order #KRD-10293 received!").
    * `order.paid` event -> WhatsApp/Email receipt to Buyer with order tracking link.
    * `order.dispatched` event -> WhatsApp delivery update with courier details.
  * Deep-linked WhatsApp URL generator for manual 1-tap buyer follow-ups.
* **Frontend:**
  * Notification preferences in Merchant Dashboard settings.
  * Public order tracking page: `/[storeSlug]/orders/[orderNumber]`.

### 3. Connection & Handoff to Stage 8:
* **Outputs:**
  * Fully automated communication loop eliminating buyer anxiety and merchant manual texting.
* **Stage 8 depends on:** A fully functional application ready for server hardening and deployment.

---

## Stage 8: VPS Deployment, Nginx Caching & Cloudflare CDN

### 1. Objective:
Deploy the entire platform on a single Contabo VPS with zero-downtime PM2 process management, high-performance Nginx reverse proxy, direct disk static image delivery, and Cloudflare edge acceleration.

### 2. Implementation Scope:
* **VPS Setup:**
  * Node.js LTS, PostgreSQL 16, PM2, and Nginx installation on Ubuntu VPS.
  * Directory structure: `/var/www/kredibly/backend`, `/var/www/kredibly/frontend`, `/var/www/kredibly/uploads`.
* **PM2 Process Orchestration:**
  * `ecosystem.config.js` running Backend (cluster mode) and Next.js Frontend.
* **Nginx Configuration:**
  * Reverse proxy port 3000 (Next.js) and port 5000 (Express API).
  * Direct static file serving for `/uploads/` with aggressive client-side caching headers (`Cache-Control: max-age=31536000, immutable`).
  * Brotli/Gzip compression enabled.
* **Cloudflare Configuration:**
  * Edge DNS with SSL Full (Strict).
  * Page rules for static asset caching at Lagos and Abuja edge locations.

### 3. Done Criteria:
* Full end-to-end user test in production: Store creation -> Product upload -> WhatsApp preview check -> Live Paystack payment -> Escrow credit -> Order delivery -> Bank withdrawal.

---

## Execution Progress Tracker

| Stage | Name | Status | Key Deliverable |
| :---: | :--- | :---: | :--- |
| **1** | Bedrock & Foundational Scaffolding | ✅ **Complete** | Backend API, Next.js Scaffold, PostgreSQL + Prisma DB |
| **2** | Merchant Identity, Multi-Tenancy & Auth | ✅ **Complete** | Auth, Slug generator, 2-Min Onboarding, Bank setup |
| **3** | Product Catalog & Image Pipeline | ✅ **Complete** | WebP compressor, Product/Variant CRUD, Stock counters |
| **4** | Public Storefront & Dynamic OpenGraph | ✅ **Complete** | Next.js SSR Storefront, WhatsApp/IG Cards, Mobile Cart |
| **5** | 1-Step Checkout & Paystack Escrow | ✅ **Complete** | 1-Step Drawer, Paystack Popup, Webhook, Stock Lock |
| **6** | Order Fulfillment & Wallet Payouts | ✅ **Complete** | Status pipeline, Escrow release, Bank withdrawal |
| **7** | Automated WhatsApp Notifications | 🔄 **Current** | WhatsApp receipts, Merchant alerts, Tracking page |
| **7** | Automated WhatsApp Notifications | ⏳ Queued | WhatsApp receipts, Merchant alerts, Tracking page |
| **8** | VPS Hardening & Cloudflare CDN | ⏳ Queued | PM2 cluster, Nginx direct static cache, Live launch |
