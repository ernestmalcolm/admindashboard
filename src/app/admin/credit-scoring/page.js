"use client";

import { ActionIcon, Badge, Button, Card, Grid, GridCol, Group, Modal, Pagination, Select, Stack, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, Tabs, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { companies, getCreditDashboardMetrics } from "@/lib/mock-data";

function formatCurrency(value) {
  return `TSh ${new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 }).format(value)}`;
}

function statusColor(status) {
  if (status === "Ready") return "green";
  if (status === "Pending") return "yellow";
  return "red";
}

function bandColor(band) {
  if (band === "A") return "teal";
  if (band === "B") return "blue";
  if (band === "C") return "orange";
  return "gray";
}

export default function CreditScoringPage() {
  const [rerunVersion, setRerunVersion] = useState(0);
  const [isRerunning, setIsRerunning] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [companyPage, setCompanyPage] = useState(1);
  const [reasonPage, setReasonPage] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [bandInput, setBandInput] = useState("all");
  const [statusInput, setStatusInput] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    band: "all",
    status: "all",
  });
  const [companyPageSize, setCompanyPageSize] = useState(20);
  const credit = useMemo(
    () => getCreditDashboardMetrics(companies, rerunVersion),
    [rerunVersion],
  );
  const REASON_PAGE_SIZE = 4;
  const filteredProfiles = useMemo(() => {
    const normalizedName = appliedFilters.name.trim().toLowerCase();
    return credit.profiles.filter((profile) => {
      const nameMatch =
        !normalizedName || profile.companyName.toLowerCase().includes(normalizedName);
      const bandMatch = appliedFilters.band === "all" || profile.band === appliedFilters.band;
      const statusMatch =
        appliedFilters.status === "all" || profile.status === appliedFilters.status;
      return nameMatch && bandMatch && statusMatch;
    });
  }, [credit.profiles, appliedFilters]);
  const companyPages = Math.max(1, Math.ceil(filteredProfiles.length / companyPageSize));
  const reasonPages = Math.max(1, Math.ceil(credit.declineReasonBreakdown.length / REASON_PAGE_SIZE));
  const currentCompanyPage = Math.min(companyPage, companyPages);
  const companyRows = filteredProfiles.slice(
    (currentCompanyPage - 1) * companyPageSize,
    currentCompanyPage * companyPageSize,
  );
  const reasonRows = credit.declineReasonBreakdown.slice(
    (reasonPage - 1) * REASON_PAGE_SIZE,
    reasonPage * REASON_PAGE_SIZE,
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={2}>
          <Title order={3}>Credit Scoring</Title>
          <Text c="dimmed" size="sm">
            Readiness snapshot across companies with pilot-oriented scoring insights.
          </Text>
        </Stack>
        <Group gap="xs">
          <Tooltip label="Definitions and scoring logic">
            <ActionIcon variant="light" color="gray" onClick={() => setInfoOpen(true)} aria-label="Open credit scoring guide">
              <IconInfoCircle size={16} />
            </ActionIcon>
          </Tooltip>
          <Button
            leftSection={<IconRefresh size={16} />}
            loading={isRerunning}
            onClick={() => {
              if (isRerunning) return;
              setIsRerunning(true);
              setTimeout(() => {
                setRerunVersion((current) => current + 1);
                setCompanyPage(1);
                setReasonPage(1);
                setIsRerunning(false);
              }, 1200);
            }}
          >
            Re-run scoring model
          </Button>
        </Group>
      </Group>

      <Grid>
        <GridCol span={{ base: 6, lg: 3 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Total scored</Text>
            <Text fw={700} fz={30}>{credit.totalEvaluated}</Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 6, lg: 3 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Credit-ready</Text>
            <Text fw={700} fz={30} c="green">{credit.readyCount}</Text>
            <Text size="xs" c="dimmed">{credit.readyRate.toFixed(1)}% approval rate</Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 6, lg: 3 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Pilot book</Text>
            <Text fw={700} fz={30}>{formatCurrency(credit.eligibleLoanBook)}</Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 6, lg: 3 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Median loan</Text>
            <Text fw={700} fz={30}>{formatCurrency(credit.medianLoan)}</Text>
          </Card>
        </GridCol>
      </Grid>

      <Grid>
        {credit.riskBands.map((bandRow) => (
          <GridCol key={bandRow.band} span={{ base: 6, lg: 3 }}>
            <Card withBorder p="sm">
              <Group justify="space-between">
                <Text size="sm" fw={600}>Band {bandRow.band}</Text>
                <Badge color={bandColor(bandRow.band)} variant="light">{bandRow.count}</Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>Suggested loan book</Text>
              <Text fw={600}>{formatCurrency(bandRow.book)}</Text>
            </Card>
          </GridCol>
        ))}
      </Grid>

      <Grid>
        <GridCol span={{ base: 12, lg: 6 }}>
          <Card withBorder p="sm">
            <Title order={5} mb="sm">Top eligible companies</Title>
            <Table withTableBorder striped>
              <TableThead>
                <TableTr>
                  <TableTh>Company</TableTh>
                  <TableTh>Score</TableTh>
                  <TableTh>Band</TableTh>
                  <TableTh>Suggested limit</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {credit.topEligible.map((profile) => (
                  <TableTr key={profile.companyId}>
                    <TableTd>{profile.companyName}</TableTd>
                    <TableTd>{profile.score}</TableTd>
                    <TableTd><Badge color={bandColor(profile.band)} variant="light">{profile.band}</Badge></TableTd>
                    <TableTd>{formatCurrency(profile.suggestedLimit)}</TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, lg: 6 }}>
          <Card withBorder p="sm">
            <Group justify="space-between" mb="sm">
              <div>
                <Title order={5}>Why companies are not ready</Title>
                <Text size="xs" c="dimmed">
                  Showing {(reasonPage - 1) * REASON_PAGE_SIZE + 1}-{Math.min(reasonPage * REASON_PAGE_SIZE, credit.declineReasonBreakdown.length)} of {credit.declineReasonBreakdown.length} reasons
                </Text>
              </div>
              <Pagination value={reasonPage} onChange={setReasonPage} total={reasonPages} size="sm" />
            </Group>
            <Table withTableBorder striped>
              <TableThead>
                <TableTr>
                  <TableTh>Reason</TableTh>
                  <TableTh>Count</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {reasonRows.map((item) => (
                  <TableTr key={item.reason}>
                    <TableTd>{item.reason}</TableTd>
                    <TableTd>{item.count}</TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </Card>
        </GridCol>
      </Grid>

      <Card withBorder p={0}>
        <Grid p="sm" pb={0} align="end">
          <GridCol span={{ base: 12, md: 5 }}>
            <TextInput
              label="Company name"
              placeholder="Search company"
              value={nameInput}
              onChange={(event) => setNameInput(event.currentTarget.value)}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 2 }}>
            <Select
              label="Band"
              value={bandInput}
              onChange={(value) => setBandInput(value || "all")}
              data={[
                { value: "all", label: "All" },
                { value: "A", label: "A" },
                { value: "B", label: "B" },
                { value: "C", label: "C" },
                { value: "D", label: "D" },
              ]}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 2 }}>
            <Select
              label="Status"
              value={statusInput}
              onChange={(value) => setStatusInput(value || "all")}
              data={[
                { value: "all", label: "All" },
                { value: "Ready", label: "Ready" },
                { value: "Not Ready", label: "Not Ready" },
                { value: "Pending", label: "Pending" },
              ]}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 3 }}>
            <Group justify="flex-end" wrap="nowrap">
              <Button
                variant="default"
                onClick={() => {
                  setNameInput("");
                  setBandInput("all");
                  setStatusInput("all");
                  setAppliedFilters({ name: "", band: "all", status: "all" });
                  setCompanyPage(1);
                }}
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  setAppliedFilters({
                    name: nameInput,
                    band: bandInput,
                    status: statusInput,
                  });
                  setCompanyPage(1);
                }}
              >
                Apply filters
              </Button>
            </Group>
          </GridCol>
        </Grid>
        <Group justify="space-between" p="sm">
          <div>
            <Title order={5}>Company credit scoring results</Title>
            <Text size="xs" c="dimmed">
              {filteredProfiles.length
                ? `Showing ${(currentCompanyPage - 1) * companyPageSize + 1}-${Math.min(currentCompanyPage * companyPageSize, filteredProfiles.length)} of ${filteredProfiles.length} companies`
                : "No companies match current filters"}
            </Text>
          </div>
          <Group gap="sm">
            <Select
              value={String(companyPageSize)}
              onChange={(value) => {
                const next = Number(value) || 20;
                setCompanyPageSize(next);
                setCompanyPage(1);
              }}
              data={[
                { value: "10", label: "10 / page" },
                { value: "20", label: "20 / page" },
                { value: "50", label: "50 / page" },
              ]}
              w={120}
            />
            <Pagination value={currentCompanyPage} onChange={setCompanyPage} total={companyPages} size="sm" />
          </Group>
        </Group>
        <Table withTableBorder striped highlightOnHover>
          <TableThead>
            <TableTr>
              <TableTh>Company</TableTh>
              <TableTh>Credit score</TableTh>
              <TableTh>Band</TableTh>
              <TableTh>Status</TableTh>
              <TableTh>Last evaluation</TableTh>
              <TableTh>Suggested limit</TableTh>
              <TableTh>Key indicator</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {companyRows.map((profile) => (
              <TableTr key={profile.companyId}>
                <TableTd>{profile.companyName}</TableTd>
                <TableTd>{profile.score}</TableTd>
                <TableTd>
                  <Badge color={bandColor(profile.band)} variant="light">{profile.band}</Badge>
                </TableTd>
                <TableTd>
                  <Badge color={statusColor(profile.status)} variant="light">{profile.status}</Badge>
                </TableTd>
                <TableTd>{profile.lastEvaluatedAt}</TableTd>
                <TableTd>{formatCurrency(profile.suggestedLimit)}</TableTd>
                <TableTd>{profile.reasons[0] || "Meets threshold checks"}</TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </Card>

      <Modal
        opened={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Credit scoring concepts guide"
        size="xl"
        centered
      >
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="bands">Bands & readiness</Tabs.Tab>
            <Tabs.Tab value="loan">Pilot book & limits</Tabs.Tab>
            <Tabs.Tab value="scoring">Scoring flow</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap={8}>
              <Text size="sm"><b>Total scored</b>: number of companies evaluated in the current run window.</Text>
              <Text size="sm"><b>Credit-ready</b>: companies passing hard eligibility checks and minimum score/loan thresholds.</Text>
              <Text size="sm"><b>Median loan</b>: middle suggested limit of currently ready companies.</Text>
              <Text size="sm"><b>Last evaluation</b>: timestamp from the latest scoring refresh.</Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="bands" pt="md">
            <Stack gap={8}>
              <Text size="sm"><b>Band A (Low Risk)</b>: score ≥ 75.</Text>
              <Text size="sm"><b>Band B (Moderate)</b>: score 60–74.</Text>
              <Text size="sm"><b>Band C (Elevated)</b>: score 45–59.</Text>
              <Text size="sm"><b>Band D (Decline)</b>: score &lt; 45 or gate failure.</Text>
              <Text size="sm"><b>Status Ready / Not Ready / Pending</b>: operational outcome used by the team for pilot decisions.</Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="loan" pt="md">
            <Stack gap={8}>
              <Text size="sm"><b>Pilot book</b>: total of suggested limits for currently ready companies.</Text>
              <Text size="sm"><b>Suggested limit</b>: modeled limit after risk band multiplier + concentration penalty.</Text>
              <Text size="sm"><b>Cap and floor</b>: capped at `1,000,000 TSh`, floored at `100,000 TSh`.</Text>
              <Text size="sm"><b>Concentration effect</b>: heavy dependency on one buyer can reduce final loan size even for high-revenue companies.</Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="scoring" pt="md">
            <Stack gap={8}>
              <Text size="sm"><b>Step 1 — Eligibility gates</b>: active months, invoice count, recent activity, revenue floor.</Text>
              <Text size="sm"><b>Step 2 — 6 dimensions</b>: revenue consistency, activity trajectory, diversification, rhythm, buyer quality, tenure.</Text>
              <Text size="sm"><b>Step 3 — Quality score</b>: weighted score from 0–100 using model dimension weights.</Text>
              <Text size="sm"><b>Step 4 — Risk band</b>: A/B/C/D mapping from quality score.</Text>
              <Text size="sm"><b>Step 5 — Loan sizing</b>: base limit from median revenue, then adjusted by band and concentration rules.</Text>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </Stack>
  );
}
