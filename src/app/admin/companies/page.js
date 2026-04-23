"use client";

import {
  Badge,
  Button,
  Card,
  Grid,
  GridCol,
  Group,
  Pagination,
  Progress,
  Select,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { companies, getIntegrationSummary } from "@/lib/mock-data";

export default function CompaniesPage() {
  const PAGE_SIZE_OPTIONS = ["50", "75", "100"];
  const [queryInput, setQueryInput] = useState("");
  const [traStatusInput, setTraStatusInput] = useState("all");
  const [vatInput, setVatInput] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [appliedFilters, setAppliedFilters] = useState({
    query: "",
    traStatus: "all",
    vat: "all",
  });
  const summaryDate = new Date("2026-04-20");

  const enrichedCompanies = useMemo(
    () =>
      companies.map((company, index) => {
        const issueScore =
          company.receiptsSubmittedStuck + company.zReportsStuck;
        const traStatus = issueScore >= 4 ? "blocked" : "active";
        const vatRegisteredFlag = index % 4 !== 0;
        const serial = `10TZ13${String(900000 + index)}`;
        const vrnDigits = String(10000000 + ((index * 137) % 89999999)).padStart(
          8,
          "0",
        );
        const vrnSuffix = String.fromCharCode(65 + (index % 26));
        const vrn = vatRegisteredFlag
          ? `${vrnDigits}${vrnSuffix}`
          : "NOT REGISTERED";
        return {
          ...company,
          traStatus,
          vatRegisteredFlag,
          serial,
          vrn,
        };
      }),
    [],
  );

  const filtered = useMemo(() => {
    const lower = appliedFilters.query.toLowerCase().trim();
    return enrichedCompanies.filter((company) => {
      const searchMatch =
        !lower ||
        company.name.toLowerCase().includes(lower) ||
        company.tin.toLowerCase().includes(lower) ||
        company.vrn.toLowerCase().includes(lower) ||
        company.serial.toLowerCase().includes(lower);
      const traMatch =
        appliedFilters.traStatus === "all" ||
        company.traStatus === appliedFilters.traStatus;
      const vatMatch =
        appliedFilters.vat === "all" ||
        (appliedFilters.vat === "registered" && company.vatRegisteredFlag) ||
        (appliedFilters.vat === "not-registered" && !company.vatRegisteredFlag);
      return searchMatch && traMatch && vatMatch;
    });
  }, [enrichedCompanies, appliedFilters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCompanies = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const integrations = getIntegrationSummary(companies);
  const totalOnboarded = companies.length;
  const businessTypeCounts = companies.reduce(
    (acc, company, index) => {
      const typeKey =
        index % 10 < 4 ? "sole" : index % 10 < 8 ? "limited" : "enterprise";
      acc[typeKey] += 1;
      return acc;
    },
    { sole: 0, limited: 0, enterprise: 0 },
  );
  const businessTypeRates = {
    sole: totalOnboarded ? (businessTypeCounts.sole / totalOnboarded) * 100 : 0,
    limited: totalOnboarded
      ? (businessTypeCounts.limited / totalOnboarded) * 100
      : 0,
    enterprise: totalOnboarded
      ? (businessTypeCounts.enterprise / totalOnboarded) * 100
      : 0,
  };
  const onboardedThisMonth = companies.filter((company) => {
    const joined = new Date(company.dateJoined);
    return (
      joined.getFullYear() === summaryDate.getFullYear() &&
      joined.getMonth() === summaryDate.getMonth()
    );
  }).length;
  const vatRegistered = enrichedCompanies.filter(
    (company) => company.vatRegisteredFlag,
  ).length;
  const subscriptionSummary = enrichedCompanies.reduce(
    (acc, company) => {
      acc[company.subscriptionStatus] += 1;
      return acc;
    },
    { active: 0, pending: 0, temporary: 0, expired: 0 },
  );

  return (
    <Stack gap="md">
      <Grid>
        <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder p="sm" h="100%">
            <Text size="xs" c="dimmed">
              Total Onboarded
            </Text>
            <Text fw={700} fz={30}>
              {totalOnboarded}
            </Text>
            <Text size="xs" c="dimmed">
              Onboarded this month: {onboardedThisMonth}
            </Text>
            <Text size="xs" c="dimmed" mt={4} mb={6}>
              Sole {businessTypeCounts.sole} | Limited{" "}
              {businessTypeCounts.limited} | Enterprise{" "}
              {businessTypeCounts.enterprise}
            </Text>
            <Progress.Root size={7}>
              <Tooltip
                label={`Sole Proprietor: ${businessTypeCounts.sole}`}
                withArrow
                radius="md"
              >
                <Progress.Section
                  value={businessTypeRates.sole}
                  color="yellow"
                />
              </Tooltip>
              <Tooltip
                label={`Limited Company: ${businessTypeCounts.limited}`}
                withArrow
                radius="md"
                color="indigo"
              >
                <Progress.Section
                  value={businessTypeRates.limited}
                  color="indigo"
                />
              </Tooltip>
              <Tooltip
                label={`Enterprise: ${businessTypeCounts.enterprise}`}
                withArrow
                radius="md"
                color="teal"
              >
                <Progress.Section
                  value={businessTypeRates.enterprise}
                  color="teal"
                />
              </Tooltip>
            </Progress.Root>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder p="sm" h="100%">
            <Text size="xs" c="dimmed">
              VAT Registered
            </Text>
            <Text fw={700} fz={30}>
              {vatRegistered}
            </Text>
            <Text size="xs" c="dimmed">
              Out of total companies: {totalOnboarded}
            </Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder p="sm" h="100%">
            <Text size="xs" c="dimmed">
              Integrations
            </Text>
            <Text fw={700} fz={30}>
              {
                companies.filter(
                  (company) =>
                    company.integrations.api ||
                    company.integrations.xero ||
                    company.integrations.quickbooks,
                ).length
              }
            </Text>
            <Text size="xs" c="dimmed" mb={6}>
              API {integrations.api} | Xero {integrations.xero} | QuickBooks{" "}
              {integrations.quickbooks}
            </Text>
            <Progress.Root size={7}>
              <Tooltip label={`API: ${integrations.api}`} withArrow radius="md">
                <Progress.Section value={integrations.apiRate} color="gray" />
              </Tooltip>
              <Tooltip
                label={`Xero: ${integrations.xero}`}
                withArrow
                radius="md"
                color="blue"
              >
                <Progress.Section value={integrations.xeroRate} color="blue" />
              </Tooltip>
              <Tooltip
                label={`QuickBooks: ${integrations.quickbooks}`}
                withArrow
                radius="md"
                color="green"
              >
                <Progress.Section
                  value={integrations.quickbooksRate}
                  color="green"
                />
              </Tooltip>
            </Progress.Root>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder p="sm" h="100%">
            <Text size="xs" c="dimmed">
              Subscription Overview
            </Text>
            <Text fw={700} fz={30}>
              {subscriptionSummary.active}
            </Text>
            <Text size="xs" c="dimmed">
              Active subscriptions
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Pending {subscriptionSummary.pending} | Temporary {subscriptionSummary.temporary} | Expired {subscriptionSummary.expired}
            </Text>
            <Text component={Link} href="/admin/subscriptions" size="xs" fw={600} c="indigo.7" mt={6}>
              Open subscriptions →
            </Text>
          </Card>
        </GridCol>
      </Grid>

      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Companies</Title>
          <Button leftSection={<IconPlus size={16} />}>Add New Company</Button>
        </Group>

        <Grid align="end" mb="md">
          <GridCol span={{ base: 12, md: 5 }}>
            <TextInput
              label="Name / TIN / VRN / Serial"
              placeholder="Search by Name, TIN, VRN, or Serial"
              value={queryInput}
              onChange={(event) => setQueryInput(event.currentTarget.value)}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 2 }}>
            <Select
              label="TRA status"
              value={traStatusInput}
              onChange={(value) => setTraStatusInput(value || "all")}
              data={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "blocked", label: "Blocked" },
              ]}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 2 }}>
            <Select
              label="VAT registered"
              value={vatInput}
              onChange={(value) => setVatInput(value || "all")}
              data={[
                { value: "all", label: "All" },
                { value: "registered", label: "Registered" },
                { value: "not-registered", label: "Not registered" },
              ]}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 3 }}>
            <Group gap="xs" justify="flex-end" wrap="nowrap">
              <Button
                variant="default"
                miw={112}
                onClick={() => {
                  setQueryInput("");
                  setTraStatusInput("all");
                  setVatInput("all");
                  setAppliedFilters({
                    query: "",
                    traStatus: "all",
                    vat: "all",
                  });
                  setPage(1);
                }}
              >
                Reset
              </Button>
              <Button
                miw={145}
                onClick={() => {
                  setAppliedFilters({
                    query: queryInput,
                    traStatus: traStatusInput,
                    vat: vatInput,
                  });
                  setPage(1);
                }}
              >
                Apply filters
              </Button>
            </Group>
          </GridCol>
        </Grid>
        <Group justify="space-between" mb="sm">
          <Text size="sm" c="dimmed">
            {filtered.length
              ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} companies`
              : "No companies match current filters"}
          </Text>
          <Group gap="sm">
            <Select
              value={String(pageSize)}
              onChange={(value) => {
                const next = Number(value) || 50;
                setPageSize(next);
                setPage(1);
              }}
              data={PAGE_SIZE_OPTIONS.map((size) => ({
                value: size,
                label: `${size} / page`,
              }))}
              w={120}
            />
            <Pagination
              value={currentPage}
              onChange={setPage}
              total={totalPages}
              siblings={1}
              boundaries={1}
            />
          </Group>
        </Group>
        <Table striped highlightOnHover withTableBorder>
          <TableThead>
            <TableTr>
              <TableTh>Company</TableTh>
              <TableTh>Organization</TableTh>
              <TableTh>TIN</TableTh>
              <TableTh>TRA status</TableTh>
              <TableTh>VAT</TableTh>
              <TableTh>Subscription</TableTh>
              <TableTh>Action</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {paginatedCompanies.map((company) => (
              <TableTr key={company.id}>
                <TableTd>{company.name}</TableTd>
                <TableTd>{company.organizationName}</TableTd>
                <TableTd>{company.tin}</TableTd>
                <TableTd>
                  <Badge
                    color={company.traStatus === "active" ? "green" : "red"}
                  >
                    {company.traStatus}
                  </Badge>
                </TableTd>
                <TableTd>
                  <Text size="sm" fw={company.vatRegisteredFlag ? 600 : 500}>
                    {company.vrn}
                  </Text>
                </TableTd>
                <TableTd>
                  <Text
                    size="sm"
                    fw={600}
                    c={
                      company.subscriptionStatus === "active"
                        ? "green"
                        : company.subscriptionStatus === "pending"
                          ? "orange"
                          : company.subscriptionStatus === "temporary"
                            ? "orange"
                            : "red"
                    }
                    tt="capitalize"
                  >
                    {company.subscriptionStatus}
                  </Text>
                </TableTd>
                <TableTd>
                  <Button
                    component={Link}
                    href={`/admin/companies/${company.id}`}
                    size="xs"
                    variant="light"
                  >
                    View Company
                  </Button>
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </Card>
    </Stack>
  );
}
