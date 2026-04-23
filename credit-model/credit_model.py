"""
Simplify SME Credit Scoring Model v1.0
========================================
Author: Simplify credit design process
Date: April 2026

Purpose:
    Score Simplify sole-proprietor customers for short-term working capital
    loans (1M TZS cap, 30-day tenor, 5% monthly interest, unsecured).
    Pilot lender: Wintrust Microfinance.

Design principles:
    1. Quality score (approval) is SEPARATE from loan sizing (amount).
       This prevents the common trap of auto-approving high-revenue
       businesses regardless of actual risk profile.

    2. Scoring uses ABSOLUTE thresholds, not percentile ranking within
       the cohort. A business with CV of 0.25 is "consistent" regardless
       of what the rest of the cohort looks like.

    3. All thresholds are explicit and adjustable — no black-box ML.
       The model must be defensible to a lender, a borrower, and a
       regulator.

    4. Invoice-level signals (concentration, rhythm, buyer quality) are
       first-class inputs, not afterthoughts. These are Simplify's
       proprietary advantage over generic bureau scoring.

Inputs required (monthly refresh):
    Company table:   tin, UIN, client_name, joined_simplify
    Sales table:     tin, issued_at, total_tax_including,
                     customerIdType, customerId, customerName

Output:
    Per-SME: quality_score (0-100), risk_band (A/B/C/D),
             eligible (True/False), suggested_limit_TZS,
             decline_reason, all component scores and features.
"""

import pandas as pd
import numpy as np
from datetime import datetime


# ============================================================================
# CONFIGURATION
# ============================================================================

# Loan product parameters
MAX_LOAN_TZS = 1_000_000
MIN_LOAN_TZS = 100_000
LOAN_TENOR_DAYS = 30
INTEREST_RATE_MONTHLY = 0.05

# Data window (6 months rolling)
WINDOW_MONTHS = 6

# Hard eligibility gates (applied BEFORE scoring)
GATES = {
    'min_active_months': 2,
    'min_total_invoices': 5,
    'min_recent_2m_active': 1,
    'min_median_monthly_sales_TZS': 500_000,
}

# Scoring dimensions — weights sum to 100
DIMENSIONS = {
    'revenue_consistency':    20,  # How stable is revenue month to month
    'activity_trajectory':    20,  # How active and trending which way
    'customer_diversification': 20,  # How concentrated is revenue in few buyers
    'transaction_rhythm':     15,  # How regular is the invoice cadence
    'buyer_quality':          15,  # How identifiable and verifiable are buyers
    'tenure_track_record':    10,  # How long on Simplify and invoice volume
}
assert sum(DIMENSIONS.values()) == 100

# Risk band thresholds (applied to quality_score 0-100)
RISK_BANDS = [
    (75, 'A - Low Risk'),
    (60, 'B - Moderate Risk'),
    (45, 'C - Elevated Risk'),
    (0,  'D - Decline'),
]


# ============================================================================
# FEATURE ENGINEERING
# ============================================================================

def clean_invoice_data(sales_df, min_amount=100):
    """
    Remove junk invoices (< min_amount TZS are test/error transactions).
    Normalize dates and create buyer keys.
    """
    df = sales_df[sales_df['total_tax_including'] >= min_amount].copy()
    df['issued_at'] = pd.to_datetime(df['issued_at'])
    df['month'] = df['issued_at'].dt.to_period('M')

    # Buyer identity: prefer TIN, fall back to name, else anonymous
    def make_buyer_key(row):
        if row['customerIdType'] == 'TYPE_TIN' and pd.notna(row['customerId']):
            return f"TIN:{int(row['customerId'])}"
        if pd.notna(row['customerName']):
            name = str(row['customerName']).strip().upper()
            if len(name) >= 2:
                return f"NAME:{name}"
        return "ANON"

    df['buyer_key'] = df.apply(make_buyer_key, axis=1)
    df['is_identified'] = df['buyer_key'] != 'ANON'
    df['has_tin'] = df['customerIdType'] == 'TYPE_TIN'
    return df


