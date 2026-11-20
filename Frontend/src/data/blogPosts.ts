export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readTime: string;
  author: string;
  relatedGuideHref: string;
  relatedGuideLabel: string;
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-sell-on-instagram-in-nigeria",
    title: "How to Sell on Instagram in Nigeria Without Losing Orders in DMs",
    description:
      "Learn how Nigerian Instagram vendors turn Reels, Stories, and bio traffic into completed Naira orders without losing buyers while offline.",
    category: "Instagram Commerce",
    publishedAt: "2026-11-20",
    readTime: "4 min read",
    author: "Kredibly Editorial",
    relatedGuideHref: "/instagram-shop-builder",
    relatedGuideLabel: "Explore Instagram Shop Builder",
    sections: [
      {
        heading: "Why 'DM for price' costs Nigerian sellers sales",
        paragraphs: [
          "Most Instagram shoppers in Nigeria browse late at night or during quick breaks. When a post says 'DM for price' and you reply two hours later, the buyer has often moved on to another page.",
          "Even when they do wait, back-and-forth chats for sizes, colors, delivery fees, and account numbers create friction that kills impulse purchases.",
        ],
      },
      {
        heading: "1. Put a real storefront link in your bio",
        paragraphs: [
          "Instead of sending followers into an empty chat thread, link your Instagram bio and Story stickers to a mobile-first storefront where every item already shows its photo, Naira price, and available sizes.",
        ],
        bullets: [
          "Show clear Naira prices so serious buyers self-qualify immediately",
          "Let customers pick sizes, colors, or variants without asking",
          "Display your store logo, bio, and delivery rates upfront to build trust",
        ],
      },
      {
        heading: "2. Automate checkout and order details",
        paragraphs: [
          "With a Kredibly storefront, your customer adds items to cart, enters their delivery state and address, and pays online via Nomba (bank transfer or card). You get a clean order record in your dashboard—no screenshots or lost addresses.",
        ],
      },
      {
        heading: "3. Make your store discoverable on Google too",
        paragraphs: [
          "Instagram posts disappear quickly from feeds, but a proper storefront with your logo, bio, address, social link, and 3+ products can also be indexed on Google and AI search—bringing new buyers who search your brand name directly.",
        ],
      },
    ],
  },
  {
    slug: "how-to-receive-orders-from-whatsapp-customers-nigeria",
    title: "How to Receive Orders From WhatsApp Customers Without Messy Chats",
    description:
      "A practical workflow for Nigerian WhatsApp vendors to turn Status views and broadcasts into structured carts, instant payments, and tracked deliveries.",
    category: "WhatsApp Selling",
    publishedAt: "2026-11-20",
    readTime: "4 min read",
    author: "Kredibly Editorial",
    relatedGuideHref: "/whatsapp-store-builder",
    relatedGuideLabel: "Explore WhatsApp Store Builder",
    sections: [
      {
        heading: "The WhatsApp Status problem",
        paragraphs: [
          "WhatsApp Status is one of the highest-converting sales channels in Nigeria, but managing 30 replies at once is exhausting. Repeating prices, checking stock manually, and copying addresses into notes leads to mistakes.",
        ],
      },
      {
        heading: "1. Share one catalog link instead of 20 photos",
        paragraphs: [
          "Post your best 2–3 product highlights on WhatsApp Status with a direct link to your Kredibly storefront. Interested buyers tap once to see your full catalog, live stock counts, and prices.",
        ],
      },
      {
        heading: "2. Collect complete delivery info automatically",
        paragraphs: [
          "Every order placed through your storefront captures the customer's full name, phone number, delivery state, street address, and exact items—and gives the buyer an order number to track their delivery.",
        ],
        bullets: [
          "No more chasing customers for missing house numbers",
          "Automatic state-based delivery fees calculated at checkout",
          "Instant order alerts straight to your merchant dashboard",
        ],
      },
      {
        heading: "3. Start free and keep your workflow simple",
        paragraphs: [
          "You can launch on Kredibly's Starter plan at ₦0/month for up to 20 products, and upgrade to Starter Plus (₦5,000/mo) or higher for 0% Kredibly commission as your daily orders grow.",
        ],
      },
    ],
  },
  {
    slug: "how-to-accept-online-payments-in-nigeria-small-business",
    title: "How to Accept Online Payments in Nigeria as a Small Business",
    description:
      "How Nigerian small businesses can accept instant bank transfers and card payments safely at checkout—without manually verifying every transfer alert.",
    category: "Payments & Operations",
    publishedAt: "2026-11-20",
    readTime: "3 min read",
    author: "Kredibly Editorial",
    relatedGuideHref: "/register",
    relatedGuideLabel: "Create Your Free Store",
    sections: [
      {
        heading: "Why manual bank transfers slow down growth",
        paragraphs: [
          "Sending your personal bank account number in DMs means waiting on network delays, asking buyers for screenshots, and staying alert for fake transfer alerts—all while you could be packing orders.",
        ],
      },
      {
        heading: "Use built-in checkout verification",
        paragraphs: [
          "When you sell through a Kredibly storefront, checkout is powered directly by Nomba. Buyers can pay by instant bank transfer or debit card, and your order is only marked Paid once payment is verified.",
        ],
        bullets: [
          "Automatic payment confirmation—no manual alert checking",
          "Clear wallet balance and payout tracking in your dashboard",
          "Professional order receipts for every customer",
        ],
      },
      {
        heading: "Keep more of your revenue as you scale",
        paragraphs: [
          "Start free on Starter (₦0/month, 2.5% transaction fee) while testing your first products, then switch to Starter Plus (₦5,000/month), Deluxe Pro (₦10,000/month), or Ultimate (₦20,000/month) for 0% Kredibly commission.",
        ],
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
