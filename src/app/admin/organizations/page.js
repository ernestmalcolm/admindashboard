"use client";

import {
  ActionIcon,
  Button,
  Card,
  Grid,
  GridCol,
  Group,
  Menu,
  Modal,
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
import { notifications } from "@mantine/notifications";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { companies, organizations } from "@/lib/mock-data";

const ownerFirstNames = [
  "Asha",
  "Eliel",
  "Wilson",
  "Cosmas",
  "Diana",
  "Baraka",
  "Janeth",
  "Neema",
];
const ownerLastNames = [
  "Mtego",
  "Mollel",
  "Magembe",
  "Meela",
  "Matem",
  "Lema",
  "Mushi",
  "Kisinda",
];

export default function OrganizationsPage() {
  const PAGE_SIZE_OPTIONS = ["50", "75", "100"];
  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    ownerName: "",
    phone: "",
    email: "",
  });

  const directory = useMemo(() => {
    return organizations.map((organization, index) => {
      const linkedCompanies = companies.filter(
        (_, companyIndex) => companyIndex % organizations.length === index,
      );
      return {
        ...organization,
        ownerName: `${ownerFirstNames[index % ownerFirstNames.length]} ${ownerLastNames[index % ownerLastNames.length]}`,
        phone: `+255 ${String(700000000 + index * 73421).slice(0, 9)}`,
        email: `ops+org${index + 1}@simplify.co.tz`,
        createdAt: `202${(index % 5) + 1}-0${(index % 8) + 1}-1${index % 9}`,
        linkedCompanies,
      };
    });
  }, []);

  const filteredOrganizations = useMemo(() => {
    const normalized = appliedQuery.trim().toLowerCase();
    if (!normalized) return directory;
    return directory.filter(
      (organization) =>
        organization.name.toLowerCase().includes(normalized) ||
        organization.ownerName.toLowerCase().includes(normalized) ||
        organization.email.toLowerCase().includes(normalized) ||
        organization.phone.toLowerCase().includes(normalized),
    );
  }, [directory, appliedQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrganizations.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedOrganizations = filteredOrganizations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function openModal(organization, mode) {
    setSelectedOrg(organization);
    setModalMode(mode);
    if (mode === "edit") {
      setEditForm({
        name: organization.name,
        ownerName: organization.ownerName,
        phone: organization.phone,
        email: organization.email,
      });
    }
  }

  return (
    <Stack gap="md">
      <Grid>
        <GridCol span={{ base: 12, md: 6 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">
              Total Organizations
            </Text>
            <Text fw={700} fz={30}>
              {organizations.length}
            </Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, md: 6 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">
              Organizations with multiple companies
            </Text>
            <Text fw={700} fz={30}>
              {
                organizations.filter(
                  (organization) => organization.companies > 1,
                ).length
              }
            </Text>
          </Card>
        </GridCol>
      </Grid>

      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Organizations</Title>
          <Button leftSection={<IconPlus size={16} />}>
            Add New Organization
          </Button>
        </Group>

        <Group mb="md" align="end">
          <TextInput
            placeholder="Search organization, owner, email, or phone"
            value={queryInput}
            onChange={(event) => setQueryInput(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="default"
            onClick={() => {
              setQueryInput("");
              setAppliedQuery("");
              setPage(1);
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              setAppliedQuery(queryInput);
              setPage(1);
            }}
          >
            Apply filters
          </Button>
        </Group>

        <Group justify="space-between" mb="sm">
          <Text size="sm" c="dimmed">
            {filteredOrganizations.length
              ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredOrganizations.length)} of ${filteredOrganizations.length} organizations`
              : "No organizations match current filters"}
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
              <TableTh>Organization</TableTh>
              <TableTh>Owner name</TableTh>
              <TableTh>Phone number</TableTh>
              <TableTh>Email</TableTh>
              <TableTh>Companies</TableTh>
              <TableTh>Action</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {paginatedOrganizations.map((organization) => (
              <TableTr key={organization.id}>
                <TableTd>{organization.name}</TableTd>
                <TableTd>{organization.ownerName}</TableTd>
                <TableTd>{organization.phone}</TableTd>
                <TableTd>{organization.email}</TableTd>
                <TableTd>{organization.linkedCompanies.length}</TableTd>
                <TableTd>
                  <Menu shadow="md" width={220}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEye size={16} />}
                        onClick={() => openModal(organization, "view")}
                      >
                        View Organization
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconPencil size={16} />}
                        onClick={() => openModal(organization, "edit")}
                      >
                        Edit Organization
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </Card>

      <Modal
        opened={modalMode === "view"}
        onClose={() => setModalMode(null)}
        title="View Organization"
        size="lg"
        centered
      >
        {selectedOrg && (
          <Stack>
            <Table withTableBorder striped verticalSpacing="xs">
              <TableTbody>
                <TableTr>
                  <TableTd>Organization</TableTd>
                  <TableTd>{selectedOrg.name}</TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Owner name</TableTd>
                  <TableTd>{selectedOrg.ownerName}</TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Phone number</TableTd>
                  <TableTd>{selectedOrg.phone}</TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Email</TableTd>
                  <TableTd>{selectedOrg.email}</TableTd>
                </TableTr>
                  <TableTr>
                    <TableTd>Date created</TableTd>
                    <TableTd>{selectedOrg.createdAt}</TableTd>
                  </TableTr>
              </TableTbody>
            </Table>

            <Card withBorder p="sm">
              <Group justify="space-between" mb="xs">
                <Text fw={700}>Companies in this organization</Text>
              </Group>
              {selectedOrg.linkedCompanies.length ? (
                <Table withTableBorder striped>
                  <TableThead>
                    <TableTr>
                      <TableTh>Company</TableTh>
                      <TableTh>TIN</TableTh>
                      <TableTh>Action</TableTh>
                    </TableTr>
                  </TableThead>
                  <TableTbody>
                    {selectedOrg.linkedCompanies.map((company) => (
                      <TableTr key={company.id}>
                        <TableTd>{company.name}</TableTd>
                        <TableTd>{company.tin}</TableTd>
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
              ) : (
                <Text size="sm" c="dimmed">
                  No companies are currently linked to this organization.
                </Text>
              )}
            </Card>
          </Stack>
        )}
      </Modal>

      <Modal
        opened={modalMode === "edit"}
        onClose={() => setModalMode(null)}
        title="Edit Organization"
        size="lg"
        centered
      >
        <Stack>
          <TextInput
            label="Organization"
            value={editForm.name}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                name: event.currentTarget.value,
              }))
            }
          />
          <TextInput
            label="Owner name"
            value={editForm.ownerName}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                ownerName: event.currentTarget.value,
              }))
            }
          />
          <TextInput
            label="Phone number"
            value={editForm.phone}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                phone: event.currentTarget.value,
              }))
            }
          />
          <TextInput
            label="Email"
            value={editForm.email}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                email: event.currentTarget.value,
              }))
            }
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                notifications.show({
                  title: "Organization updated",
                  message: "Organization details were updated successfully.",
                  color: "green",
                });
                setModalMode(null);
              }}
            >
              Update Organization
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
