/* ─── Types ──────────────────────────────────────────────────── */
export interface VocabTerm {
  term: string;
  shortDef: string;
  fullDef: string;
  lumaNote: string;
}

export interface StorySection {
  heading?: string;
  body: string; // prose paragraph(s)
  vocabHighlights?: string[]; // term names that appear in this section
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  readingTimeMin: number;
  sections: StorySection[];
  completed?: boolean;
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMin: number;
  locked: boolean;
}

export interface Domain {
  slug: string;
  name: string;
  icon: string; // lucide icon name
  lumaIntro: string;
  stories: Story[];
  vocab: VocabTerm[];
  comprehension: ComprehensionQuestion[];
  challenges: Challenge[];
}

/* ─── Payments domain data ───────────────────────────────────── */
export const PAYMENTS_DOMAIN: Domain = {
  slug: "payments",
  name: "Payments",
  icon: "CreditCard",
  lumaIntro:
    "Payments isn't just Stripe. It's authorization, settlement, chargebacks, and the 47 things that can go wrong between 'Buy Now' and the merchant getting paid. Before you can build great payment products, you need to understand the rails underneath — because every edge case has a cost, and most of them end up in your oncall queue.",

  stories: [
    {
      id: "how-a-payment-works",
      title: "How a Payment Actually Works",
      subtitle: "From tap to settlement — the full lifecycle of a card transaction.",
      readingTimeMin: 6,
      completed: true,
      sections: [
        {
          heading: "The illusion of instant",
          body: "When a customer taps their card at a coffee shop, they walk away with a latte in about two seconds. That speed feels magical — but behind it is a chain of six or more systems talking to each other in real time, each one capable of failing in a different way.\n\nUnderstanding this chain isn't just an engineering concern. It's the foundation of every product decision you'll make in the payments space — from how you display error messages to how you architect retry logic to how you design your settlement reporting dashboard.",
          vocabHighlights: ["authorization", "settlement"],
        },
        {
          heading: "Step 1: Authorization",
          body: "The merchant's terminal captures the card data and sends it to their payment processor. The processor routes this to the card network (Visa, Mastercard), which forwards it to the card-issuing bank. The issuing bank checks: does this account exist? Is there sufficient credit or funds? Does this transaction look fraudulent?\n\nIf everything checks out, the issuing bank sends back an authorization code. This is not money moving — it's a promise. The funds are reserved on the customer's account, but the merchant hasn't received anything yet. Authorization typically takes 1–3 seconds.",
          vocabHighlights: ["authorization", "issuing-bank", "card-network"],
        },
        {
          heading: "Step 2: Capture and clearing",
          body: "Later — sometimes hours, sometimes at end of day — the merchant submits a batch of authorized transactions for capture. This is when the merchant formally claims the money. The card network then enters clearing: it calculates what each bank owes each other and nets the obligations.\n\nFor product managers, this gap between authorization and capture matters. It's why hotel holds exist. It's why your card shows a 'pending' transaction that later disappears before the real charge appears. It's why subscription products need to handle 'authorization expired' errors.",
          vocabHighlights: ["capture", "clearing"],
        },
        {
          heading: "Step 3: Settlement",
          body: "Settlement is when money actually moves between banks. The acquirer (the merchant's bank) receives funds from the issuing bank, typically via the card network's settlement infrastructure. The merchant then receives their funds — usually minus interchange fees, network fees, and the payment processor's cut — in their bank account 1–3 business days later.\n\nThis delay is why cash flow is a product problem, not just a finance problem. Marketplaces, gig economy platforms, and e-commerce businesses often build entire product features — instant payouts, earned wage access, working capital — to paper over the latency of settlement.",
          vocabHighlights: ["settlement", "interchange", "acquirer"],
        },
        {
          heading: "What can go wrong",
          body: "Authorization can fail for a dozen reasons: insufficient funds, expired card, card blocked for international transactions, suspected fraud, velocity limits, wrong CVV. Each failure code is different, and each one calls for a different product response — retry with a different card, update payment method, contact your bank, or just try again later.\n\nChargebacks add another layer: a customer disputes a charge with their issuing bank, the bank reverses the funds, and the merchant is on the hook — plus a chargeback fee, regardless of who was right. For product managers, chargeback rates are a signal worth watching. High rates trigger processor scrutiny, and above certain thresholds, it can mean losing your ability to accept cards entirely.",
          vocabHighlights: ["chargeback", "authorization"],
        },
      ],
    },
    {
      id: "payment-methods-landscape",
      title: "The Payment Methods Landscape",
      subtitle: "Cards are just the beginning. Here's everything else.",
      readingTimeMin: 7,
      completed: true,
      sections: [
        {
          heading: "Beyond cards",
          body: "Credit and debit cards dominate in the US and UK, but globally the picture is more fragmented. In the Netherlands, iDEAL — a bank transfer scheme — handles the majority of e-commerce payments. In Brazil, Pix can transfer funds between any two bank accounts in under 10 seconds, 24/7. In India, UPI has made card-on-file obsolete for hundreds of millions of people.\n\nAs a product manager, 'add more payment methods' sounds simple, but each one comes with its own approval flow, fraud profile, settlement timeline, and refund behavior. The decision to support a new payment method is a product decision — with a real cost-benefit analysis.",
          vocabHighlights: ["payment-method", "bank-transfer"],
        },
        {
          heading: "Buy Now Pay Later",
          body: "BNPL products like Affirm, Klarna, and Afterpay insert themselves between the customer and the merchant. The customer pays the BNPL provider in installments; the merchant receives full payment (minus a fee) immediately. From a product perspective, BNPL is primarily a conversion tool — it reduces cart abandonment for high-ticket items by lowering the psychological barrier of the full price.\n\nThe trade-off is complexity: you now have a three-party relationship, different checkout flows per provider, and a reconciliation challenge in your order management system.",
          vocabHighlights: ["bnpl"],
        },
        {
          heading: "Wallets and stored credentials",
          body: "Apple Pay, Google Pay, and PayPal all abstract away card details. The customer authenticates once with their device or wallet provider; the wallet tokenizes the card and presents a network token to the merchant. This is actually more secure than typing a card number — the token is merchant-specific and useless if intercepted.\n\nFor product, wallets matter because they collapse the checkout funnel. On mobile, a face-scan-and-done checkout converts dramatically better than a 16-digit card entry. Supporting wallets isn't a nice-to-have — it's table stakes for any mobile-first checkout.",
          vocabHighlights: ["tokenization", "network-token"],
        },
        {
          heading: "ACH and bank transfers",
          body: "Automated Clearing House (ACH) transfers are how most B2B payments and US payroll work. They're cheap (often cents per transaction vs. ~2.9% for cards), but slow — standard ACH takes 1–3 business days, and Same Day ACH is still limited. Crucially, ACH has no chargeback system — disputes go through your bank directly, and fraud recovery is harder.\n\nFor SaaS companies, ACH is often preferred for large annual contracts because the economics are dramatically better. The product challenge is the verification flow: you need to confirm the bank account belongs to the customer before pulling funds, which typically involves micro-deposit verification or instant bank verification via services like Plaid.",
          vocabHighlights: ["ach", "bank-transfer"],
        },
      ],
    },
    {
      id: "fraud-and-risk",
      title: "Fraud, Risk, and Why False Positives Kill Conversion",
      subtitle: "The invisible tax on every payment product.",
      readingTimeMin: 8,
      completed: true,
      sections: [
        {
          heading: "The fraud equation",
          body: "Every payment product has a fraud rate. Zero fraud is impossible — attempting to achieve it means declining so many legitimate transactions that you've built a product no one can actually use. The real goal is optimizing the trade-off between fraud losses and false positive declines.\n\nThis trade-off has a name: the fraud-conversion trade-off. A fraud team that cares only about fraud rates will kill conversion. A product team that cares only about conversion will invite fraud. Getting this right is fundamentally a product problem — not a fraud problem.",
          vocabHighlights: ["fraud", "false-positive"],
        },
        {
          heading: "How fraud detection works",
          body: "Modern fraud detection is a combination of rules and machine learning. Rules are explicit: block transactions over $5,000 from new accounts. ML models score each transaction based on hundreds of signals — device fingerprint, IP velocity, behavioral biometrics, purchase history, card network signals.\n\nThe output is typically a risk score. Your product decides what to do at different thresholds: auto-approve below 20, challenge (3DS) between 20–70, decline above 70. These thresholds are tunable — and every change has a measurable impact on both fraud rates and conversion rates.",
          vocabHighlights: ["3ds", "risk-score", "fraud"],
        },
        {
          heading: "3DS and strong customer authentication",
          body: "3D Secure (3DS) is the protocol behind those 'Verified by Visa' or 'Mastercard SecureCode' challenges. When triggered, the customer is redirected to their bank's authentication page — or, with 3DS2, shown a biometric prompt in-app. The key benefit: liability shifts from the merchant to the issuing bank for 3DS-authenticated transactions.\n\nIn Europe, Strong Customer Authentication (SCA) under PSD2 mandates 3DS for most transactions. For US products expanding into Europe, this is a major product consideration — 3DS2 has much lower friction than 3DS1, but there's still some drop-off, and your checkout funnel needs to handle authentication failures gracefully.",
          vocabHighlights: ["3ds", "sca", "liability-shift"],
        },
        {
          heading: "Friendly fraud and chargebacks",
          body: "Not all fraud comes from bad actors. 'Friendly fraud' — where a legitimate customer disputes a charge they actually made — is a significant source of chargebacks for most merchants. The customer may have forgotten the purchase, not recognized the merchant name on their statement, or simply decided to dispute rather than request a refund.\n\nFor product managers, the implications are clear: use clear merchant descriptors (what shows on the customer's statement), provide easy self-service refunds, and send purchase confirmation emails with recognizable branding. Each of these reduces friendly fraud — and each is a product decision, not just a policy.",
          vocabHighlights: ["chargeback", "friendly-fraud", "merchant-descriptor"],
        },
      ],
    },
    {
      id: "building-for-payments",
      title: "Building Products on Top of Payments",
      subtitle: "What it means to be a PM in the payments layer.",
      readingTimeMin: 6,
      completed: false,
      sections: [
        {
          heading: "The PM's unique responsibility",
          body: "Building on top of payments means every product decision has a financial consequence. The checkout flow you design affects revenue. The retry logic you spec affects authorization rates. The merchant descriptor you configure affects chargebacks. The error messages you write affect customer trust.\n\nThis is different from most product domains. In payments, the cost of a bad product decision is often immediate and measurable — in dollars, in chargeback ratios, or in account termination risk.",
          vocabHighlights: ["authorization-rate"],
        },
        {
          heading: "Key metrics for payment PMs",
          body: "Authorization rate: the percentage of attempted transactions that result in a successful authorization. A 1-percentage-point improvement in auth rate on a $1B payment volume product is $10M in recovered revenue. This is why Stripe, Adyen, and Braintree compete heavily on network optimization.\n\nCapture rate: of authorized transactions, how many are captured? Drop-off here usually indicates cart abandonment after authorization — a signal to investigate your post-auth checkout experience.\n\nChargeback rate: typically expressed as a percentage of transactions. Visa's standard threshold is 0.9% — above this, you enter a monitoring program with additional fees. Above 1.8%, you risk account termination.",
          vocabHighlights: ["authorization-rate", "chargeback", "capture"],
        },
        {
          heading: "Pricing models and interchange",
          body: "When a customer pays with a rewards card vs. a basic debit card, the interchange fee the merchant pays is different. Rewards cards carry higher interchange because the issuing bank needs to fund those miles and cashback. This is why merchants historically preferred cash or debit — and why surcharging and cash discount programs exist.\n\nFor product managers building merchant-facing tools, understanding interchange is key to designing pricing dashboards, payout reports, and fee transparency features. Merchants who understand their costs make better decisions — and trust the products that help them do so.",
          vocabHighlights: ["interchange", "issuing-bank"],
        },
        {
          heading: "What great payment UX looks like",
          body: "Great payment UX is invisible. The customer doesn't think about the payment — they think about what they're buying. Every friction point in the payment flow is a leak in your conversion funnel.\n\nThe best payment products share a few traits: they remember preferences (stored cards, default methods), they fail gracefully (clear error messages, specific retry guidance), they're fast (optimistic UI, pre-authorization where possible), and they're trusted (clear branding, recognizable descriptors, consistent design). Every one of these is a product decision — and every one is learnable.",
          vocabHighlights: ["authorization-rate"],
        },
      ],
    },
  ],

  vocab: [
    {
      term: "Authorization",
      shortDef: "A bank's real-time approval to reserve funds for a transaction.",
      fullDef:
        "Authorization is the process by which an issuing bank approves a payment transaction. When a card is presented, the merchant's processor sends a request to the card network, which forwards it to the issuing bank. The bank checks for available funds, fraud signals, and card validity, then returns an authorization code. Authorization reserves (holds) the funds but does not move money — that happens at settlement.",
      lumaNote:
        "Think of authorization as a promise, not a payment. The money doesn't move until settlement. This distinction matters when you're building things like hotel check-ins, gas station pre-auths, or any flow where the final amount isn't known at the time of the card tap.",
    },
    {
      term: "Settlement",
      shortDef: "The actual movement of funds from the customer's bank to the merchant's bank.",
      fullDef:
        "Settlement is the final step in the payment lifecycle where money actually changes hands. After authorization and capture, the acquiring bank receives funds from the issuing bank through the card network's settlement infrastructure. Settlement typically occurs 1–3 business days after capture and results in the merchant receiving their net proceeds (transaction amount minus interchange, network fees, and processor markup).",
      lumaNote:
        "Settlement delay is a product problem in disguise. It's why marketplaces offer instant payouts, why gig platforms build earned-wage products, and why 'when do I get paid?' is the first question every new merchant asks. If you're building anything in the merchant money flow, settlement timing is a core UX consideration.",
    },
    {
      term: "Interchange",
      shortDef: "The fee paid by the merchant's bank to the customer's bank on every card transaction.",
      fullDef:
        "Interchange is a fee set by the card networks (Visa, Mastercard) and paid by the acquirer (merchant's bank) to the issuer (customer's bank) on each transaction. It's typically expressed as a percentage plus a flat fee (e.g., 1.80% + $0.10). Interchange rates vary by card type (debit vs. credit), card tier (basic vs. rewards), transaction type (card present vs. card not present), and merchant category code (MCC).",
      lumaNote:
        "Interchange is why premium rewards cards cost more to accept. When a customer pays with an Amex Platinum card, the merchant pays higher interchange — which funds the points the customer earns. This is a classic three-sided market dynamic: card networks balance the interests of issuers, acquirers, and merchants.",
    },
    {
      term: "Chargeback",
      shortDef: "A forced reversal of a payment initiated by the customer's bank.",
      fullDef:
        "A chargeback occurs when a cardholder disputes a transaction with their issuing bank. The bank reverses the funds, debiting the merchant's account and returning the money to the customer. The merchant can contest the chargeback with evidence (representment), but the process is time-consuming and the outcome uncertain. Chargebacks also carry fees ($15–$100 per incident) regardless of outcome.",
      lumaNote:
        "Chargebacks are a product signal, not just a finance problem. High chargeback rates often indicate confusing merchant descriptors, poor refund UX, or a mismatch between what customers expect and what they receive. A good PM tracks chargeback reason codes and treats spikes as a bug report.",
    },
    {
      term: "Tokenization",
      shortDef: "Replacing sensitive card data with a non-sensitive token for storage and transmission.",
      fullDef:
        "Tokenization is the process of substituting sensitive payment data (like a PAN — Primary Account Number) with a non-sensitive placeholder called a token. The token maps back to the real data in a secure vault. Network tokenization, offered by Visa and Mastercard, goes further: the token is tied to a specific merchant and device, so even if intercepted, it can't be used elsewhere.",
      lumaNote:
        "Tokenization is how Apple Pay works. When you add a card to your iPhone, the actual card number never touches the merchant — only a device-specific token does. For product managers, the important implication is: tokens need to be updated when cards are renewed. Card-on-file products need to handle token lifecycle events to avoid silent payment failures.",
    },
    {
      term: "3D Secure (3DS)",
      shortDef: "An authentication protocol that verifies the cardholder's identity at checkout.",
      fullDef:
        "3D Secure is an XML-based protocol developed by Visa (Verified by Visa) and Mastercard (SecureCode) to add an authentication step to online card transactions. 3DS2 is the modern version, which enables frictionless authentication using device data and biometrics in most cases, with a challenge step only when risk is elevated. A key benefit of 3DS: for successfully authenticated transactions, liability for fraud shifts from the merchant to the issuing bank.",
      lumaNote:
        "3DS2 is genuinely a product improvement over 3DS1 — frictionless flows mean most users never see a challenge. But when challenges do appear, they need to be handled gracefully in your checkout flow. The worst pattern is a 3DS redirect that breaks the mobile back-button flow and loses the customer entirely.",
    },
    {
      term: "ACH",
      shortDef: "Automated Clearing House — a US bank transfer network for electronic fund transfers.",
      fullDef:
        "The Automated Clearing House network is the backbone of US electronic bank transfers, handling direct deposits, bill payments, and business-to-business payments. ACH transactions are batched and settled in windows (multiple times per day for Same Day ACH, 1–3 business days for standard). ACH is significantly cheaper than card processing but lacks the real-time authorization and chargeback protections of card networks.",
      lumaNote:
        "ACH economics are dramatically better than cards for large or recurring B2B payments — often 5–10x cheaper. But the latency creates real product challenges. If you debit a customer's bank account via ACH and they have insufficient funds, you won't find out for days — and there's no authorization step to catch it upfront. Products that use ACH need robust retry logic and communication flows for failed payments.",
    },
    {
      term: "Acquirer",
      shortDef: "The bank or financial institution that processes payments on behalf of a merchant.",
      fullDef:
        "The acquiring bank (acquirer) is the merchant's bank in a card transaction. It maintains the merchant account, processes payment requests on the merchant's behalf, and receives funds from issuing banks via the card network settlement process. In modern payments, the acquirer and payment processor roles are often combined or handled by the same entity (e.g., Stripe, Adyen, or Braintree act as both processor and acquirer in many markets).",
      lumaNote:
        "When Stripe says they have a 'direct acquiring relationship' in a given market, it means they can process without a third-party bank in the middle — which gives them more control over authorization rates and faster settlement. For PMs building payment products, understanding whether your stack uses a direct acquirer or an intermediary affects your ability to optimize auth rates.",
    },
  ],

  comprehension: [
    {
      id: "q1",
      question:
        "A customer's card shows a 'pending' transaction that disappears before the final charge appears. Which step of the payment lifecycle explains this behavior?",
      options: [
        "Settlement — the funds moved and then reversed",
        "Authorization — a hold was placed but not yet captured",
        "Clearing — the card network cancelled the transaction",
        "Tokenization — the card number was replaced mid-transaction",
      ],
      correctIndex: 1,
      explanation:
        "A 'pending' transaction represents an authorization — the issuing bank has reserved funds as a promise to pay, but no money has moved. When the merchant later captures the transaction, the authorization is replaced by the actual charge. If the authorization expires before capture (common with hotels or gas stations), the pending charge disappears entirely.",
    },
    {
      id: "q2",
      question:
        "An e-commerce merchant's chargeback rate hits 1.2%. According to Visa's standard thresholds, what is the likely consequence?",
      options: [
        "Nothing — 1.2% is below Visa's monitoring threshold",
        "The merchant enters a monitoring program with additional fees",
        "The merchant's account is immediately terminated",
        "The merchant's interchange rate doubles",
      ],
      correctIndex: 1,
      explanation:
        "Visa's standard chargeback threshold is 0.9%. A rate of 1.2% places the merchant in Visa's Dispute Monitoring Program, which carries additional fees per chargeback. Account termination risk begins at 1.8%. For product managers, this means monitoring chargeback rates isn't a finance task — it's a product health metric that directly affects your ability to operate.",
    },
    {
      id: "q3",
      question:
        "A SaaS company is debating whether to support ACH payments for annual enterprise contracts. Which of the following is the strongest product argument for doing so?",
      options: [
        "ACH transactions settle faster than card payments",
        "ACH provides stronger fraud protection through upfront authorization",
        "ACH transaction costs are dramatically lower, improving unit economics on large payments",
        "ACH eliminates the need for bank account verification flows",
      ],
      correctIndex: 2,
      explanation:
        "ACH's primary advantage for B2B payments is cost: at a few cents per transaction versus 2–3% for cards, the savings on a $50,000 annual contract are significant. ACH is actually slower than card settlement and lacks upfront authorization — so fraud recovery is harder. Bank account verification (via micro-deposits or instant verification) is required, adding complexity, not removing it.",
    },
  ],

  challenges: [
    {
      id: "payments-c1",
      title: "Design a payment failure recovery flow for a subscription product",
      difficulty: "Easy",
      estimatedMin: 15,
      locked: false,
    },
    {
      id: "payments-c2",
      title: "Prioritize: instant payouts vs. fraud detection improvements",
      difficulty: "Medium",
      estimatedMin: 20,
      locked: false,
    },
    {
      id: "payments-c3",
      title: "A spike in chargebacks — diagnose and respond",
      difficulty: "Medium",
      estimatedMin: 25,
      locked: true,
    },
  ],
};

/* ─── Domain registry ────────────────────────────────────────── */
export const DOMAIN_MAP: Record<string, Domain> = {
  payments: PAYMENTS_DOMAIN,
};

export function getDomain(slug: string): Domain | null {
  return DOMAIN_MAP[slug] ?? null;
}