def compute_features(sales_clean, company_df, window_start, window_end, as_of_date):
    """
    Compute per-seller features for scoring.

    Args:
        sales_clean: Output of clean_invoice_data()
        company_df: Company table (tin, UIN, client_name, joined_simplify, ...)
        window_start, window_end: 6-month analysis window (pd.Timestamp)
        as_of_date: Reference date for tenure calculation

    Returns:
        DataFrame with one row per seller, feature columns.
    """
    all_months = pd.period_range(window_start, window_end, freq='M')
    last_2m = all_months[-2:]
    last_3m = all_months[-3:]
    window_mid = window_start + (window_end - window_start) / 2

    rows = []
    for tin, g in sales_clean.groupby('tin'):
        n_invoices = len(g)
        total_sales = g['total_tax_including'].sum()

        # Monthly aggregates
        monthly_sales = g.groupby('month')['total_tax_including'].sum().reindex(all_months, fill_value=0)
        monthly_receipts = g.groupby('month').size().reindex(all_months, fill_value=0)
        active_months = int((monthly_sales > 0).sum())
        active_sales = monthly_sales[monthly_sales > 0]

        median_active = float(active_sales.median()) if len(active_sales) else 0.0
        min_active = float(active_sales.min()) if len(active_sales) else 0.0
        mean_active = float(active_sales.mean()) if len(active_sales) else 0.0

        # Revenue stability (CV across active months)
        sales_cv = float(active_sales.std() / active_sales.mean()) if len(active_sales) >= 2 and active_sales.mean() > 0 else np.nan

        # Revenue trend (linear slope, normalized)
        if active_months >= 3:
            x = np.arange(len(all_months))[monthly_sales.values > 0]
            y = monthly_sales.values[monthly_sales.values > 0]
            slope = float(np.polyfit(x, y / y.mean(), 1)[0]) if y.mean() > 0 else 0.0
        else:
            slope = 0.0

        # Recency
        recent_2m = int((monthly_sales[last_2m] > 0).sum())
        recent_3m = int((monthly_sales[last_3m] > 0).sum())

        # Longest gap in months
        flags = (monthly_sales > 0).values
        max_gap = cur = 0
        for a in flags:
            if not a:
                cur += 1
                max_gap = max(max_gap, cur)
            else:
                cur = 0

        # Customer concentration
        buyer_rev = g.groupby('buyer_key')['total_tax_including'].sum()
        shares = buyer_rev / buyer_rev.sum()
        hhi = float((shares ** 2).sum())
        top1_share = float(shares.max())
        top3_share = float(shares.nlargest(3).sum())
        n_buyers = int(len(buyer_rev))

        # Buyer growth: unique buyers first half vs second half
        first_half_buyers = g[g['issued_at'] < window_mid]['buyer_key'].nunique()
        second_half_buyers = g[g['issued_at'] >= window_mid]['buyer_key'].nunique()
        if first_half_buyers > 0:
            buyer_growth = (second_half_buyers - first_half_buyers) / first_half_buyers
        elif second_half_buyers > 0:
            buyer_growth = 1.0
        else:
            buyer_growth = 0.0
        buyer_growth = float(np.clip(buyer_growth, -1.0, 2.0))

        # Invoice rhythm
        dates = sorted(g['issued_at'].dt.normalize().unique())
        if len(dates) >= 2:
            gaps = [(pd.Timestamp(dates[i+1]) - pd.Timestamp(dates[i])).days for i in range(len(dates)-1)]
            median_gap = float(np.median(gaps))
            max_gap_days = int(np.max(gaps))
        else:
            median_gap = np.nan
            max_gap_days = np.nan

        # Ticket profile
        median_ticket = float(g['total_tax_including'].median())
        mean_ticket = float(g['total_tax_including'].mean())
        ticket_cv = float(g['total_tax_including'].std() / mean_ticket) if n_invoices >= 3 and mean_ticket > 0 else np.nan

        # Buyer identification quality
        pct_rev_identified = float(g[g['is_identified']]['total_tax_including'].sum() / total_sales) if total_sales > 0 else 0.0
        pct_rev_tin = float(g[g['has_tin']]['total_tax_including'].sum() / total_sales) if total_sales > 0 else 0.0

        # Repeat buyer ratio (excluding anonymous)
        buyer_inv_counts = g.groupby('buyer_key').size()
        non_anon = buyer_inv_counts[buyer_inv_counts.index != 'ANON']
        repeat_ratio = float((non_anon >= 2).sum() / len(non_anon)) if len(non_anon) > 0 else 0.0

        rows.append({
            'tin': tin,
            'n_invoices': n_invoices,
            'total_sales_6m': total_sales,
            'active_months': active_months,
            'median_active_sales': median_active,
            'min_active_sales': min_active,
            'mean_active_sales': mean_active,
            'sales_cv': sales_cv,
            'sales_trend_slope': slope,
            'recent_2m_active': recent_2m,
            'recent_3m_active': recent_3m,
            'longest_gap_months': max_gap,
            'n_unique_buyers': n_buyers,
            'hhi': hhi,
            'top1_buyer_share': top1_share,
            'top3_buyer_share': top3_share,
            'buyer_growth': buyer_growth,
            'median_gap_days': median_gap,
            'max_gap_days': max_gap_days,
            'median_ticket': median_ticket,
            'mean_ticket': mean_ticket,
            'ticket_cv': ticket_cv,
            'pct_revenue_identified': pct_rev_identified,
            'pct_revenue_tin': pct_rev_tin,
            'repeat_buyer_ratio': repeat_ratio,
        })

    features = pd.DataFrame(rows)

    # Merge with company metadata
    meta = company_df[['tin','UIN','client_name','owner_name','joined_simplify','email','phone','address']].copy()
    meta['joined_simplify'] = pd.to_datetime(meta['joined_simplify'])
    features = features.merge(meta, on='tin', how='left')
    features['tenure_months'] = ((pd.Timestamp(as_of_date) - features['joined_simplify']).dt.days / 30).round(1)

    # Add inactive companies (no sales) for completeness
    scored_tins = set(features['tin'])
    inactive = company_df[~company_df['tin'].isin(scored_tins)].copy()
    inactive['joined_simplify'] = pd.to_datetime(inactive['joined_simplify'])
    inactive['tenure_months'] = ((pd.Timestamp(as_of_date) - inactive['joined_simplify']).dt.days / 30).round(1)
    # Fill all other columns with zeros/NaN
    for col in features.columns:
        if col not in inactive.columns:
            inactive[col] = 0 if features[col].dtype in [np.int64, np.float64] else np.nan
    inactive = inactive[features.columns]
    features = pd.concat([features, inactive], ignore_index=True)

    return features


