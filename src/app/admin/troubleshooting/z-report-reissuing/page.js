"use client";

import {
  Button,
  Card,
  Grid,
  GridCol,
  Group,
  Select,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useMemo, useState } from "react";
import { companies } from "@/lib/mock-data";

const START_YEAR = 2021;
const END_YEAR = 2026;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const CURRENT_MONTH_INDEX = CURRENT_DATE.getMonth();
const YEAR_OPTIONS = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, index) => String(START_YEAR + index),
);
const ALL_MONTH_LABELS = YEAR_OPTIONS.flatMap((year) =>
  MONTH_NAMES.map((monthName) => `${monthName} ${year}`),
);
const RANGE_PRESETS = [
  { value: "this-month", label: "This month" },
  { value: "last-7-days", label: "Last 7 days" },
  { value: "last-30-days", label: "Last 30 days" },
  { value: "last-90-days", label: "Last 90 days" },
  { value: "custom", label: "Custom date range" },
];

export default function ZReportReissuingPage() {
  const [selectedYear, setSelectedYear] = useState(String(END_YEAR));
  const [isBulkReissuing, setIsBulkReissuing] = useState(false);
  const [isResendingAll, setIsResendingAll] = useState(false);
  const [rangePreset, setRangePreset] = useState("this-month");
  const [companyScope, setCompanyScope] = useState("all");
  const [customRange, setCustomRange] = useState([null, null]);
  const [zReportQueue, setZReportQueue] = useState(
    companies.slice(0, 48).map((company, index) => ({
      id: `zrq-${company.id}`,
      companyId: company.id,
      monthLabel: ALL_MONTH_LABELS[(index * 2) % ALL_MONTH_LABELS.length],
      status: index % 4 === 0 ? "issued" : "submitted",
      retryCount: Math.min(4, company.zReportsStuck + (index % 2)),
    })),
  );

  const eligibleCompanyIds = useMemo(
    () =>
      companies
        .filter((company, index) => companyScope === "all" || index % 4 !== 0)
        .map((company) => company.id),
    [companyScope],
  );

  const eligibleCompanyCount = eligibleCompanyIds.length;

  const zReportMonthlyBreakdown = useMemo(() => {
    const grouped = zReportQueue.reduce((acc, item) => {
      if (!acc[item.monthLabel]) {
        acc[item.monthLabel] = { month: item.monthLabel, issued: 0, submitted: 0 };
      }
      if (item.status === "issued") {
        acc[item.monthLabel].issued += 1;
      } else if (item.status === "submitted") {
        acc[item.monthLabel].submitted += 1;
      }
      return acc;
    }, {});

    const selectedYearNumber = Number(selectedYear);
    const visibleMonthNames =
      selectedYearNumber === CURRENT_YEAR
        ? MONTH_NAMES.slice(0, CURRENT_MONTH_INDEX + 1)
        : MONTH_NAMES;

    return [...visibleMonthNames].reverse().map((monthName) => {
      const monthLabel = `${monthName} ${selectedYear}`;
      return grouped[monthLabel] || { month: monthLabel, issued: 0, submitted: 0 };
    });
  }, [zReportQueue, selectedYear]);

  function handleBulkReissueZReportsByMonth(monthLabel) {
    setIsBulkReissuing(true);
    setTimeout(() => {
      setZReportQueue((current) =>
        current.map((item) =>
          item.monthLabel === monthLabel && item.status === "submitted"
            ? { ...item, status: "issued", retryCount: item.retryCount + 1 }
            : item,
        ),
      );
      setIsBulkReissuing(false);
    }, 1000);
  }

  function handleResendAllCompanies() {
    setIsResendingAll(true);
    setTimeout(() => {
      setZReportQueue((current) =>
        current.map((item) =>
          eligibleCompanyIds.includes(item.companyId) && item.status === "submitted"
            ? { ...item, status: "issued", retryCount: item.retryCount + 1 }
            : item,
        ),
      );
      setIsResendingAll(false);
    }, 1100);
  }

  return (
    <Stack>
      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={3}>Z-Report Reissuing</Title>
        </Group>
        <Text size="sm" c="dimmed" mb="sm">
          Monitor monthly z-report issued vs submitted counts and bulk resend stuck z-reports.
        </Text>
        <Grid mb="sm" align="end">
          <GridCol span={{ base: 12, md: 3 }}>
            <Select
              label="Date range preset"
              value={rangePreset}
              onChange={(value) => setRangePreset(value || "this-month")}
              data={RANGE_PRESETS}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 4 }}>
            <DatePickerInput
              type="range"
              label="Custom date range"
              placeholder="Pick date range"
              value={customRange}
              onChange={setCustomRange}
              disabled={rangePreset !== "custom"}
              clearable
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 3 }}>
            <Select
              label="Company filter"
              value={companyScope}
              onChange={(value) => setCompanyScope(value || "all")}
              data={[
                { value: "all", label: "All companies" },
                { value: "vat-only", label: "VAT registered only" },
              ]}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 2 }}>
            <Button fullWidth loading={isResendingAll} onClick={handleResendAllCompanies}>
              Resend for all companies
            </Button>
          </GridCol>
        </Grid>
        <Text size="sm" c="dimmed" mb="sm">
          Scope: {companyScope === "all" ? "All companies" : "VAT registered only"} ({eligibleCompanyCount} companies)
        </Text>
        <Tabs value={selectedYear} onChange={(value) => setSelectedYear(value || String(END_YEAR))} mb="sm">
          <Tabs.List>
            {YEAR_OPTIONS.map((year) => (
              <Tabs.Tab key={year} value={year}>
                {year}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
        <Table withTableBorder striped>
          <TableThead>
            <TableTr>
              <TableTh>Month</TableTh>
              <TableTh>Issued</TableTh>
              <TableTh>Submitted (stuck)</TableTh>
              <TableTh>Action</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {zReportMonthlyBreakdown.length ? (
              zReportMonthlyBreakdown.map((item) => (
                <TableTr key={item.month}>
                  <TableTd>{item.month}</TableTd>
                  <TableTd>{item.issued}</TableTd>
                  <TableTd>{item.submitted}</TableTd>
                  <TableTd>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleBulkReissueZReportsByMonth(item.month)}
                      disabled={item.submitted === 0}
                      loading={isBulkReissuing}
                    >
                      Bulk Resend Stuck Z-Reports
                    </Button>
                  </TableTd>
                </TableTr>
              ))
            ) : (
              <TableTr>
                <TableTd colSpan={4}>
                  <Text size="sm" c="dimmed">
                    No stuck submitted z-reports remaining.
                  </Text>
                </TableTd>
              </TableTr>
            )}
          </TableTbody>
        </Table>
      </Card>
    </Stack>
  );
}
