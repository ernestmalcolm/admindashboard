"use client";

import {
  Badge,
  Button,
  Card,
  Grid,
  GridCol,
  Group,
  Pagination,
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
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { companies, operators } from "@/lib/mock-data";

function formatEntranceDate(serial) {
  const baseDate = new Date("2026-04-20");
  baseDate.setDate(baseDate.getDate() - (serial % 320));
  const day = String(baseDate.getDate()).padStart(2, "0");
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const year = baseDate.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function OperatorsPage() {
  const PAGE_SIZE_OPTIONS = ["50", "75", "100"];
  const [queryInput, setQueryInput] = useState("");
  const [statusInput, setStatusInput] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({ query: "", status: "all" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((company) => [company.id, company])),
    [],
  );

  const enrichedOperators = useMemo(
    () =>
      operators.map((operator, index) => {
        const company = companyMap[operator.companyId];
        const serial = index + 1;
        const operatorType = serial % 4 === 0 ? "Operator" : "Owner";
        const status = serial % 9 === 0 ? "blocked" : "active";
        const phone = `+255 7${String(10000000 + ((serial * 7319) % 89999999)).slice(0, 8)}`;
        const normalizedCompanyName = company?.name.toLowerCase().replace(/[^a-z0-9]+/g, "") || `company${serial}`;
        const email = `${operator.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@${normalizedCompanyName.slice(0, 16)}.co.tz`;
        return {
          ...operator,
          companyName: company?.name || "Unassigned",
          entranceDay: formatEntranceDate(serial),
          phone,
          email,
          operatorType,
          status,
        };
      }),
    [companyMap],
  );

  const filteredOperators = useMemo(() => {
    const query = appliedFilters.query.toLowerCase().trim();
    return enrichedOperators.filter((operator) => {
      const queryMatch =
        !query ||
        operator.name.toLowerCase().includes(query) ||
        operator.companyName.toLowerCase().includes(query) ||
        operator.email.toLowerCase().includes(query) ||
        operator.phone.toLowerCase().includes(query);
      const statusMatch = appliedFilters.status === "all" || operator.status === appliedFilters.status;
      return queryMatch && statusMatch;
    });
  }, [enrichedOperators, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredOperators.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOperators = filteredOperators.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalOperators = enrichedOperators.length;
  const activeOperators = enrichedOperators.filter((operator) => operator.status === "active").length;
  const blockedOperators = totalOperators - activeOperators;

  return (
    <Stack gap="md">
      <Grid>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Card withBorder p="sm" h="100%">
            <Text size="xs" c="dimmed">
              Total Operators
            </Text>
            <Text fw={700} fz={30}>
              {totalOperators}
            </Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Card withBorder p="sm" h="100%">
            <Text size="xs" c="dimmed">
              Active Operators
            </Text>
            <Text fw={700} fz={30}>
              {activeOperators}
            </Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Card withBorder p="sm" h="100%">
            <Text size="xs" c="dimmed">
              Blocked Operators
            </Text>
            <Text fw={700} fz={30}>
              {blockedOperators}
            </Text>
          </Card>
        </GridCol>
      </Grid>

      <Card withBorder p="sm">
        <Group justify="space-between" mb="md">
          <Title order={3}>Operators</Title>
          <Button leftSection={<IconPlus size={16} />}>Add New Operator</Button>
        </Group>

        <Group align="end" mb="md">
          <TextInput
            label="Search"
            placeholder="Search operator, company, email, or phone"
            value={queryInput}
            onChange={(event) => setQueryInput(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            label="Status"
            value={statusInput}
            onChange={(value) => setStatusInput(value || "all")}
            data={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "blocked", label: "Blocked" },
            ]}
            w={160}
          />
          <Button
            variant="default"
            onClick={() => {
              setQueryInput("");
              setStatusInput("all");
              setAppliedFilters({ query: "", status: "all" });
              setPage(1);
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              setAppliedFilters({ query: queryInput, status: statusInput });
              setPage(1);
            }}
          >
            Apply filters
          </Button>
        </Group>

        <Group justify="space-between" mb="sm">
          <Text size="sm" c="dimmed">
            {filteredOperators.length
              ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredOperators.length)} of ${filteredOperators.length} operators`
              : "No operators match current filters"}
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

        <Table withTableBorder striped highlightOnHover>
          <TableThead>
            <TableTr>
              <TableTh>Operator name</TableTh>
              <TableTh>Company</TableTh>
              <TableTh>Entrance day</TableTh>
              <TableTh>Phone number</TableTh>
              <TableTh>Type of operator</TableTh>
              <TableTh>Email</TableTh>
              <TableTh>Status</TableTh>
              <TableTh>Actions</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {paginatedOperators.map((operator) => (
              <TableTr key={operator.id}>
                <TableTd>{operator.name}</TableTd>
                <TableTd>{operator.companyName}</TableTd>
                <TableTd>{operator.entranceDay}</TableTd>
                <TableTd>{operator.phone}</TableTd>
                <TableTd>
                  <Badge
                    variant="light"
                    color={operator.operatorType === "Owner" ? "blue" : "gray"}
                    tt="uppercase"
                  >
                    {operator.operatorType}
                  </Badge>
                </TableTd>
                <TableTd>{operator.email}</TableTd>
                <TableTd>
                  <Badge color={operator.status === "active" ? "teal" : "red"} variant="light">
                    {operator.status}
                  </Badge>
                </TableTd>
                <TableTd>
                  <Button
                    component={Link}
                    href={`/admin/operators/${operator.id}`}
                    size="xs"
                    variant="light"
                  >
                    View Operator
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
