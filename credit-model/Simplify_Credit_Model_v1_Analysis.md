# Simplify Credit Scoring Model v1.0

**Status:** Built on invoice-level data. Ready for pilot decision.
**Date:** 21 April 2026
**Data window:** October 2025 – March 2026 (6 months)
**Cohort:** 226 current sole proprietor customers

---

## Executive summary

We scored the full current sole proprietor base (226 SMEs) using invoice-level transaction data pulled on 20 April 2026. The model identifies **24 SMEs eligible for a pilot working capital loan**, with a total potential loan book of **9.8M TZS** at suggested limits.

This is below the 50-SME target discussed earlier, but it reflects the honest state of the data. The main constraint is that 58% of the current sole proprietor base joined Simplify in the last 3 months and has insufficient transaction history to score confidently. Expanding the eligible pool requires either (a) waiting for newer customers to build history, (b) relaxing eligibility thresholds (which I've modeled and would only add ~8 more SMEs), or (c) accepting higher default risk.

The model uses six scoring dimensions weighted to 100 points, separates the "should we lend?" decision from the "how much?" decision, and penalises customer concentration heavily, which is what BlackSwan's model missed.

---

## What changed from BlackSwan's approach

BlackSwan's model used four dimensions (Activity, Stability, Volume, Trend) on monthly aggregate data. The fundamental issue was that it treated a business with 9M/month revenue and one buyer the same as a business with 4M/month revenue and 50 buyers. Same volume score, same stability score, very different actual risk.

This model has access to invoice-level data, so it measures what BlackSwan couldn't:

| Signal | What it captures | Why it matters |
|--------|------------------|----------------|
| Customer concentration (HHI, top buyer share) | Revenue dependency on single customers | Losing one buyer shouldn't kill the business |
| Repeat buyer ratio | Relationship stability | Repeat buyers = predictable cashflow |
| Buyer identification quality | Counterparty verifiability | Anonymous cash sales are harder to verify |
| Invoice rhythm (median/max days between invoices) | Operational continuity | Hidden dormant periods within active months |
| Transaction diversity | Business model (retail/wholesale/B2B) | Informs risk profile |

A concrete example from this cohort: Abel John Lugusi shows 9.4M TZS monthly revenue — BlackSwan would have rated him A-tier on volume and stability. But 94% of his revenue comes from 2 buyers. If either relationship breaks, his cashflow collapses. This model rates him C-tier (elevated risk) and caps his loan at 300K rather than the 1M he'd qualify for on BlackSwan's logic.

---

## Model architecture

### Design principles

**1. Quality score is separate from loan sizing.** The quality score (0-100) decides whether to lend. Revenue decides how much. This prevents the "big business = big loan regardless of risk" trap.

**2. Absolute thresholds, not percentile ranking.** A business with CV of 0.25 is consistent regardless of what the rest of the cohort looks like. This makes the model stable over time — scoring thresholds don't shift as the customer base changes.

**3. Explainable, not black-box.** Every score has a clear formula. No machine learning, no hidden weights. This matters because the model needs to be defensible to a lender (Wintrust), a borrower (if they ask why they were declined), and a regulator (when Simplify applies for its own Tier 2 licence).

**4. Invoice-level signals are first-class inputs.** These are proprietary to Simplify — no bureau, no external scorer has access to them. They are the competitive moat.

### Eligibility gates (hard filters)

A business must pass ALL four gates to be scored as eligible, regardless of quality score:

| Gate | Threshold | Why |
|------|-----------|-----|
| Active months | At least 2 of 6 | Need minimum 2 data points to see a pattern |
| Total invoices | At least 5 | Minimum evidence of real business activity |
| Recent activity | At least 1 of last 2 months | Must still be operating |
| Median monthly sales | At least 500K TZS | Floor to ensure capacity to service even a small loan |

### Scoring dimensions (100 points)

| Dimension | Weight | What it measures | Key threshold |
|-----------|--------|------------------|---------------|
| Revenue Consistency | 20 | CV of monthly sales across active months | CV ≤ 0.30 = strong |
| Activity & Trajectory | 20 | Active months (40%) + recency (30%) + trend (30%) | All 6 months active + recent + growing = top |
| Customer Diversification | 20 | Top buyer share (50%) + HHI (30%) + repeat buyer ratio (20%) | Top buyer ≤ 25% = strong |
| Transaction Rhythm | 15 | Median days between invoices (50%) + max gap (50%) | Weekly rhythm = strong |
| Buyer Quality | 15 | % revenue identified (70%) + % revenue with TIN (30%) | 90%+ identified = strong |
| Tenure & Track Record | 10 | Months on Simplify (60%) + invoice volume (40%) | 12+ months + 60+ invoices = strong |

### Risk bands and loan sizing

| Band | Quality score | Loan multiplier | Behaviour |
|------|---------------|-----------------|-----------|
| A – Low Risk | ≥ 75 | 1.2x base | Auto-approve |
| B – Moderate Risk | 60–74 | 1.0x base | Approve |
| C – Elevated Risk | 45–59 | 0.7x base | Approve with closer monitoring |
| D – Decline | < 45 or failed gate | — | Not eligible |

**Loan sizing formula:**

```
base_loan   = median_monthly_sales × 15%
tier_loan   = base_loan × tier_multiplier
final_loan  = tier_loan × concentration_penalty
final_loan  = min(final_loan, 1,000,000)     # cap
final_loan  = 0 if final_loan < 100,000       # floor
```

**Concentration penalty:**

| Top buyer share | Multiplier | Rationale |
|-----------------|-----------|-----------|
| ≤ 50% | 1.00 | Diversified |
| 50–70% | 0.75 | Moderate concentration |
| 70–85% | 0.50 | High concentration |
| > 85% | 0.30 | Single-buyer dependence |

---

## Results

### Cohort breakdown

| Status | Count | % |
|--------|-------|---|
| **Eligible** | **24** | **11%** |
| Declined | 202 | 89% |
| Total | 226 | 100% |

### Decline reasons (top)

| Reason | Count |
|--------|-------|
| No sales activity in window | 81 |
| Only 1 active month | 75 |
| Computed loan limit below 100K floor | 6 |
| Fewer than 5 invoices (3–4 only) | 6 |
| Revenue below 500K floor | 7 |
| Not active in last 2 months | 2 |

**Key insight:** 156 of the 202 declines (77%) are simply customers too new or too sporadic to score yet, not "bad" borrowers. These should be re-scored monthly as they build transaction history.

### Eligible cohort by risk band

| Band | Count | Median quality score | Median monthly revenue | Median loan | Total book |
|------|-------|---------------------|------------------------|-------------|------------|
| A – Low Risk | 4 | 80.0 | 2.37M TZS | 430K | 1.7M |
| B – Moderate Risk | 12 | 64.0 | 3.89M TZS | 280K | 4.0M |
| C – Elevated Risk | 8 | 56.7 | 8.84M TZS | 290K | 4.0M |
| **Total eligible** | **24** |   |   |   | **9.8M** |

Notice that Band C has HIGHER median revenue than Band A. This is not a bug — it's the model correctly penalising high-turnover businesses with poor customer diversification or short tenure. The 4.5M-revenue-but-single-buyer business is genuinely riskier than the 2.4M-revenue-but-141-buyers business.

### Top 5 eligible SMEs (illustrative)

| Rank | Client | Quality Score | Band | Loan | Key signal |
|------|--------|--------------|------|------|------------|
| 1 | NAIMA ASHTONI MBIRU | 84.4 | A | 740K | 577 invoices, 141 unique buyers, top buyer 10% |
| 2 | BENARD JOHN IKOMBE | 81.4 | A | 140K | 271 buyers but small revenue — loan sized to capacity |
| 3 | AWADHI MOHAMED ALLY | 78.6 | A | 160K | 100% identified revenue, diverse buyers |
| 4 | SUZANA CLEMENCE MPINGE | 78.2 | A | 700K | 363 invoices, diversified, healthy rhythm |
| 5 | STANLEY ADAM KADURI | 73.2 | B | 490K | Only 3 active months but 100% identified revenue, good diversification |

---

## Cross-check against BlackSwan

Six of the 24 eligible SMEs also appeared in BlackSwan's earlier dataset. The comparison:

| Client | New score | New band | BlackSwan band | Difference |
|--------|-----------|----------|----------------|------------|
| Raphael Amos Ndimbo | 63.8 | B | A – Low Risk | Downgraded due to 100% buyer concentration |
| James Clemence Mande | 57.6 | C | B – Moderate | Downgraded due to concentration (top1 60%) |
| Abel John Lugusi | 47.5 | C | B – Moderate | Downgraded due to 94% concentration |
| Michael Julius Ghentanyi | 67.0 | B | B – Moderate | Agreement |
| Stanley Jonathan Katemba | 58.7 | C | C – High Risk | Agreement |
| Rhoda Elias Mwita | 67.0 | B | B – Moderate | Agreement |

In every case where the two models disagreed, the new model is more conservative. The disagreement comes entirely from concentration risk that BlackSwan couldn't see.

---

## Honest limitations

**1. No outcome data.** This is a scoring framework, not a predictive model in the statistical sense. Neither this model nor BlackSwan's has been validated against actual loan repayment. The first pilot cohort will generate the outcome data needed to calibrate and validate.

**2. Short tenure base.** 58% of current sole proprietors joined in the last 3 months. This pushes the Tenure dimension toward low scores across much of the base. As Simplify grows and customers mature, the eligible pool will expand naturally.

**3. Buyer TIN coverage is 9%, not 50%.** The concept note to Mkombozi overstated this. The model compensates by using customer names (52% of invoices) as a weaker identity signal, but TIN verification is the strongest form of identification and this base doesn't have much of it.

**4. Cross-seller buyer network is thin.** Only 8 TIN buyers appear across 2+ sellers. Too sparse to use as a scoring signal yet. Revisit in model v2 when the data is denser.

**5. Concentration thresholds are judgment calls.** I've set them at 50/70/85% based on standard credit practice, but they're not validated against Tanzanian SME default patterns specifically. Should be reviewed after the pilot.

---

## Recommendation for Wintrust pilot

**Wave 1 — Band A only (4 SMEs, 1.7M TZS book):**
Start with the safest cohort. These 4 SMEs have high scores, diversified buyers, long tenure, and identified revenue. If any of them defaults, we have a serious problem with the model.

**Wave 2 — Add Band B (16 SMEs cumulative, 5.7M TZS book):**
After Wave 1 completes one full 30-day cycle without defaults, add Band B. These are the core of the pilot.

**Wave 3 — Add Band C (24 SMEs cumulative, 9.8M TZS book):**
After Wave 2 completes, add Band C with closer monitoring. If Band C default rate exceeds 10%, tighten thresholds or pull them from the next cycle.

**Monthly re-scoring:**
Run the model monthly against the latest 6-month rolling window. As new customers build history, the eligible pool will expand. Track which declined customers become eligible over time to understand natural conversion.

**Full pilot exposure is well within your 100M TZS capital allocation.** The model is deliberately conservative — you'll have significant headroom to take more risk as data comes in.

---

## Next steps

1. **Share the Excel file with the Simplify ops team** for contact and communication with the 24 eligible SMEs.
2. **Hand the Python code to dev** for integration into the Simplify dashboard. The model is designed to run monthly against the latest 6-month window. Takes about 10 seconds to score the full base.
3. **Set up the outcome tracking spreadsheet** before disbursing. Every loan needs to be tracked by: disbursement date, amount, due date, repayment date, outcome (on-time, late-days, default). This is the dataset the next version of the model trains on.
4. **Review the concentration thresholds** with the Wintrust team before going live. They may have a different view on acceptable concentration for their risk appetite.
5. **Revisit the 500K revenue floor** after the first 3 months. It may be too conservative — or too loose — depending on what the outcome data shows.

---

## Files

- **`Simplify_Credit_Scores.xlsx`** — 5 sheets: Summary, Eligible Cohort (for pilot), All Scored (full 226), Decline Reasons, Model Parameters
- **`credit_model.py`** — Full scoring pipeline. Run monthly against the latest data dump. Requires only two tables: Company and Sales.