# ============================================================================
# SCORING DIMENSIONS — each returns 0-100
# ============================================================================

def score_revenue_consistency(row):
    """
    Lower CV = more consistent = higher score.
    CV measures how much monthly sales vary around their mean.
    """
    cv = row['sales_cv']
    if pd.isna(cv):
        return 40  # Single active month — neutral
    if cv <= 0.15: return 100
    if cv <= 0.30: return 85
    if cv <= 0.50: return 65
    if cv <= 0.75: return 45
    if cv <= 1.00: return 25
    return 10


def score_activity_trajectory(row):
    """
    Combines: active months (40%), recency (30%), trend (30%).
    """
    # Active months (0-40)
    m = row['active_months']
    active_pts = {6: 40, 5: 35, 4: 28, 3: 20, 2: 12, 1: 5, 0: 0}.get(m, 0)

    # Recency (0-30) — must be currently active
    r2 = row['recent_2m_active']
    r3 = row['recent_3m_active']
    if r2 == 2:      recency_pts = 30
    elif r2 == 1:    recency_pts = 20
    elif r3 >= 1:    recency_pts = 8
    else:            recency_pts = 0

    # Trend (0-30) — normalized slope
    slope = row['sales_trend_slope']
    if pd.isna(slope) or slope == 0:
        trend_pts = 15  # neutral
    elif slope >= 0.15:  trend_pts = 30   # strong growth
    elif slope >= 0.05:  trend_pts = 25   # mild growth
    elif slope >= -0.05: trend_pts = 18   # flat
    elif slope >= -0.15: trend_pts = 10   # mild decline
    else:                trend_pts = 3    # severe decline

    return active_pts + recency_pts + trend_pts


def score_customer_diversification(row):
    """
    Combines: top buyer share (50%), HHI (30%), repeat buyer ratio (20%).
    """
    # Top 1 buyer share (0-50) — lower concentration = higher score
    t1 = row['top1_buyer_share']
    if t1 <= 0.25:   t1_pts = 50
    elif t1 <= 0.40: t1_pts = 42
    elif t1 <= 0.55: t1_pts = 32
    elif t1 <= 0.70: t1_pts = 22
    elif t1 <= 0.85: t1_pts = 12
    else:            t1_pts = 4   # single-buyer risk

    # HHI (0-30)
    hhi = row['hhi']
    if hhi <= 0.15:  hhi_pts = 30
    elif hhi <= 0.25: hhi_pts = 24
    elif hhi <= 0.40: hhi_pts = 16
    elif hhi <= 0.60: hhi_pts = 8
    else:            hhi_pts = 2

    # Repeat buyer ratio (0-20)
    rep = row['repeat_buyer_ratio']
    if rep >= 0.40:  rep_pts = 20
    elif rep >= 0.25: rep_pts = 15
    elif rep >= 0.15: rep_pts = 10
    elif rep >= 0.05: rep_pts = 5
    else:            rep_pts = 2

    return t1_pts + hhi_pts + rep_pts


