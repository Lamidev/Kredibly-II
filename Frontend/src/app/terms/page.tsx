import { LegalLayout } from "@/components/LegalLayout";

export const metadata = {
  title: "Terms of Service | Kredibly II",
  description:
    "Official terms and conditions governing merchant storefronts, customer purchases, payments, and buyer protection on Kredibly.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The contractual agreement governing your use of Kredibly storefronts, buyer protection escrow, merchant dashboards, and checkout systems."
      lastUpdated="November 17, 2026"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            1. Overview &amp; Acceptance of Terms
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Merchant&rdquo;, or &ldquo;Buyer&rdquo;) and <strong>Kredibly Technologies Inc.</strong> (&ldquo;Kredibly&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your access to and use of the Kredibly website, web applications, merchant dashboards, and hosted storefronts (including <code className="text-xs bg-[#F3F4EF] px-1.5 py-0.5 rounded text-[#2e1065]">usekredibly.com</code> and <code className="text-xs bg-[#F3F4EF] px-1.5 py-0.5 rounded text-[#2e1065]">kredibly.shop</code>).
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#525B6C]">
            By registering a store, placing an order, completing a checkout, or browsing any store hosted on Kredibly, you expressly agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must immediately cease using the platform.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            2. Merchant Storefronts &amp; Account Obligations
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            To create an online storefront on Kredibly, merchants must provide accurate, up-to-date business details, including a valid Nigerian phone number, email address, and bank verification details.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-[#525B6C]">
            <li>
              <strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your account credentials, passcodes, and store settings. Any activity occurring under your account is your legal responsibility.
            </li>
            <li>
              <strong>Storefront Identity:</strong> You may not select a store name, slug, or custom domain that infringes on third-party trademarks or misrepresents your brand as an affiliated entity of another business.
            </li>
            <li>
              <strong>Accurate Product Descriptions:</strong> Merchants warrant that all photos, descriptions, specifications, pricing, and stock levels displayed on their store accurately represent the physical goods being sold.
            </li>
          </ul>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            3. Prohibited Products &amp; Unlawful Activities
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Kredibly strictly prohibits the sale or promotion of any goods or services that violate the laws of the Federal Republic of Nigeria or international e-commerce standards, including but not limited to:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-[#525B6C]">
            <li>Counterfeit designer luxury goods or unverified replicas masquerading as authentic brands.</li>
            <li>Stolen gadgets, unregistered pharmaceuticals, prescription-only drugs, and unapproved chemical compounds.</li>
            <li>Weapons, explosives, firearms, ammunition, or hazardous materials.</li>
            <li>Ponzi schemes, multi-level marketing (MLM) fees, unregulated forex or crypto tokens.</li>
            <li>Adult content, pornography, or sexually explicit materials.</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-[#525B6C]">
            Kredibly reserves the unconditional right to suspend or permanently delete any merchant store violating this section without refund or prior notice.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            4. Subscription Plans, Billing &amp; Wallet Deductions
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Kredibly operates on a transparent SaaS subscription structure with three billing cycles: Quarterly, Biannual, and Annual:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-[#525B6C]">
            <li>
              <strong>0% Platform Commission:</strong> Kredibly does not take a percentage fee from your sales. Merchants keep 100% of their product margins, subject only to third-party payment gateway processing fees (e.g., Paystack/Monnify card and transfer fees).
            </li>
            <li>
              <strong>Wallet Deduction Option:</strong> For merchant convenience, renewal fees may be deducted directly from your verified Kredibly sales wallet balance upon your authorized opt-in.
            </li>
            <li>
              <strong>Cancellation &amp; Downgrades:</strong> You can cancel your subscription at any time via your Merchant Dashboard. Your store will remain active until the end of your prepaid billing period.
            </li>
          </ul>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            5. Buyer Protection &amp; Escrow Settlement Mechanism
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            To eliminate the &ldquo;What I ordered vs. What I got&rdquo; epidemic and build consumer trust in Nigerian social commerce, all orders processed through Kredibly checkout are protected by the Kredibly Trust Shield:
          </p>
          <div className="my-4 p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#2e1065]">
              How the Escrow Shield Protects Both Parties:
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#525B6C]">
              <li>
                <strong>Payment Lock:</strong> When a buyer pays via card or instant bank transfer, funds are securely held in a dedicated settlement escrow account.
              </li>
              <li>
                <strong>Fulfillment &amp; Dispatch:</strong> The merchant receives the verified order with a unique dispatch code and delivers the physical package.
              </li>
              <li>
                <strong>24-Hour Inspection Window:</strong> Upon delivery confirmation, the buyer has a 24-hour inspection window to confirm that the items match the order.
              </li>
              <li>
                <strong>Auto-Release:</strong> If no dispute or damage claim is filed within 24 hours of documented delivery, the funds are automatically released to the merchant&apos;s available wallet for instant payout.
              </li>
            </ol>
          </div>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Merchants are protected from frivolous disputes: buyers must submit unboxing photo/video proof within the 24-hour window to initiate any dispute.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            6. Payouts &amp; Bank Transfers
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Settled funds from completed orders can be withdrawn directly into any valid Nigerian commercial or microfinance bank account (e.g., GTBank, Zenith, Access, Kuda, Moniepoint, OPay). Payouts are initiated within minutes of your withdrawal request.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            7. Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Kredibly provides the storefront software and escrow infrastructure on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the maximum extent permitted by Nigerian law, Kredibly Technologies Inc. shall not be liable for any indirect, punitive, or consequential damages resulting from merchant delivery delays, courier damages, internet service provider outages, or third-party bank downtime.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            8. Governing Law &amp; Dispute Arbitration
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, including the Federal Competition and Consumer Protection Act (FCCPA) and the Nigeria Data Protection Act (NDPA). Any dispute that cannot be resolved amicably within thirty (30) days shall be submitted to binding arbitration in Lagos State, Nigeria.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            9. Contact &amp; Legal Notices
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            For legal inquiries, copyright notices, or questions regarding these Terms, contact our legal and compliance desk:
          </p>
          <div className="mt-3 p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] text-xs font-mono text-[#525B6C] space-y-1">
            <p><strong>Entity:</strong> Kredibly Technologies Limited</p>
            <p><strong>Email:</strong> legal@usekredibly.com</p>
            <p><strong>Merchant Support:</strong> support@usekredibly.com</p>
            <p><strong>Jurisdiction:</strong> Lagos, Nigeria</p>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
