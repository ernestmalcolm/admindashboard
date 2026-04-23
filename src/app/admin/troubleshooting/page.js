"use client";

import {
  Badge,
  Button,
  Card,
  Collapse,
  Grid,
  GridCol,
  Group,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useMemo, useState } from "react";
import { exportRowsToCsv } from "@/lib/export-utils";
import { companies, receiptReissuingQueue } from "@/lib/mock-data";

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

export default function TroubleshootingPage() {
  const [queue, setQueue] = useState(
    receiptReissuingQueue.map((item, index) => ({
      ...item,
      monthLabel: ALL_MONTH_LABELS[index % ALL_MONTH_LABELS.length],
      submittedAt: new Date(
        START_YEAR + (index % YEAR_OPTIONS.length),
        index % 12,
        1 + ((index * 3) % 27),
      )
        .toISOString()
        .slice(0, 10),
    })),
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedYear, setSelectedYear] = useState(String(END_YEAR));
  const [isFetching, setIsFetching] = useState(false);
  const [isReissuingSingle, setIsReissuingSingle] = useState(false);
  const [isBulkReissuing, setIsBulkReissuing] = useState(false);
  const [isRangeReissuing, setIsRangeReissuing] = useState(false);
  const [isRangeFetching, setIsRangeFetching] = useState(false);
  const [rangeFetched, setRangeFetched] = useState(false);
  const [rangeFetchError, setRangeFetchError] = useState("");
  const [isReissuingAllStuck, setIsReissuingAllStuck] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchedReceipt, setFetchedReceipt] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((company) => [company.id, company.name])),
    [],
  );

  const monthlyBreakdown = useMemo(() => {
    const grouped = queue.reduce((acc, item) => {
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
  }, [queue, selectedYear]);

  const totalSubmittedStuck = useMemo(
    () => queue.filter((item) => item.status === "submitted").length,
    [queue],
  );
  const rangeStats = useMemo(() => {
    if (!startDate || !endDate) {
      return { issued: 0, submitted: 0 };
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return queue.reduce(
      (acc, item) => {
        const itemDate = new Date(item.submittedAt);
        if (itemDate < start || itemDate > end) return acc;
        if (item.status === "issued") acc.issued += 1;
        if (item.status === "submitted") acc.submitted += 1;
        return acc;
      },
      { issued: 0, submitted: 0 },
    );
  }, [queue, startDate, endDate]);

  function handleFetchReceipt() {
    const normalized = verificationCode.trim().toUpperCase();
    if (!normalized) {
      setFetchError("Enter receipt verification code first.");
      setFetchedReceipt(null);
      setDetailsOpen(false);
      return;
    }

    setFetchError("");
    setIsFetching(true);

    setTimeout(() => {
      const item = queue.find((entry) => entry.receiptCode.toUpperCase() === normalized);
      if (!item) {
        setFetchedReceipt(null);
        setDetailsOpen(false);
        setFetchError("Receipt not found in submitted/reissuing queue.");
        setIsFetching(false);
        return;
      }
      setFetchedReceipt(item);
      setDetailsOpen(true);
      setIsFetching(false);
    }, 900);
  }

  function handleReissueSingle() {
    if (!fetchedReceipt) return;
    setIsReissuingSingle(true);
    setTimeout(() => {
      setQueue((current) =>
        current.map((item) =>
          item.receiptCode === fetchedReceipt.receiptCode
            ? { ...item, status: "issued", retryCount: item.retryCount + 1 }
            : item,
        ),
      );
      setFetchedReceipt((current) =>
        current
          ? {
              ...current,
              status: "issued",
              retryCount: current.retryCount + 1,
            }
          : current,
      );
      setIsReissuingSingle(false);
    }, 1000);
  }

  function handleBulkReissueByMonth(monthLabel) {
    setIsBulkReissuing(true);
    setTimeout(() => {
      setQueue((current) =>
        current.map((item) =>
          item.monthLabel === monthLabel && item.status === "submitted"
            ? { ...item, status: "issued", retryCount: item.retryCount + 1 }
            : item,
        ),
      );
      setIsBulkReissuing(false);
    }, 1000);
  }

  function handleRangeReissue() {
    if (!rangeFetched) return;
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    setIsRangeReissuing(true);
    setTimeout(() => {
      setQueue((current) =>
        current.map((item) => {
          const itemDate = new Date(item.submittedAt);
          const inRange = itemDate >= start && itemDate <= end;
          if (!inRange) return item;
          return {
            ...item,
            status: "issued",
            retryCount: item.retryCount + 1,
          };
        }),
      );
      setIsRangeReissuing(false);
    }, 1100);
  }

  function handleFetchRangeData() {
    if (!startDate || !endDate) {
      setRangeFetchError("Select both start and end date first.");
      setRangeFetched(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setRangeFetchError("Start date cannot be after end date.");
      setRangeFetched(false);
      return;
    }

    setRangeFetchError("");
    setIsRangeFetching(true);
    setTimeout(() => {
      setRangeFetched(true);
      setIsRangeFetching(false);
    }, 800);
  }

  function handleReissueAllStuck() {
    setIsReissuingAllStuck(true);
    setTimeout(() => {
      setQueue((current) =>
        current.map((item) =>
          item.status === "submitted"
            ? { ...item, status: "issued", retryCount: item.retryCount + 1 }
            : item,
        ),
      );
      setIsReissuingAllStuck(false);
    }, 1000);
  }

  return (
    <Stack>
      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={3}>Receipt Reissuing</Title>
          <Badge color="orange">Troubleshooting</Badge>
        </Group>
        <Group align="end">
          <TextInput
            flex={1}
            label="Receipt verification code"
            placeholder="e.g. VRC-443120"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.currentTarget.value)}
            error={fetchError || undefined}
          />
          <Button
            variant="light"
            loading={isFetching}
            onClick={handleFetchReceipt}
            disabled={!verificationCode.trim()}
          >
            Fetch receipt
          </Button>
          <Button
            onClick={handleReissueSingle}
            disabled={!fetchedReceipt || fetchedReceipt.status !== "submitted"}
            loading={isReissuingSingle}
          >
            Re-issue receipt
          </Button>
        </Group>
        <Collapse in={detailsOpen}>
          <Card withBorder mt="md" p="sm">
            <Title order={5} mb="xs">
              Fetched receipt details
            </Title>
            {fetchedReceipt ? (
              <Table withTableBorder striped>
                <TableTbody>
                  <TableTr>
                    <TableTd>Receipt code</TableTd>
                    <TableTd>{fetchedReceipt.receiptCode}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>Company</TableTd>
                    <TableTd>{companyMap[fetchedReceipt.companyId] || fetchedReceipt.companyId}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>Status</TableTd>
                    <TableTd>
                      <Badge color={fetchedReceipt.status === "submitted" ? "orange" : "teal"}>
                        {fetchedReceipt.status}
                      </Badge>
                    </TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>Retry count</TableTd>
                    <TableTd>{fetchedReceipt.retryCount}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>Submitted month</TableTd>
                    <TableTd>{fetchedReceipt.monthLabel}</TableTd>
                  </TableTr>
                </TableTbody>
              </Table>
            ) : null}
          </Card>
        </Collapse>
      </Card>

      <Card withBorder p="sm">
        <Group justify="space-between" mb="sm">
          <Title order={5}>
            Reissue for date range (issued + submitted)
          </Title>
          <Button
            size="xs"
            variant="light"
            onClick={() =>
              exportRowsToCsv("receipt-range-fetch", [
                {
                  startDate: startDate ? new Date(startDate).toISOString().slice(0, 10) : "",
                  endDate: endDate ? new Date(endDate).toISOString().slice(0, 10) : "",
                  issued: rangeStats.issued,
                  stuckSubmitted: rangeStats.submitted,
                },
              ])
            }
            disabled={!rangeFetched}
          >
            Export
          </Button>
        </Group>
        <Grid align="end">
          <GridCol span={{ base: 12, md: 3 }}>
            <DateInput
              label="Start date"
              placeholder="Pick start date"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                setRangeFetched(false);
                setRangeFetchError("");
              }}
              clearable
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 3 }}>
            <DateInput
              label="End date"
              placeholder="Pick end date"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                setRangeFetched(false);
                setRangeFetchError("");
              }}
              clearable
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 6 }}>
            <Group grow>
              <Button
                variant="light"
                onClick={handleFetchRangeData}
                loading={isRangeFetching}
                disabled={!startDate || !endDate}
              >
                Fetch Receipts Data
              </Button>
              <Button
                onClick={handleRangeReissue}
                loading={isRangeReissuing}
                disabled={!rangeFetched}
              >
                Reissue Date Range
              </Button>
            </Group>
          </GridCol>
        </Grid>
        {rangeFetched ? (
          <Text size="sm" c="dimmed" mt="sm">
            {`In selected range: Issued ${rangeStats.issued} | Stuck submitted ${rangeStats.submitted}`}
          </Text>
        ) : null}
        {rangeFetchError ? (
          <Text size="sm" c="red.6" mt={4}>
            {rangeFetchError}
          </Text>
        ) : null}
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Submitted receipts by month</Title>
          <Group>
            <Button
              size="xs"
              variant="light"
              onClick={() =>
                exportRowsToCsv("receipt-monthly-breakdown", monthlyBreakdown.map((item) => ({
                  year: selectedYear,
                  month: item.month,
                  issued: item.issued,
                  stuckSubmitted: item.submitted,
                })))
              }
            >
              Export
            </Button>
            <Button
              size="xs"
              onClick={handleReissueAllStuck}
              loading={isReissuingAllStuck}
              disabled={totalSubmittedStuck === 0}
            >
              Bulk Reissue All Stuck Receipts
            </Button>
          </Group>
        </Group>
        <Tabs
          value={selectedYear}
          onChange={(value) => {
            const nextYear = value || String(END_YEAR);
            setSelectedYear(nextYear);
          }}
          mb="sm"
        >
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
            {monthlyBreakdown.length ? (
              monthlyBreakdown.map((item) => (
                <TableTr key={item.month}>
                  <TableTd>{item.month}</TableTd>
                  <TableTd>{item.issued}</TableTd>
                  <TableTd>{item.submitted}</TableTd>
                  <TableTd>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleBulkReissueByMonth(item.month)}
                      disabled={item.submitted === 0}
                      loading={isBulkReissuing}
                    >
                      Bulk Resend Stuck Receipts
                    </Button>
                  </TableTd>
                </TableTr>
              ))
            ) : (
              <TableTr>
                <TableTd colSpan={4}>
                  <Text size="sm" c="dimmed">
                    No stuck submitted receipts remaining.
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
