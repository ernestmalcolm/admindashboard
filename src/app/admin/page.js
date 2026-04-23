"use client";

import {
  Badge,
  Button,
  Card,
  Grid,
  GridCol,
  Group,
  Progress,
  Select,
  Stack,
  Text,
  Tooltip,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RegionalActivityOverview } from "@/components/admin/regional-activity-overview";
import { useAuth } from "@/lib/auth-context";
import {
  companies,
  getDashboardMetrics,
  getIntegrationSummary,
  getRegionalActivity,
} from "@/lib/mock-data";
import { exportRowsToCsv } from "@/lib/export-utils";

const RANGE_DAYS = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "60d": 60,
  "3m": 90,
  "6m": 180,
  "12m": 365,
};
const BASE_DATE = new Date("2026-04-20");
const PRESET_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "60d", label: "Last 60 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Custom date range" },
];

function formatCurrency(value) {
  return `TSh ${new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 }).format(value);
}

function getOnboardedWithinRange(range) {
  const threshold = new Date(BASE_DATE);
  threshold.setDate(threshold.getDate() - RANGE_DAYS[range]);
  return companies.filter(
    (company) => new Date(company.dateJoined) >= threshold,
  ).length;
}

export default function AdminDashboardPage() {
  const { can } = useAuth();
  const canViewFinanceNumbers = can("dashboard.finance.view");
  const [presetRange, setPresetRange] = useState("30d");
  const [customRange, setCustomRange] = useState([null, null]);

  const resolvedRange = useMemo(() => {
    if (presetRange !== "custom") {
      if (presetRange === "7d" || presetRange === "30d" || presetRange === "3m") return presetRange;
      if (presetRange === "14d") return "7d";
      if (presetRange === "60d") return "30d";
      return "3m";
    }

    const [start, end] = customRange;
    if (!start || !end) return "30d";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    if (days <= 14) return "7d";
    if (days <= 60) return "30d";
    return "3m";
  }, [presetRange, customRange]);

  const metrics = getDashboardMetrics(resolvedRange, companies);
  const integrations = getIntegrationSummary(companies);
  const regionalData = getRegionalActivity(resolvedRange, companies);
  const onboardedWithinRange = getOnboardedWithinRange(resolvedRange);
  const subscribedCount = companies.filter(
    (company) => company.subscriptionStatus === "active",
  ).length;
  const temporaryPendingCount = companies.filter(
    (company) =>
      company.subscriptionStatus === "temporary" ||
      company.subscriptionStatus === "pending",
  ).length;
  const expiredCount = companies.filter(
    (company) => company.subscriptionStatus === "expired",
  ).length;
  const companiesUsingIntegrations = companies.filter(
    (company) =>
      company.integrations.api ||
      company.integrations.xero ||
      company.integrations.quickbooks,
  ).length;
  const subscriptionRateAllStatuses = metrics.totalCompanies
    ? (subscribedCount / metrics.totalCompanies) * 100
    : 0;

  const staticTopCards = [
    {
      label: "All Onboarded Companies",
      value: metrics.totalCompanies,
      hint: "All time",
    },
    {
      label: "Subscription Rate",
      value: `${subscriptionRateAllStatuses.toFixed(1)}%`,
      hint: `Subscribed ${subscribedCount} | Temp/Pending ${temporaryPendingCount} | Expired ${expiredCount}`,
    },
    {
      label: "Integrations (Companies Using)",
      value: companiesUsingIntegrations,
      hint: `API ${integrations.api} | Xero ${integrations.xero} | QB ${integrations.quickbooks}`,
    },
  ];

  const dynamicCards = [
    {
      label: "Onboarded Companies",
      value: onboardedWithinRange,
      hint: "",
    },
    {
      label: "Active Companies",
      value: metrics.activeCompanies,
      hint: "",
    },
    {
      label: "Receipts Created",
      value: formatNumber(metrics.receiptsCount),
      hint: "",
    },
    {
      label: "Expenses Added",
      value: formatNumber(metrics.expensesAdded),
      hint: "",
    },
  ];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Title order={2}>Dashboard</Title>
      </Group>

      <Grid align="stretch">
        {staticTopCards.map((card) => (
          <GridCol key={card.label} span={{ base: 12, sm: 6, lg: 4 }}>
            <Card
              withBorder
              p="md"
              h="100%"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                {card.label}
              </Text>
              <Text fw={800} fz={34} lh={1.2}>
                {card.value}
              </Text>
              {card.label === "Integrations (Companies Using)" ? (
                <Stack gap={6} mt={6}>
                  <Text size="xs" c="dimmed">
                    API {integrations.api} | Xero {integrations.xero} | QuickBooks {integrations.quickbooks}
                  </Text>
                  <Progress.Root size={7}>
                    <Tooltip
                      label={`API: ${integrations.api} companies (${integrations.apiRate.toFixed(1)}%)`}
                      withArrow
                      arrowSize={6}
                      color="dark"
                      radius="md"
                    >
                      <Progress.Section
                        value={integrations.apiRate}
                        color="gray"
                        style={{ cursor: "pointer" }}
                      />
                    </Tooltip>
                    <Tooltip
                      label={`Xero: ${integrations.xero} companies (${integrations.xeroRate.toFixed(1)}%)`}
                      withArrow
                      arrowSize={6}
                      color="blue"
                      radius="md"
                    >
                      <Progress.Section
                        value={integrations.xeroRate}
                        color="blue"
                        style={{ cursor: "pointer" }}
                      />
                    </Tooltip>
                    <Tooltip
                      label={`QuickBooks: ${integrations.quickbooks} companies (${integrations.quickbooksRate.toFixed(1)}%)`}
                      withArrow
                      arrowSize={6}
                      color="green"
                      radius="md"
                    >
                      <Progress.Section
                        value={integrations.quickbooksRate}
                        color="green"
                        style={{ cursor: "pointer" }}
                      />
                    </Tooltip>
                  </Progress.Root>
                </Stack>
              ) : card.label === "All Onboarded Companies" ? (
                <Stack gap={3} mt={6}>
                  <Text size="xs" c="dimmed">
                    From 2021 to date
                  </Text>
                  <Text component={Link} href="/admin/companies" size="xs" fw={600} c="indigo.7">
                    View companies →
                  </Text>
                </Stack>
              ) : (
                <Stack gap={3} mt={6}>
                  <Text size="xs" c="dimmed">
                    {card.hint}
                  </Text>
                  <Text component={Link} href="/admin/subscriptions" size="xs" fw={600} c="indigo.7">
                    View subscriptions →
                  </Text>
                </Stack>
              )}
            </Card>
          </GridCol>
        ))}
      </Grid>

      <Card withBorder p="md">
        <Group justify="flex-end" align="end" mb="sm" wrap="wrap">
          <Button
            variant="light"
            onClick={() =>
              exportRowsToCsv("dashboard-dynamic-metrics", [
                {
                  range: presetRange === "custom" ? "custom" : presetRange,
                  resolvedRange,
                  onboardedCompanies: onboardedWithinRange,
                  activeCompanies: metrics.activeCompanies,
                  receiptsCreated: metrics.receiptsCount,
                  totalReceiptValue: metrics.totalReceiptValue,
                  averageReceiptValue: metrics.averageReceiptValue,
                  minReceiptValue: metrics.minReceiptValue,
                  maxReceiptValue: metrics.maxReceiptValue,
                  expensesAdded: metrics.expensesAdded,
                  totalExpenseValue: metrics.totalExpenseValue,
                  averageExpenseValue: metrics.averageExpenseValue,
                  minExpenseValue: metrics.minExpenseValue,
                  maxExpenseValue: metrics.maxExpenseValue,
                },
                ...regionalData.map((row) => ({
                  range: presetRange === "custom" ? "custom" : presetRange,
                  resolvedRange,
                  region: row.region,
                  activeCompanies: row.activeCompanies,
                  receipts: row.receipts,
                  totalValue: row.totalValue,
                })),
              ])
            }
          >
            Export
          </Button>
          <Select
            label="Range preset"
            value={presetRange}
            onChange={(value) => setPresetRange(value || "30d")}
            data={PRESET_OPTIONS}
            w={220}
          />
          <DatePickerInput
            type="range"
            label="Custom date range"
            placeholder="Pick date range"
            value={customRange}
            onChange={setCustomRange}
            disabled={presetRange !== "custom"}
            clearable
            w={300}
          />
        </Group>
        <Grid>
          {dynamicCards.map((card) => (
            <GridCol key={card.label} span={{ base: 12, sm: 6, lg: 3 }}>
              <Card withBorder p="sm">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {card.label}
                </Text>
                <Text
                  fw={700}
                  fz={30}
                  lh={1.2}
                >
                  {card.value}
                </Text>
                <Text size="xs" c="dimmed" style={{ minHeight: 18 }}>
                  {card.hint || "\u00A0"}
                </Text>
              </Card>
            </GridCol>
          ))}
        </Grid>
        <Grid mt="xs">
          {canViewFinanceNumbers ? (
            <>
              <GridCol span={{ base: 12, md: 6 }}>
                <Card withBorder p="sm">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Receipt Value
                  </Text>
                  <Text fw={700} fz={22} style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    {formatCurrency(metrics.totalReceiptValue)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Avg {formatCurrency(metrics.averageReceiptValue)} | Low {formatCurrency(metrics.minReceiptValue)} | High {formatCurrency(metrics.maxReceiptValue)}
                  </Text>
                </Card>
              </GridCol>
              <GridCol span={{ base: 12, md: 6 }}>
                <Card withBorder p="sm">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Expense Value
                  </Text>
                  <Text fw={700} fz={22} style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    {formatCurrency(metrics.totalExpenseValue)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Avg {formatCurrency(metrics.averageExpenseValue)} | Low {formatCurrency(metrics.minExpenseValue)} | High {formatCurrency(metrics.maxExpenseValue)}
                  </Text>
                </Card>
              </GridCol>
            </>
          ) : (
            <GridCol span={12}>
              <Card withBorder p="sm">
                <Text size="sm" c="dimmed">
                  Finance totals are hidden for your current access level.
                </Text>
              </Card>
            </GridCol>
          )}
        </Grid>
        <div style={{ marginTop: 12 }}>
          <RegionalActivityOverview regionalData={regionalData} range={resolvedRange} />
        </div>
      </Card>
    </Stack>
  );
}
