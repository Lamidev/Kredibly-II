import { LegalLayout } from "@/components/LegalLayout";

export const metadata = {
  title: "Refund & Escrow Policy | Kredibly II",
  description:
    "Official refund, returns, and escrow protection guidelines for buyers and merchants on Kredibly storefronts.",
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund &amp; Escrow Policy"
      subtitle="Clear guidelines on how buyer protection, order returns, dispute mediation, and merchant settlements operate on Kredibly."
      lastUpdated="November 17, 2026"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            1. The Kredibly Zero-Scam Trust Shield
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Unlike unregulated Instagram and WhatsApp direct transfers where buyers risk sending money into personal bank accounts and merchants risk false alerts, every transaction on Kredibly is powered by our <strong>Escrow Trust Shield</strong>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#525B6C]">
            When a customer makes a purchase on any Kredibly storefront (e.g. <code className="text-xs bg-[#F3F4EF] px-1.5 py-0.5 rounded text-[#2e1065]">kredibly.shop/brandname</code>), their money is held safely in escrow until the package is fulfilled and verified.
          </p>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            2. The 24-Hour Inspection &amp; Auto-Release Window
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            To ensure rapid cash flow for honest merchants while guaranteeing protection for buyers:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-[#525B6C]">
            <li>
              <strong>Delivery Confirmation:</strong> When an order is delivered by dispatch riders or courier services, delivery status is updated via the automated tracking link or merchant dispatch code.
            </li>
            <li>
              <strong>24-Hour Inspection Window:</strong> The buyer has twenty-four (24) hours from receipt of the parcel to inspect their items.
            </li>
            <li>
              <strong>Instant Auto-Release:</strong> If no dispute or damage claim is raised within 24 hours of delivery, the system automatically marks the transaction complete and releases the total funds into the merchant&apos;s wallet for immediate withdrawal.
            </li>
          </ul>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            3. Eligible Refund &amp; Return Scenarios
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            A buyer is eligible for a full or partial refund under the following conditions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#2e1065] px-2 py-0.5 bg-[#F3F4EF] rounded border border-[#DADDD4]">
                CASE 01
              </span>
              <h4 className="font-bold text-sm text-[#090D16]">Non-Delivery</h4>
              <p className="text-xs text-[#525B6C] leading-relaxed">
                The merchant fails to dispatch or deliver the order within the agreed delivery timeline with no proof of courier tracking.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#2e1065] px-2 py-0.5 bg-[#F3F4EF] rounded border border-[#DADDD4]">
                CASE 02
              </span>
              <h4 className="font-bold text-sm text-[#090D16]">Wrong Item Sent</h4>
              <p className="text-xs text-[#525B6C] leading-relaxed">
                The item delivered is fundamentally different in color, size, specification, or category from what was ordered on the storefront.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#2e1065] px-2 py-0.5 bg-[#F3F4EF] rounded border border-[#DADDD4]">
                CASE 03
              </span>
              <h4 className="font-bold text-sm text-[#090D16]">Damaged or Defective</h4>
              <p className="text-xs text-[#525B6C] leading-relaxed">
                The product arrives broken, ripped, expired, or non-functional, verified by unboxing photo or video evidence.
              </p>
            </div>
          </div>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            4. Ineligible Items &amp; Return Exceptions
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            In line with standard retail policies, the following items are strictly non-refundable once delivered, unless defective upon unboxing:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-[#525B6C]">
            <li>Personal intimate apparel, swimwear, earrings, and opened beauty/skincare products for health and hygiene protection.</li>
            <li>Custom-made or personalized merchandise produced specifically to customer measurements.</li>
            <li>Perishable foods, confectionery, and fresh produce.</li>
            <li>Items sold with explicit &ldquo;Final Sale / Clearance&rdquo; tags clearly disclosed on the product page.</li>
          </ul>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            5. Dispute Mediation &amp; Fair Protection for Merchants
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            Kredibly does not tolerate fraudulent buyer chargebacks or frivolous claims designed to exploit merchants:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-[#525B6C]">
            <li>
              <strong>Mandatory Evidence:</strong> Any buyer raising a dispute must provide clear photos or unboxing video footage and order reference within the 24-hour window.
            </li>
            <li>
              <strong>48-Hour Resolution Desk:</strong> Our dedicated Nigerian dispute team reviews the dispatch records, product listings, and submitted media within 48 hours.
            </li>
            <li>
              <strong>Resolution:</strong> If the claim is verified, the return is initiated and the funds returned to the buyer upon receipt of return tracking. If the claim is found to be false or abusive, the escrow funds are immediately released in full to the merchant.
            </li>
          </ul>
        </div>

        <hr className="border-[#DADDD4]" />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#090D16] mb-3">
            6. How to Open a Dispute or Return Request
          </h2>
          <p className="text-sm leading-relaxed text-[#525B6C]">
            To request a return or resolve an order issue, simply click the <strong>&ldquo;Report an Issue&rdquo;</strong> button on your automated order receipt (received via WhatsApp or email) or email our resolutions desk directly:
          </p>
          <div className="mt-3 p-4 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] text-xs font-mono text-[#525B6C] space-y-1">
            <p><strong>Support Email:</strong> disputes@usekredibly.com</p>
            <p><strong>WhatsApp Support:</strong> Available 9:00 AM – 6:00 PM (WAT)</p>
            <p><strong>Required Info:</strong> Order Number (#KRED-XXXX), Proof Photo/Video, Merchant Store Handle</p>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
