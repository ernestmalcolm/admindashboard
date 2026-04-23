"use client";

import {
  Badge,
  Button,
  Card,
  Grid,
  GridCol,
  Group,
  Modal,
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
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { companies, operators, organizations } from "@/lib/mock-data";

function formatTSh(value) {
  return `TSh ${value.toLocaleString()}`;
}

function formatDateDisplay(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function getOperatorStatus(serial) {
  return serial % 9 === 0 ? "blocked" : "active";
}

function getOperatorType(serial) {
  return serial % 4 === 0 ? "Operator" : "Owner";
}

function buildLinkedCompanies(operator, serial) {
  const primary = companies.find((company) => company.id === operator.companyId);
  if (!primary) return [];

  const linked = [primary];
  const primaryIndex = companies.findIndex((company) => company.id === primary.id);

  if (serial % 5 === 0) {
    linked.push(companies[(primaryIndex + 7) % companies.length]);
  }
  if (serial % 11 === 0) {
    linked.push(companies[(primaryIndex + 19) % companies.length]);
  }

  return linked.filter(
    (company, index, list) =>
      company && list.findIndex((candidate) => candidate.id === company.id) === index,
  );
}

export default function OperatorDetailsPage() {
  const params = useParams();
  const operatorId = params?.operatorId;

  const operator = operators.find((item) => item.id === operatorId);
  const operatorIndex = operators.findIndex((item) => item.id === operatorId);
  const serial = operatorIndex + 1;
  const hasOperator = Boolean(operator);

  const linkedCompanies = useMemo(
    () => (operator ? buildLinkedCompanies(operator, serial) : []),
    [operator, serial],
  );

  const primaryCompany = linkedCompanies[0];
  const generatedPhone = `+255 7${String(10000000 + ((serial * 7319) % 89999999)).slice(0, 8)}`;
  const normalizedCompanyName =
    primaryCompany?.name.toLowerCase().replace(/[^a-z0-9]+/g, "") || `company${serial}`;
  const safeOperatorName = operator?.name || "Operator User";
  const generatedEmail = `${safeOperatorName.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@${normalizedCompanyName.slice(0, 16)}.co.tz`;

  const status = getOperatorStatus(serial);
  const operatorType = getOperatorType(serial);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const fullNameParts = safeOperatorName.split(" ");
  const defaultFirstName = fullNameParts[0] || "Operator";
  const defaultLastName = fullNameParts.slice(1).join(" ") || "User";

  const [form, setForm] = useState({
    firstName: defaultFirstName,
    lastName: defaultLastName,
    phone: generatedPhone,
    email: generatedEmail,
    type: operatorType,
    organization:
      primaryCompany?.organizationName || organizations[0]?.name || "Unassigned",
  });

  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  if (!hasOperator) {
    return (
      <Card withBorder>
        <Stack>
          <Title order={3}>Operator not found</Title>
          <Button component={Link} href="/admin/operators" variant="light" w="fit-content">
            Back to operators
          </Button>
        </Stack>
      </Card>
    );
  }

  const linkedCompanyRows = linkedCompanies.map((company) => {
    const receiptsTotal = company.receipts["3m"].reduce((sum, value) => sum + value, 0);
    const expensesTotal = company.expenses["3m"].reduce((sum, value) => sum + value, 0);
    const issueScore = company.receiptsSubmittedStuck + company.zReportsStuck;
    const traStatus = issueScore >= 4 ? "blocked" : "active";
    return {
      id: company.id,
      name: company.name,
      tin: company.tin,
      traStatus,
      receiptsTotal,
      expensesTotal,
      latestReceiptDate: `2026-04-${String(28 - (Number(company.id.replace("cmp-", "")) % 10)).padStart(2, "0")}`,
      latestReceiptAmount: company.avgReceiptValue["30d"],
    };
  });

  const totalReceipts = linkedCompanyRows.reduce((sum, row) => sum + row.receiptsTotal, 0);
  const totalExpenses = linkedCompanyRows.reduce((sum, row) => sum + row.expensesTotal, 0);
  const latestReceipt = linkedCompanyRows.reduce((latest, row) => {
    if (!latest) return row;
    return row.latestReceiptDate > latest.latestReceiptDate ? row : latest;
  }, null);

  function onSaveDetails() {
    setIsEditing(false);
    notifications.show({
      title: "Operator updated",
      message: "Operator details saved successfully.",
      color: "green",
    });
  }

  function onChangePassword() {
    if (!passwordForm.password || passwordForm.password.length < 6) {
      notifications.show({
        title: "Password too short",
        message: "Use at least 6 characters.",
        color: "red",
      });
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      notifications.show({
        title: "Password mismatch",
        message: "Password and confirmation must match.",
        color: "red",
      });
      return;
    }
    setPasswordModalOpen(false);
    setPasswordForm({ password: "", confirmPassword: "" });
    notifications.show({
      title: "Password changed",
      message: "Operator password was updated successfully.",
      color: "green",
    });
  }

  function onToggleStatus() {
    const nextStatus = currentStatus === "active" ? "blocked" : "active";
    setCurrentStatus(nextStatus);
    setStatusModalOpen(false);
    notifications.show({
      title: nextStatus === "blocked" ? "Operator disabled" : "Operator enabled",
      message:
        nextStatus === "blocked"
          ? "Operator access was disabled."
          : "Operator access was enabled.",
      color: nextStatus === "blocked" ? "orange" : "green",
    });
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="sm" align="flex-start">
          <Stack gap={2}>
            <Title order={2}>{operator.name}</Title>
            <Text size="sm" c="dimmed">
              {form.email}
            </Text>
          </Stack>
          <Badge color={currentStatus === "active" ? "teal" : "red"} variant="light" mt={6}>
            {currentStatus}
          </Badge>
        </Group>
        <Group>
          <Button variant="default" onClick={() => setPasswordModalOpen(true)}>
            Change password
          </Button>
          <Button
            color={currentStatus === "active" ? "red" : "teal"}
            variant={currentStatus === "active" ? "light" : "filled"}
            onClick={() => setStatusModalOpen(true)}
          >
            {currentStatus === "active" ? "Disable operator" : "Enable operator"}
          </Button>
          <Button component={Link} href="/admin/operators" variant="light">
            Back to operators
          </Button>
        </Group>
      </Group>

      <Grid>
        <GridCol span={{ base: 12, sm: 6, lg: 4 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">
              Linked Companies
            </Text>
            <Text fw={700} fz={30}>
              {linkedCompanyRows.length}
            </Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, lg: 4 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">
              Receipts Created
            </Text>
            <Text fw={700} fz={30}>
              {totalReceipts.toLocaleString()}
            </Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, lg: 4 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">
              Expenses Added
            </Text>
            <Text fw={700} fz={30}>
              {totalExpenses.toLocaleString()}
            </Text>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, lg: 4 }}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">
              Most Recent Receipt
            </Text>
            <Text fw={700} fz={18}>
              {latestReceipt ? formatDateDisplay(latestReceipt.latestReceiptDate) : "-"}
            </Text>
            <Text size="xs" c="dimmed">
              {latestReceipt ? latestReceipt.name : ""}
            </Text>
          </Card>
        </GridCol>
      </Grid>

      <Grid>
        <GridCol span={{ base: 12, lg: 5 }}>
          <Card withBorder p="sm" h="100%">
            <Group justify="space-between" mb="sm">
              <Title order={4}>Operator Details</Title>
              <Group>
                {isEditing ? (
                  <>
                    <Button variant="default" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={onSaveDetails}>Save details</Button>
                  </>
                ) : (
                  <Button variant="default" onClick={() => setIsEditing(true)}>
                    Edit details
                  </Button>
                )}
              </Group>
            </Group>
            <Table withTableBorder striped>
              <TableTbody>
                <TableTr>
                  <TableTd>First name</TableTd>
                  <TableTd>
                    {isEditing ? (
                      <TextInput
                        value={form.firstName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            firstName: event.currentTarget.value,
                          }))
                        }
                      />
                    ) : (
                      form.firstName
                    )}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Last name</TableTd>
                  <TableTd>
                    {isEditing ? (
                      <TextInput
                        value={form.lastName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            lastName: event.currentTarget.value,
                          }))
                        }
                      />
                    ) : (
                      form.lastName
                    )}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Phone number</TableTd>
                  <TableTd>
                    {isEditing ? (
                      <TextInput
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            phone: event.currentTarget.value,
                          }))
                        }
                      />
                    ) : (
                      form.phone
                    )}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Email</TableTd>
                  <TableTd>
                    {isEditing ? (
                      <TextInput
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            email: event.currentTarget.value,
                          }))
                        }
                      />
                    ) : (
                      form.email
                    )}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Type of operator</TableTd>
                  <TableTd>
                    {isEditing ? (
                      <Select
                        value={form.type}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            type: value || current.type,
                          }))
                        }
                        data={[
                          { value: "Owner", label: "Owner" },
                          { value: "Operator", label: "Operator" },
                        ]}
                      />
                    ) : (
                      <Badge
                        variant="light"
                        color={form.type === "Owner" ? "blue" : "gray"}
                        tt="uppercase"
                      >
                        {form.type}
                      </Badge>
                    )}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Organization</TableTd>
                  <TableTd>
                    {isEditing ? (
                      <Select
                        value={form.organization}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            organization: value || current.organization,
                          }))
                        }
                        data={organizations.map((organization) => ({
                          value: organization.name,
                          label: organization.name,
                        }))}
                        searchable
                      />
                    ) : (
                      form.organization
                    )}
                  </TableTd>
                </TableTr>
              </TableTbody>
            </Table>
          </Card>
        </GridCol>
        <GridCol span={{ base: 12, lg: 7 }}>
          <Card withBorder p="sm" h="100%">
            <Title order={4} mb="sm">
              Linked Companies
            </Title>
            <Table withTableBorder striped highlightOnHover>
              <TableThead>
                <TableTr>
                  <TableTh>Company</TableTh>
                  <TableTh>TIN</TableTh>
                  <TableTh>Action</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {linkedCompanyRows.map((company) => (
                  <TableTr key={company.id}>
                    <TableTd>{company.name}</TableTd>
                    <TableTd>{company.tin}</TableTd>
                    <TableTd>
                      <Button component={Link} href={`/admin/companies/${company.id}`} size="xs" variant="light">
                        View Company
                      </Button>
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </Card>
        </GridCol>
      </Grid>

      <Modal
        opened={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Password"
        centered
        size="lg"
      >
        <Stack>
          <TextInput label="Email" value={form.email} readOnly />
          <TextInput
            label="New password"
            type="password"
            value={passwordForm.password}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                password: event.currentTarget.value,
              }))
            }
          />
          <TextInput
            label="Confirm new password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                confirmPassword: event.currentTarget.value,
              }))
            }
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onChangePassword}>Change password</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={currentStatus === "active" ? "Disable Operator" : "Enable Operator"}
        centered
      >
        <Stack>
          <Text>
            {currentStatus === "active"
              ? "Do you want to disable this operator? They will no longer access the system."
              : "Do you want to enable this operator? They will regain system access."}
          </Text>
          <Text fw={700}>{form.email}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color={currentStatus === "active" ? "red" : "teal"}
              onClick={onToggleStatus}
            >
              {currentStatus === "active" ? "Disable operator" : "Enable operator"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
