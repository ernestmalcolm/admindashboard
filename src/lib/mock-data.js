export const TIME_FILTERS = ["7d", "30d", "3m"];

const TODAY = "2026-04-20";
const MS_IN_DAY = 24 * 60 * 60 * 1000;

const companySeed = [
  {
    id: "cmp-001",
    name: "Alfa Distributors Ltd",
    region: "Dar es Salaam",
    addressMapping: "mapped",
    tin: "123-456-789",
    dateJoined: "2024-01-15",
    subscriptionStatus: "active",
    expiryDate: "2026-06-08",
    integrations: { api: true, xero: true, quickbooks: false },
    operators: 12,
    receiptsSubmittedStuck: 2,
    zReportsStuck: 1,
    receipts: {
      "7d": [42, 48, 50, 47, 56, 54, 61],
      "30d": [43, 41, 40, 39, 42, 44, 47, 49, 51, 50, 53, 54],
      "3m": [145, 151, 160, 158, 171, 176, 182, 190, 194, 201, 209, 214],
    },
    avgReceiptValue: { "7d": 96, "30d": 99, "3m": 102 },
    subscriptionHistory: [
      {
        year: 2026,
        amount: 720000,
        method: "Bank Transfer",
        reference: "RX-260101",
        paymentFlow: "direct-payment",
      },
      {
        year: 2025,
        amount: 680000,
        method: "Lipa Number",
        reference: "RX-250991",
        paymentFlow: "approved-from-proof",
        proofId: "proof-002",
      },
    ],
    paymentProofs: [
      { id: "proof-001", label: "April 2026 bank slip", uploadedAt: "2026-03-29", type: "PDF" },
      {
        id: "proof-002",
        label: "January 2026 payment text",
        uploadedAt: "2026-01-03",
        type: "Text",
        textMessage: "M-Pesa: You have received TZS 680,000 from ALFA DISTRIBUTORS. Ref RX-250991. Thank you.",
      },
    ],
  },
  {
    id: "cmp-002",
    name: "Beta Agro Supplies",
    region: "Mwanza",
    addressMapping: "mapped",
    tin: "987-111-222",
    dateJoined: "2024-03-10",
    subscriptionStatus: "expired",
    expiryDate: "2026-04-12",
    integrations: { api: true, xero: false, quickbooks: false },
    operators: 5,
    receiptsSubmittedStuck: 4,
    zReportsStuck: 2,
    receipts: {
      "7d": [5, 4, 3, 4, 2, 1, 0],
      "30d": [14, 11, 8, 7, 7, 6, 5, 3, 4, 2, 1, 0],
      "3m": [45, 43, 41, 38, 34, 31, 28, 20, 15, 12, 8, 3],
    },
    avgReceiptValue: { "7d": 71, "30d": 77, "3m": 82 },
    subscriptionHistory: [
      {
        year: 2025,
        amount: 540000,
        method: "Digicash",
        reference: "RX-250421",
        paymentFlow: "approved-from-proof",
        proofId: "proof-003",
      },
      {
        year: 2024,
        amount: 500000,
        method: "Bank Transfer",
        reference: "RX-240701",
        paymentFlow: "direct-payment",
      },
    ],
    paymentProofs: [{ id: "proof-003", label: "2025 renewal receipt", uploadedAt: "2025-04-18", type: "Image" }],
  },
  {
    id: "cmp-003",
    name: "Cosmo Retail Tanzania",
    region: "Arusha",
    addressMapping: "mapped",
    tin: "567-333-100",
    dateJoined: "2023-11-04",
    subscriptionStatus: "temporary",
    expiryDate: "2026-04-08",
    integrations: { api: true, xero: true, quickbooks: true },
    operators: 8,
    receiptsSubmittedStuck: 3,
    zReportsStuck: 3,
    receipts: {
      "7d": [21, 19, 20, 18, 22, 24, 23],
      "30d": [55, 58, 52, 51, 59, 60, 61, 57, 56, 64, 66, 67],
      "3m": [180, 184, 190, 197, 205, 209, 221, 230, 235, 244, 252, 260],
    },
    avgReceiptValue: { "7d": 132, "30d": 137, "3m": 140 },
    subscriptionHistory: [
      {
        year: 2025,
        amount: 820000,
        method: "Lipa Number",
        reference: "RX-252201",
        paymentFlow: "approved-from-proof",
        proofId: "proof-004",
      },
      {
        year: 2024,
        amount: 780000,
        method: "Digicash",
        reference: "RX-242512",
        paymentFlow: "direct-payment",
      },
    ],
    paymentProofs: [{ id: "proof-004", label: "Manual temporary extension approval", uploadedAt: "2026-04-10", type: "PDF" }],
  },
  {
    id: "cmp-004",
    name: "Delta Tech Services",
    region: "Dodoma",
    addressMapping: "mapped",
    tin: "300-700-900",
    dateJoined: "2024-05-25",
    subscriptionStatus: "active",
    expiryDate: "2026-05-03",
    integrations: { api: false, xero: false, quickbooks: true },
    operators: 6,
    receiptsSubmittedStuck: 1,
    zReportsStuck: 0,
    receipts: {
      "7d": [39, 41, 44, 43, 46, 50, 54],
      "30d": [122, 118, 127, 131, 128, 134, 137, 139, 145, 151, 154, 160],
      "3m": [320, 310, 328, 336, 340, 349, 357, 366, 373, 380, 391, 402],
    },
    avgReceiptValue: { "7d": 88, "30d": 91, "3m": 95 },
    subscriptionHistory: [
      {
        year: 2026,
        amount: 620000,
        method: "Digicash",
        reference: "RX-260215",
        paymentFlow: "direct-payment",
      },
      {
        year: 2025,
        amount: 590000,
        method: "Bank Transfer",
        reference: "RX-251971",
        paymentFlow: "approved-from-proof",
        proofId: "proof-005",
      },
    ],
    paymentProofs: [{ id: "proof-005", label: "Current active subscription payment", uploadedAt: "2026-02-15", type: "PDF" }],
  },
  {
    id: "cmp-005",
    name: "Epsilon Logistics",
    region: "Mbeya",
    addressMapping: "mapped",
    tin: "880-225-116",
    dateJoined: "2025-02-10",
    subscriptionStatus: "pending",
    expiryDate: "2026-04-25",
    integrations: { api: true, xero: false, quickbooks: false },
    operators: 4,
    receiptsSubmittedStuck: 2,
    zReportsStuck: 1,
    receipts: {
      "7d": [0, 1, 0, 2, 0, 1, 0],
      "30d": [2, 1, 1, 3, 2, 1, 2, 2, 1, 0, 1, 0],
      "3m": [9, 12, 14, 18, 15, 16, 14, 17, 11, 10, 8, 6],
    },
    avgReceiptValue: { "7d": 64, "30d": 69, "3m": 72 },
    subscriptionHistory: [
      {
        year: 2025,
        amount: 220000,
        method: "Lipa Number",
        reference: "PN-250341",
        paymentFlow: "approved-from-proof",
      },
    ],
    paymentProofs: [
      {
        id: "proof-005a",
        label: "Client upload - Lipa Number SMS",
        uploadedAt: "2026-04-20",
        type: "Text",
        textMessage: "LIPA_NAMBA confirmation: TZS 220,000 received for Epsilon Logistics, Ref PN-250341, Date 2026-04-20.",
      },
    ],
  },
  {
    id: "cmp-006",
    name: "Futura Medics",
    region: null,
    addressMapping: "missing",
    tin: "450-775-124",
    dateJoined: "2025-08-01",
    subscriptionStatus: "expired",
    expiryDate: "2026-03-22",
    integrations: { api: false, xero: true, quickbooks: false },
    operators: 3,
    receiptsSubmittedStuck: 1,
    zReportsStuck: 1,
    receipts: {
      "7d": [0, 0, 0, 0, 0, 0, 0],
      "30d": [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "3m": [12, 10, 8, 6, 4, 3, 2, 1, 1, 0, 0, 0],
    },
    avgReceiptValue: { "7d": 0, "30d": 39, "3m": 51 },
    subscriptionHistory: [
      {
        year: 2025,
        amount: 330000,
        method: "Bank Transfer",
        reference: "RX-251118",
        paymentFlow: "approved-from-proof",
        proofId: "proof-006",
      },
    ],
    paymentProofs: [{ id: "proof-006", label: "Last paid cycle - 2025", uploadedAt: "2025-11-02", type: "PDF" }],
  },
  {
    id: "cmp-007",
    name: "Grandline Hardware",
    region: "Kilimanjaro",
    addressMapping: "mapped",
    tin: "519-113-288",
    dateJoined: "2024-09-12",
    subscriptionStatus: "active",
    expiryDate: "2026-10-11",
    integrations: { api: true, xero: false, quickbooks: true },
    operators: 10,
    receiptsSubmittedStuck: 1,
    zReportsStuck: 0,
    receipts: {
      "7d": [58, 61, 63, 67, 65, 69, 74],
      "30d": [159, 166, 171, 168, 176, 181, 186, 190, 201, 208, 213, 220],
      "3m": [465, 474, 486, 498, 509, 515, 528, 540, 551, 569, 578, 590],
    },
    avgReceiptValue: { "7d": 106, "30d": 111, "3m": 116 },
    subscriptionHistory: [
      {
        year: 2026,
        amount: 910000,
        method: "Bank Transfer",
        reference: "RX-260004",
        paymentFlow: "approved-from-proof",
        proofId: "proof-007",
      },
      {
        year: 2025,
        amount: 870000,
        method: "Lipa Number",
        reference: "RX-250902",
        paymentFlow: "direct-payment",
      },
    ],
    paymentProofs: [{ id: "proof-007", label: "Signed transfer advice", uploadedAt: "2026-01-02", type: "Image" }],
  },
  {
    id: "cmp-008",
    name: "Horizon Fuel Co",
    region: "Dodoma",
    addressMapping: "unmapped",
    tin: "672-901-377",
    dateJoined: "2025-01-21",
    subscriptionStatus: "pending",
    expiryDate: "2026-05-01",
    integrations: { api: false, xero: true, quickbooks: false },
    operators: 2,
    receiptsSubmittedStuck: 0,
    zReportsStuck: 1,
    receipts: {
      "7d": [9, 10, 8, 11, 13, 12, 10],
      "30d": [27, 29, 30, 28, 31, 32, 30, 34, 35, 32, 37, 38],
      "3m": [96, 101, 104, 109, 112, 118, 121, 126, 132, 137, 140, 145],
    },
    avgReceiptValue: { "7d": 89, "30d": 93, "3m": 95 },
    subscriptionHistory: [
      {
        year: 2025,
        amount: 410000,
        method: "Digicash",
        reference: "RX-251455",
        paymentFlow: "direct-payment",
      },
    ],
    paymentProofs: [
      {
        id: "proof-008a",
        label: "Client upload - Digicash message",
        uploadedAt: "2026-04-18",
        type: "Text",
        textMessage: "Digicash payment successful. Merchant: Horizon Fuel Co. Amount: TZS 410,000. Ref RX-251455.",
      },
    ],
  },
];

const REGION_POOL = [
  "Dar es Salaam",
  "Mwanza",
  "Arusha",
  "Dodoma",
  "Mbeya",
  "Morogoro",
  "Kilimanjaro",
  "Tanga",
  "Mtwara",
  "Kagera",
  "Tabora",
  "Singida",
];

const NAME_PREFIXES = [
  "Atlas",
  "Summit",
  "Prime",
  "Vertex",
  "Nexa",
  "Harbor",
  "Peak",
  "Pioneer",
  "Nova",
  "Sterling",
  "Unity",
  "Global",
];

const NAME_SUFFIXES = [
  "Traders",
  "Logistics",
  "Retail",
  "Supplies",
  "Foods",
  "Technologies",
  "Holdings",
  "Ventures",
  "Wholesalers",
  "Mart",
];

function pickStatus(index) {
  if (index % 10 < 5) return "active";
  if (index % 10 < 7) return "expired";
  if (index % 10 < 9) return "pending";
  return "temporary";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDateFromOffset(daysOffset) {
  const baseDate = new Date("2021-01-01");
  baseDate.setDate(baseDate.getDate() + daysOffset);
  return baseDate.toISOString().slice(0, 10);
}

function formatDateFromTodayOffset(offsetDays) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function buildSeries(length, base, seed) {
  return Array.from({ length }, (_, idx) => {
    const wave = Math.sin((idx + seed) * 0.9) * 0.14;
    const drift = (idx % 4) * 0.03;
    return Math.max(0, Math.round(base * (1 + wave + drift)));
  });
}

function buildGeneratedCompany(serial) {
  const idx = serial - 1;
  const id = `cmp-${String(serial).padStart(3, "0")}`;
  const prefix = NAME_PREFIXES[idx % NAME_PREFIXES.length];
  const suffix = NAME_SUFFIXES[(idx * 3) % NAME_SUFFIXES.length];
  const status = pickStatus(idx);

  const addressMapping = idx % 22 === 0 ? "missing" : idx % 17 === 0 ? "unmapped" : "mapped";
  const region = addressMapping === "mapped" ? REGION_POOL[idx % REGION_POOL.length] : null;

  const joinedOffset = 30 + idx * 8;
  const dateJoined = formatDateFromOffset(joinedOffset);

  let expiryOffset = 0;
  if (status === "active") expiryOffset = 20 + (idx % 260);
  if (status === "pending") expiryOffset = 3 + (idx % 45);
  if (status === "temporary") expiryOffset = -1 - (idx % 40);
  if (status === "expired") expiryOffset = -8 - (idx % 220);
  const expiryDate = formatDateFromTodayOffset(expiryOffset);

  const receiptBase =
    status === "active"
      ? 26 + (idx % 42)
      : status === "temporary"
        ? 11 + (idx % 18)
        : status === "pending"
          ? 4 + (idx % 8)
          : idx % 5;

  const receipts7d = buildSeries(7, receiptBase, idx + 1);
  const receipts30d = buildSeries(12, receiptBase * 3.4, idx + 2);
  const receipts3m = buildSeries(12, receiptBase * 10, idx + 3);
  const avgBase = 62000 + (idx % 15) * 6500;
  const method = ["Bank Transfer", "Mobile Money", "Card", "Cheque"][idx % 4];

  return {
    id,
    name: `${prefix} ${suffix} Co ${serial}`,
    region,
    addressMapping,
    tin: `${100 + (idx % 900)}-${200 + ((idx * 7) % 700)}-${100 + ((idx * 13) % 900)}`,
    dateJoined,
    subscriptionStatus: status,
    expiryDate,
    integrations: {
      api: idx % 2 === 0,
      xero: idx % 3 === 0,
      quickbooks: idx % 4 === 0,
    },
    operators: 2 + (idx % 13),
    receiptsSubmittedStuck: clamp(Math.round((idx % 7) / 2), 0, 4),
    zReportsStuck: clamp(Math.round((idx % 5) / 2), 0, 3),
    receipts: {
      "7d": receipts7d,
      "30d": receipts30d,
      "3m": receipts3m,
    },
    activeCompanyEstimate: {
      "7d": status === "active" ? 2 + (idx % 7) : status === "temporary" ? 1 + (idx % 3) : idx % 2,
      "30d": status === "active" ? 6 + (idx % 12) : status === "temporary" ? 2 + (idx % 5) : 1 + (idx % 3),
      "3m": status === "active" ? 10 + (idx % 18) : status === "temporary" ? 4 + (idx % 8) : 2 + (idx % 5),
    },
    avgReceiptValue: {
      "7d": avgBase,
      "30d": avgBase + 1500,
      "3m": avgBase + 3000,
    },
    subscriptionHistory: [
      {
        year: 2026,
        amount: 450000 + (idx % 20) * 25000,
        method: idx % 3 === 0 ? "Lipa Number" : idx % 3 === 1 ? "Bank Transfer" : "Digicash",
        reference: `RX-26${String(serial).padStart(4, "0")}`,
        paymentFlow: idx % 2 === 0 ? "approved-from-proof" : "direct-payment",
      },
      {
        year: 2025,
        amount: 420000 + (idx % 16) * 24000,
        method: idx % 4 === 0 ? "Digicash" : idx % 4 === 1 ? "Lipa Number" : "Bank Transfer",
        reference: `RX-25${String(serial).padStart(4, "0")}`,
        paymentFlow: idx % 3 === 0 ? "approved-from-proof" : "direct-payment",
      },
    ],
    paymentProofs:
      status === "pending"
        ? [{ id: `proof-${serial}`, label: `Payment slip ${serial}`, uploadedAt: "2026-04-01", type: "Image" }]
        : idx % 4 === 0
          ? [{ id: `proof-${serial}`, label: `Renewal receipt ${serial}`, uploadedAt: "2026-01-14", type: "PDF" }]
          : [],
  };
}

const generatedCompanies = Array.from({ length: 192 }, (_, index) => buildGeneratedCompany(index + 9));

const organizationNames = [
  "East Africa Holdings",
  "TradeLink Group",
  "Commerce Reach Tanzania",
  "BlueHarbor Enterprises",
  "Rift Valley Partners",
  "Great Lakes Ventures",
  "Savanna Retail Group",
  "Uhuru Business Network",
  "Legacy Capital Union",
  "Frontier Operations Hub",
];

const mappableOrganizationNames = organizationNames.slice(0, 8);

export const companies = [...companySeed, ...generatedCompanies].map((company, index) => {
  const paymentProofs = company.paymentProofs || [];
  const normalizedPaymentProofs =
    company.subscriptionStatus === "pending" && paymentProofs.length === 0
      ? [
          {
            id: `proof-pending-${company.id}`,
            label: `Uploaded proof for ${company.name}`,
            uploadedAt: "2026-04-20",
            type: "Image",
          },
        ]
      : paymentProofs;
  const primaryProofId = normalizedPaymentProofs[0]?.id;

  return {
    ...company,
    organizationName: mappableOrganizationNames[index % mappableOrganizationNames.length],
    expenses: company.expenses || {
      "7d": company.receipts["7d"].map((value) => Math.max(0, Math.round(value * 0.38))),
      "30d": company.receipts["30d"].map((value) => Math.max(0, Math.round(value * 0.36))),
      "3m": company.receipts["3m"].map((value) => Math.max(0, Math.round(value * 0.34))),
    },
    avgExpenseValue: company.avgExpenseValue || {
      "7d": Math.round(company.avgReceiptValue["7d"] * 0.44),
      "30d": Math.round(company.avgReceiptValue["30d"] * 0.43),
      "3m": Math.round(company.avgReceiptValue["3m"] * 0.42),
    },
    activeCompanyEstimate: company.activeCompanyEstimate || {
      "7d": company.subscriptionStatus === "active" ? 4 : 1,
      "30d": company.subscriptionStatus === "active" ? 10 : 2,
      "3m": company.subscriptionStatus === "active" ? 16 : 4,
    },
    subscriptionHistory: (company.subscriptionHistory || []).map((entry) =>
      entry.paymentFlow === "approved-from-proof" && !entry.proofId && primaryProofId
        ? { ...entry, proofId: primaryProofId }
        : entry,
    ),
    paymentProofs: normalizedPaymentProofs,
    status: company.receipts["30d"].reduce((sum, value) => sum + value, 0) > 0 ? "active" : "inactive",
    subscription: company.subscriptionStatus === "active" ? "subscribed" : "expired",
    issuingReceipts: company.receipts["30d"].reduce((sum, value) => sum + value, 0) > 0,
    apiClient: company.integrations.api,
  };
});

const companiesPerOrganization = companies.reduce((acc, company) => {
  acc[company.organizationName] = (acc[company.organizationName] || 0) + 1;
  return acc;
}, {});

export const organizations = organizationNames.map((name, index) => ({
  id: `org-${index + 1}`,
  name,
  companies: companiesPerOrganization[name] || 0,
}));
const operatorRoles = ["Cashier", "Supervisor", "Manager", "Finance Officer", "Support Lead"];
export const operators = companies.flatMap((company, index) =>
  Array.from({ length: Math.min(company.operators, 4) }, (_, operatorIndex) => ({
    id: `op-${index + 1}-${operatorIndex + 1}`,
    name: `Operator ${index + 1}.${operatorIndex + 1}`,
    companyId: company.id,
    role: operatorRoles[(index + operatorIndex) % operatorRoles.length],
  })),
);

export const taxHubCmsItems = [
  { id: "tax-tip", type: "Tax Tip", title: "How to reconcile end-of-day sales" },
  { id: "tax-reminder", type: "Tax Reminder", title: "Monthly VAT filing due reminder" },
  { id: "tax-article", type: "Tax Article", title: "TRA receipt verification lifecycle" },
  { id: "tax-video", type: "Tax Video", title: "Using the Tax Hub dashboard effectively" },
];

export const receiptReissuingQueue = companies.slice(0, 24).map((company, index) => ({
  receiptCode: `VRC-${443120 + index}`,
  companyId: company.id,
  status: index % 4 === 0 ? "issued" : "submitted",
  retryCount: index % 4 === 0 ? 0 : (index % 3) + 1,
}));

export function getDaysUntil(expiryDate) {
  const target = new Date(expiryDate).getTime();
  const today = new Date(TODAY).getTime();
  return Math.ceil((target - today) / MS_IN_DAY);
}

function getReceiptsTotal(company, range) {
  return company.receipts[range].reduce((sum, value) => sum + value, 0);
}

function getTotalValue(company, range) {
  return getReceiptsTotal(company, range) * company.avgReceiptValue[range];
}

function getExpensesTotal(company, range) {
  return company.expenses[range].reduce((sum, value) => sum + value, 0);
}

function getTotalExpenseValue(company, range) {
  return getExpensesTotal(company, range) * company.avgExpenseValue[range];
}

export function getDashboardMetrics(range = "30d", sourceCompanies = companies) {
  const totalCompanies = sourceCompanies.length;
  const subscribedCompanies = sourceCompanies.filter((company) => company.subscriptionStatus === "active").length;
  const activeCompanies = sourceCompanies.filter((company) => getReceiptsTotal(company, range) > 0).length;
  const receiptsCount = sourceCompanies.reduce((sum, company) => sum + getReceiptsTotal(company, range), 0);
  const totalReceiptValue = sourceCompanies.reduce((sum, company) => sum + getTotalValue(company, range), 0);
  const averageReceiptValue = receiptsCount ? totalReceiptValue / receiptsCount : 0;
  const expensesAdded = sourceCompanies.reduce((sum, company) => sum + getExpensesTotal(company, range), 0);
  const totalExpenseValue = sourceCompanies.reduce((sum, company) => sum + getTotalExpenseValue(company, range), 0);
  const averageExpenseValue = expensesAdded ? totalExpenseValue / expensesAdded : 0;

  const allAverageValues = sourceCompanies.map((company) => company.avgReceiptValue[range]).filter((value) => value > 0);
  const minReceiptValue = allAverageValues.length ? Math.min(...allAverageValues) : 0;
  const maxReceiptValue = allAverageValues.length ? Math.max(...allAverageValues) : 0;
  const allExpenseAverageValues = sourceCompanies.map((company) => company.avgExpenseValue[range]).filter((value) => value > 0);
  const minExpenseValue = allExpenseAverageValues.length ? Math.min(...allExpenseAverageValues) : 0;
  const maxExpenseValue = allExpenseAverageValues.length ? Math.max(...allExpenseAverageValues) : 0;

  const seriesLength = sourceCompanies[0]?.receipts[range].length || 0;
  const receiptsSeries = Array.from({ length: seriesLength }, (_, index) =>
    sourceCompanies.reduce((sum, company) => sum + company.receipts[range][index], 0),
  );
  const previousPeriodSeries = receiptsSeries.map((value, index) => Math.round(value * (0.82 + (index % 3) * 0.04)));

  return {
    totalCompanies,
    subscribedCompanies,
    subscriptionRate: totalCompanies ? (subscribedCompanies / totalCompanies) * 100 : 0,
    activeCompanies,
    receiptsCount,
    totalReceiptValue,
    averageReceiptValue,
    minReceiptValue,
    maxReceiptValue,
    expensesAdded,
    totalExpenseValue,
    averageExpenseValue,
    minExpenseValue,
    maxExpenseValue,
    receiptsSeries,
    previousPeriodSeries,
  };
}

export function getIntegrationSummary(sourceCompanies = companies) {
  const integrationCounts = sourceCompanies.reduce(
    (acc, company) => {
      if (company.integrations.api) acc.api += 1;
      if (company.integrations.xero) acc.xero += 1;
      if (company.integrations.quickbooks) acc.quickbooks += 1;
      return acc;
    },
    { api: 0, xero: 0, quickbooks: 0 },
  );
  const total = integrationCounts.api + integrationCounts.xero + integrationCounts.quickbooks;
  return {
    ...integrationCounts,
    total,
    apiRate: total ? (integrationCounts.api / total) * 100 : 0,
    xeroRate: total ? (integrationCounts.xero / total) * 100 : 0,
    quickbooksRate: total ? (integrationCounts.quickbooks / total) * 100 : 0,
  };
}

export function isExpiringSoon(expiryDate) {
  const days = getDaysUntil(expiryDate);
  return days >= 0 && days <= 30;
}

export function getSubscriptionSummary(sourceCompanies = companies) {
  const active = sourceCompanies.filter((company) => company.subscriptionStatus === "active").length;
  const expired = sourceCompanies.filter((company) => company.subscriptionStatus === "expired").length;
  const pending = sourceCompanies.filter((company) => company.subscriptionStatus === "pending").length;
  const temporary = sourceCompanies.filter((company) => company.subscriptionStatus === "temporary").length;
  const expiringSoon = sourceCompanies.filter((company) => isExpiringSoon(company.expiryDate)).length;
  return { active, expired, pending, temporary, expiringSoon };
}

export function getRegionalActivity(range = "30d", sourceCompanies = companies) {
  const byRegion = sourceCompanies.reduce((acc, company) => {
    const receipts = company.receipts[range].reduce((sum, value) => sum + value, 0);
    const value = receipts * company.avgReceiptValue[range];
    const expensesAdded = company.expenses[range].reduce((sum, valueItem) => sum + valueItem, 0);
    const expenseValue = expensesAdded * company.avgExpenseValue[range];
    const region =
      company.addressMapping === "missing"
        ? "No address"
        : company.addressMapping === "unmapped"
          ? "Unmapped address"
          : company.region || "No address";
    const activeCompanies = company.activeCompanyEstimate?.[range] || (receipts > 0 ? 1 : 0);

    if (!acc[region]) {
      acc[region] = {
        region,
        companies: 0,
        activeCompanies: 0,
        receipts: 0,
        totalValue: 0,
        expensesAdded: 0,
        totalExpenseValue: 0,
      };
    }

    acc[region].companies += 1;
    acc[region].receipts += receipts;
    acc[region].totalValue += value;
    acc[region].expensesAdded += expensesAdded;
    acc[region].totalExpenseValue += expenseValue;
    acc[region].activeCompanies += activeCompanies;
    return acc;
  }, {});

  return Object.values(byRegion).sort((a, b) => b.activeCompanies - a.activeCompanies || b.receipts - a.receipts);
}

function hashString(value) {
  return Array.from(value).reduce((acc, char, index) => (acc + char.charCodeAt(0) * (index + 1)) % 100000, 0);
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function getCreditBand(score) {
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

export function getCompanyCreditProfile(company, rerunVersion = 0) {
  const receipts3m = company.receipts["3m"].reduce((sum, value) => sum + value, 0);
  const revenue3m = receipts3m * company.avgReceiptValue["3m"];
  const expenses3m = company.expenses["3m"].reduce((sum, value) => sum + value, 0);
  const hasRecentActivity = company.receipts["7d"].some((value) => value > 0);
  const activeMonths = company.receipts["3m"].filter((value) => value > 0).length;
  const idSeed = hashString(company.id);
  const rerunShift = ((rerunVersion + idSeed) % 7) - 3;

  const revenueConsistency = clampInt((revenue3m / 4500000) * 100 + rerunShift * 2, 5, 98);
  const activityTrajectory = clampInt(activeMonths * 11 + (hasRecentActivity ? 12 : -10) + rerunShift, 5, 98);
  const customerDiversification = clampInt((company.operators / 14) * 100 + (idSeed % 9) - 4, 8, 98);
  const transactionRhythm = clampInt((receipts3m / 5000) * 100 + rerunShift * 3, 5, 98);
  const buyerQuality = clampInt(55 + ((idSeed * 3) % 45) - company.receiptsSubmittedStuck * 4, 20, 99);
  const tenureTrackRecord = clampInt(
    ((new Date(TODAY).getTime() - new Date(company.dateJoined).getTime()) / (365 * MS_IN_DAY)) * 45 + 30 + rerunShift,
    10,
    98,
  );

  const score = clampInt(
    revenueConsistency * 0.22 +
      activityTrajectory * 0.2 +
      customerDiversification * 0.14 +
      transactionRhythm * 0.16 +
      buyerQuality * 0.12 +
      tenureTrackRecord * 0.16 -
      company.zReportsStuck * 1.5 -
      company.receiptsSubmittedStuck * 1.2,
    10,
    95,
  );

  const band = getCreditBand(score);
  const declineReasons = [];
  if (receipts3m === 0) declineReasons.push("No sales in window");
  if (activeMonths <= 1) declineReasons.push("Only 1 active month");
  if (revenue3m < 500000) declineReasons.push("Revenue below 500K floor");
  if (receipts3m < 5) declineReasons.push("Fewer than 5 invoices");
  if (!hasRecentActivity) declineReasons.push("Not active last 2 months");

  const suggestedLimit = clampInt(score * 10000 + revenue3m * 0.08, 0, 900000);
  const ready = score >= 60 && suggestedLimit >= 100000 && declineReasons.length === 0;
  const status = ready ? "Ready" : declineReasons.length ? "Not Ready" : "Pending";

  return {
    companyId: company.id,
    companyName: company.name,
    score,
    band,
    status,
    ready,
    suggestedLimit,
    lastEvaluatedAt: `2026-04-${String(20 + ((idSeed + rerunVersion) % 8)).padStart(2, "0")} 10:${String((idSeed + rerunVersion) % 60).padStart(2, "0")} EAT`,
    reasons: declineReasons.slice(0, 3),
    dimensions: {
      revenueConsistency,
      activityTrajectory,
      customerDiversification,
      transactionRhythm,
      buyerQuality,
      tenureTrackRecord,
    },
  };
}

export function getCreditDashboardMetrics(sourceCompanies = companies, rerunVersion = 0) {
  const profiles = sourceCompanies.map((company) => getCompanyCreditProfile(company, rerunVersion));
  const totalEvaluated = profiles.length;
  const readyCompanies = profiles.filter((profile) => profile.ready);
  const notReady = profiles.filter((profile) => profile.status === "Not Ready").length;
  const pending = profiles.filter((profile) => profile.status === "Pending").length;
  const eligibleLoanBook = readyCompanies.reduce((sum, profile) => sum + profile.suggestedLimit, 0);
  const medianLoan = readyCompanies.length
    ? readyCompanies
        .map((profile) => profile.suggestedLimit)
        .sort((a, b) => a - b)[Math.floor(readyCompanies.length / 2)]
    : 0;
  const riskBands = ["A", "B", "C", "D"].map((band) => {
    const inBand = profiles.filter((profile) => profile.band === band);
    return {
      band,
      count: inBand.length,
      book: inBand.reduce((sum, profile) => sum + profile.suggestedLimit, 0),
    };
  });
  const topEligible = [...readyCompanies]
    .sort((a, b) => b.score - a.score || b.suggestedLimit - a.suggestedLimit)
    .slice(0, 5);
  const reasonCounts = profiles
    .filter((profile) => !profile.ready)
    .flatMap((profile) => profile.reasons)
    .reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
  const declineReasonBreakdown = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    profiles,
    totalEvaluated,
    readyCount: readyCompanies.length,
    notReadyCount: notReady,
    pendingCount: pending,
    readyRate: totalEvaluated ? (readyCompanies.length / totalEvaluated) * 100 : 0,
    eligibleLoanBook,
    medianLoan,
    riskBands,
    topEligible,
    declineReasonBreakdown,
  };
}

export const computedMetrics = {
  totalCompanies: companies.length,
  activeCompaniesIssuing: getDashboardMetrics("30d").activeCompanies,
  nonActiveCompanies: companies.filter((company) => company.subscriptionStatus !== "active").length,
  subscribedCompanies: companies.filter((company) => company.subscriptionStatus === "active").length,
  expiredCompanies: companies.filter((company) => company.subscriptionStatus === "expired").length,
  apiClients: companies.filter((company) => company.apiClient).length,
  receiptsSubmittedStuck: companies.reduce((acc, company) => acc + company.receiptsSubmittedStuck, 0),
  zReportsStuck: companies.reduce((acc, company) => acc + company.zReportsStuck, 0),
};