def score_transaction_rhythm(row):
    """
    Regular, frequent invoicing suggests active, healthy trading.
    Combines: median gap days (50%) and max gap days (50%).
    """
    mg = row['median_gap_days']
    max_g = row['max_gap_days']

    if pd.isna(mg):
        return 30  # Too few invoices

    # Median gap (0-50)
    if mg <= 3:     median_pts = 50
    elif mg <= 7:   median_pts = 42
    elif mg <= 14:  median_pts = 32
    elif mg <= 21:  median_pts = 22
    elif mg <= 30:  median_pts = 12
    else:           median_pts = 5

    # Max gap (0-50) — catches hidden dormancy
    if max_g <= 14:   max_pts = 50
    elif max_g <= 30: max_pts = 40
    elif max_g <= 60: max_pts = 25
    elif max_g <= 90: max_pts = 12
    else:             max_pts = 3

    return median_pts + max_pts


def score_buyer_quality(row):
    """
    Revenue from identified buyers (name or TIN) is easier to verify and
    lower-risk than anonymous walk-in revenue.
    Combines: % revenue identified (70%), % revenue TIN (30%).
    """
    pct_id = row['pct_revenue_identified']
    pct_tin = row['pct_revenue_tin']

    # % revenue identified (0-70)
    if pct_id >= 0.90:   id_pts = 70
    elif pct_id >= 0.70: id_pts = 58
    elif pct_id >= 0.50: id_pts = 42
    elif pct_id >= 0.30: id_pts = 25
    elif pct_id >= 0.15: id_pts = 12
    else:               id_pts = 3

    # % revenue TIN (0-30) — highest quality identification
    if pct_tin >= 0.50:  tin_pts = 30
    elif pct_tin >= 0.25: tin_pts = 22
    elif pct_tin >= 0.10: tin_pts = 14
    elif pct_tin >= 0.03: tin_pts = 7
    else:                tin_pts = 2

    return id_pts + tin_pts


def score_tenure_track_record(row):
    """
    Longer on Simplify + more invoices = more data = more trust.
    Combines: tenure months (60%), invoice volume (40%).
    """
    t = row.get('tenure_months', 0)
    n = row['n_invoices']

    # Tenure (0-60)
    if t >= 12:   tenure_pts = 60
    elif t >= 9:  tenure_pts = 50
    elif t >= 6:  tenure_pts = 40
    elif t >= 4:  tenure_pts = 28
    elif t >= 2:  tenure_pts = 18
    else:         tenure_pts = 8

    # Invoice volume (0-40)
    if n >= 60:    volume_pts = 40
    elif n >= 30:  volume_pts = 32
    elif n >= 15:  volume_pts = 24
    elif n >= 8:   volume_pts = 15
    elif n >= 3:   volume_pts = 7
    else:          volume_pts = 2

    return tenure_pts + volume_pts


# ============================================================================
# ELIGIBILITY GATES
# ============================================================================

def apply_eligibility_gates(row):
    """
    Hard gates applied before scoring. Returns (eligible, decline_reasons).
    A business failing ANY gate is declined regardless of quality score.
    """
    reasons = []

    if row['n_invoices'] == 0:
        return False, "No sales activity in window"

    if row['active_months'] < GATES['min_active_months']:
        reasons.append(f"Only {row['active_months']} active month(s), need {GATES['min_active_months']}")

    if row['n_invoices'] < GATES['min_total_invoices']:
        reasons.append(f"Only {row['n_invoices']} invoices, need {GATES['min_total_invoices']}")

    if row['recent_2m_active'] < GATES['min_recent_2m_active']:
        reasons.append("Not active in last 2 months")

    if row['median_active_sales'] < GATES['min_median_monthly_sales_TZS']:
        reasons.append(f"Median monthly revenue {row['median_active_sales']/1000:.0f}K TZS below floor of {GATES['min_median_monthly_sales_TZS']/1000:.0f}K")

    return len(reasons) == 0, "; ".join(reasons) if reasons else ""


# ============================================================================
# LOAN SIZING
# ============================================================================

