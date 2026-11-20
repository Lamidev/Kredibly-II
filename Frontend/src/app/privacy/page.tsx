import { LegalLayout } from "@/components/LegalLayout";

export const metadata = {
  title: "Privacy Policy | Kredibly",
  description:
    "How Kredibly collects, protects, processes, and respects merchant and buyer personal data in compliance with the Nigeria Data Protection Act (NDPA).",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Kredibly collects, processes, and protects the personal and transaction data of merchants and customers under the Nigeria Data Protection Act (NDPA)."
      lastUpdated="November 19, 2026"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            1. Commitment to Data Privacy
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Akinbyte Technologies Limited (RC: 9466327), operator of Kredibly (&ldquo;Kredibly&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), is committed to protecting the privacy, dignity, and rights of all merchants, customers, and visitors who interact with our platform.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#525B6C]">
            This Privacy Policy explains how we collect, store, utilize, and safeguard personal data when you visit <code className="text-xs bg-[#F3F4EF] px-1.5 py-0.5 rounded text-[#2e1065]">usekredibly.com</code>, <code className="text-xs bg-[#F3F4EF] px-1.5 py-0.5 rounded text-[#2e1065]">kredibly.shop</code>, or any independent merchant storefront powered by Kredibly. We operate in strict compliance with the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and the guidelines of the Nigeria Data Protection Commission (NDPC).
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            2. Information We Collect
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            We only collect data necessary to provide secure storefront hosting, payment settlement, automated receipts, and fraud protection:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#2e1065]">
                A. From Merchants (Store Owners):
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#525B6C]">
                <li>Full legal name, business trade name, and email.</li>
                <li>WhatsApp and mobile phone numbers for store notifications.</li>
                <li>Nigerian Bank Verification Number (BVN) / Bank Account Details for merchant identity validation and direct payouts.</li>
                <li>Product images, prices, inventory counts, and descriptions.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#2e1065]">
                B. From Customers / Buyers:
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#525B6C]">
                <li>Full name, delivery address, city, and state.</li>
                <li>Phone number and email for automated order confirmations and WhatsApp tracking receipts.</li>
                <li>Order history and transaction reference numbers.</li>
                <li>IP address and device user-agent for fraud prevention.</li>
              </ul>
            </div>
          </div>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            3. Payment Security &amp; Zero Raw Card Storage
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Kredibly does not store or process your credit/debit card numbers or CVV codes directly on our servers.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#525B6C]">
            All card transactions and instant virtual bank account generations are handled directly by Central Bank of Nigeria (CBN)-licensed and PCI-DSS Level 1 certified payment switches (such as Nomba). Your payment details are encrypted in transit using 256-bit TLS/SSL encryption.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            4. How We Use Your Personal Data
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[#525B6C]">
            <li>
              <strong>Order Fulfillment:</strong> Sharing buyer contact and delivery addresses with the respective store owner and dispatch couriers so orders can be physically delivered.
            </li>
            <li>
              <strong>Automated Instant Receipts:</strong> Generating tamper-proof WhatsApp, SMS, or email digital invoices for buyers and sellers immediately after payment confirmation.
            </li>
            <li>
              <strong>Verified Checkout &amp; Fraud Prevention:</strong> Verifying payments through licensed financial partners, tracking order fulfillment, and preventing social commerce fraud.
            </li>
            <li>
              <strong>Platform Performance:</strong> Optimizing storefront loading speeds and image caching for 3G/4G Nigerian mobile connections.
            </li>
          </ul>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            5. Zero Sale of Personal Data
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            We never sell, rent, or trade merchant or customer personal data to third-party advertisers or data brokers. Data is shared strictly with authorized service providers (such as AWS SES for email receipts, licensed payment processors, and SMS gateways) to complete transactions.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            6. Your Rights Under the NDPA (2023)
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            As a Nigerian data subject, you have explicit rights regarding your personal information:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-[#525B6C]">
            <li><strong>Right of Access:</strong> You can request a copy of all personal data Kredibly holds about you.</li>
            <li><strong>Right to Rectification:</strong> You can update inaccurate business or contact details via your Merchant Dashboard.</li>
            <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> You may request the deletion of your account and store data, subject to regulatory tax and anti-money laundering (AML) record retention rules.</li>
            <li><strong>Right to Object:</strong> You can opt out of promotional emails or WhatsApp updates at any time with a single click.</li>
          </ul>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            7. Data Protection Officer (DPO) Contact
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            If you have questions, complaints, or wish to exercise your data subject rights under the Nigeria Data Protection Act, please contact our designated Data Protection Officer:
          </p>
          <div className="mt-3 p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] text-xs font-mono text-[#525B6C] space-y-1">
            <p><strong>DPO Office:</strong> Akinbyte Technologies Limited (RC: 9466327)</p>
            <p><strong>Email:</strong> privacy@usekredibly.com</p>
            <p><strong>Physical Address:</strong> Lagos, Nigeria</p>
            <p><strong>Regulatory Oversight:</strong> Nigeria Data Protection Commission (NDPC)</p>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