def compute_loan_limit(row):
    """
    Loan sizing is separate from quality score.
    Formula:
        base = 15% of median monthly sales
        x tier multiplier (A=1.2, B=1.0, C=0.7)
        x concentration penalty (if top1 > 50%, multiplier reduces)
        capped at MAX_LOAN_TZS, floored at MIN_LOAN_TZS (or zero if below floor).
    """
    if not row['eligible']:
        return 0

    median_rev = row['median_active_sales']

    # Base: 15% of median monthly sales
    base = median_rev * 0.15

    # Tier multiplier
    band = row['risk_band']
    if 'A -' in band:   tier_mult = 1.20
    elif 'B -' in band: tier_mult = 1.00
    elif 'C -' in band: tier_mult = 0.70
    else:               return 0

    # Concentration penalty (layered risk adjustment)
    top1 = row['top1_buyer_share']
    if top1 > 0.85:   conc_mult = 0.30  # single buyer = severe penalty
    elif top1 > 0.70: conc_mult = 0.50
    elif top1 > 0.50: conc_mult = 0.75
    else:             conc_mult = 1.00

    raw_limit = base * tier_mult * conc_mult

    # Apply cap and floor
    limit = min(raw_limit, MAX_LOAN_TZS)
    if limit < MIN_LOAN_TZS:
        return 0  # Too small to be viable

    # Round to nearest 10,000 TZS
    return int(round(limit / 10_000) * 10_000)


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def run_scoring(sales_df, company_df, window_start, window_end, as_of_date):
    """
    Full pipeline: clean → features → score → eligibility → loan limit.
    Returns a scored DataFrame.
    """
    # 1. Clean
    sales = clean_invoice_data(sales_df)

    # 2. Features
    features = compute_features(sales, company_df, window_start, window_end, as_of_date)

    # 3. Eligibility gates
    gate_results = features.apply(apply_eligibility_gates, axis=1, result_type='expand')
    gate_results.columns = ['eligible', 'decline_reason']
    features = pd.concat([features, gate_results], axis=1)

    # 4. Component scores (all SMEs, but ineligible ones get 0 quality_score)
    features['score_revenue_consistency']    = features.apply(score_revenue_consistency, axis=1)
    features['score_activity_trajectory']    = features.apply(score_activity_trajectory, axis=1)
    features['score_customer_diversification'] = features.apply(score_customer_diversification, axis=1)
    features['score_transaction_rhythm']     = features.apply(score_transaction_rhythm, axis=1)
    features['score_buyer_quality']          = features.apply(score_buyer_quality, axis=1)
    features['score_tenure_track_record']    = features.apply(score_tenure_track_record, axis=1)

    # 5. Weighted quality score
    features['quality_score'] = (
        features['score_revenue_consistency']    * DIMENSIONS['revenue_consistency']    / 100 +
        features['score_activity_trajectory']    * DIMENSIONS['activity_trajectory']    / 100 +
        features['score_customer_diversification'] * DIMENSIONS['customer_diversification'] / 100 +
        features['score_transaction_rhythm']     * DIMENSIONS['transaction_rhythm']     / 100 +
        features['score_buyer_quality']          * DIMENSIONS['buyer_quality']          / 100 +
        features['score_tenure_track_record']    * DIMENSIONS['tenure_track_record']    / 100
    ).round(1)

    # 6. Risk bands
    def assign_band(row):
        if not row['eligible']:
            return 'D - Decline'
        for threshold, label in RISK_BANDS:
            if row['quality_score'] >= threshold:
                return label
        return 'D - Decline'
    features['risk_band'] = features.apply(assign_band, axis=1)

    # 7. Loan limit
    features['suggested_limit_TZS'] = features.apply(compute_loan_limit, axis=1)

    # 8. If suggested_limit == 0 despite being eligible, mark ineligible
    zero_limit_but_eligible = features['eligible'] & (features['suggested_limit_TZS'] == 0)
    features.loc[zero_limit_but_eligible, 'eligible'] = False
    features.loc[zero_limit_but_eligible, 'decline_reason'] = 'Computed loan limit below 100K TZS floor'
    features.loc[zero_limit_but_eligible, 'risk_band'] = 'D - Decline'

    return features


if __name__ == '__main__':
    # Example run
    company = pd.read_excel("NEW_ADVANCED_CREDIT_DATA.xlsx", sheet_name='Company')
    sales = pd.read_excel("NEW_ADVANCED_CREDIT_DATA.xlsx", sheet_name='Sales')

    window_start = pd.Timestamp('2025-10-01')
    window_end = pd.Timestamp('2026-03-31')
    as_of = pd.Timestamp('2026-04-21')

    scored = run_scoring(sales, company, window_start, window_end, as_of)
    print(f"\nScored {len(scored)} SMEs")
    print(f"Eligible: {scored['eligible'].sum()}")
    print(f"\nBand distribution:")
    print(scored['risk_band'].value_counts().sort_index())
