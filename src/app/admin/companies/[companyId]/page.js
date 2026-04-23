"use client";

import {
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
  TableTr,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconClipboardList,
  IconPencil,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  companies,
  getCompanyCreditProfile,
  getDaysUntil,
  organizations,
} from "@/lib/mock-data";

function CompanyInfoTable({
  company,
  editable = false,
  form,
  setForm,
  organizationOptions,
}) {
  return (
    <Table withTableBorder striped verticalSpacing="xs">
      <TableTbody>
        <TableTr>
          <TableTd>Organization</TableTd>
          <TableTd>
            {editable ? (
              <Select
                value={form.organization}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    organization: value || current.organization,
                  }))
                }
                data={organizationOptions}
                searchable
              />
            ) : (
              form.organization
            )}
          </TableTd>
        </TableTr>
        <TableTr>
          <TableTd>Company</TableTd>
          <TableTd>
            {editable ? (
              <TextInput
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.currentTarget.value,
                  }))
                }
              />
            ) : (
              company.name
            )}
          </TableTd>
        </TableTr>
        <TableTr>
          <TableTd>Email</TableTd>
          <TableTd>
            {editable ? (
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
          <TableTd>Phone number</TableTd>
          <TableTd>
            {editable ? (
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
          <TableTd>Address</TableTd>
          <TableTd>
            {editable ? (
              <TextInput
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: event.currentTarget.value,
                  }))
                }
              />
            ) : (
              form.address
            )}
          </TableTd>
        </TableTr>
        <TableTr>
          <TableTd>Subscription amount</TableTd>
          <TableTd>
            {editable ? (
              <TextInput
                value={form.subscriptionAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subscriptionAmount: event.currentTarget.value,
                  }))
                }
              />
            ) : (
              form.subscriptionAmount
            )}
          </TableTd>
        </TableTr>
      </TableTbody>
    </Table>
  );
}

export default function CompanyDetailsPage() {
  const { can } = useAuth();
  const canViewFinanceData =
    can("dashboard.finance.view") || can("subscriptions.finance.view");
  const canViewCreditData = can("credit_scoring.view");
  const canManageCompanyOps = can("troubleshooting.view");
  const canManageCompanyProfile = can("organizations.view");
  const params = useParams();
  const companyId = params?.companyId;
  const company = companies.find((item) => item.id === companyId);
  const companyIndex = companies.findIndex((item) => item.id === companyId);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingVat, setIsUpdatingVat] = useState(false);
  const [isResendingZ, setIsResendingZ] = useState(false);
  const [isClearingToken, setIsClearingToken] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [creditRerunVersion, setCreditRerunVersion] = useState(0);
  const [isCreditRerunning, setIsCreditRerunning] = useState(false);
  const organizationOptions = organizations.map((organization) => ({
    value: organization.name,
    label: organization.name,
  }));
  const assignedOrganization =
    company?.organizationName || organizations[0]?.name || "Unassigned";

  const [editableForm, setEditableForm] = useState({
    organization: assignedOrganization,
    name: company?.name || "",
    email: `support+${company?.id || "company"}@simplify.co.tz`,
    phone: "+255700000000",
    address: `${company?.region || "Dar es Salaam"}, Tanzania`,
    subscriptionAmount: "69,620",
  });

  const [vatData, setVatData] = useState({
    tin: company?.tin || "",
    serial: `10TZ13${String(900000 + Number((company?.id || "cmp-001").replace("cmp-", ""))).slice(-6)}`,
    vrn:
      Number((company?.id || "cmp-001").replace("cmp-", "")) % 4 === 0
        ? "NOT REGISTERED"
        : "18526628A",
    mobile: editableForm.phone,
    street: `${company?.region || "Dar es Salaam"} Central`,
    city: company?.region || "Dar es Salaam",
    country: "TANZANIA",
    taxOffice: "KINONDONI",
    lastUpdated: "20/04/2026, 16:18:08 EAT",
  });

  const [zRange, setZRange] = useState({ from: "", to: "" });
  const totalZReportsIssued = company.receipts["30d"].reduce(
    (sum, value) => sum + value,
    0,
  );
  const totalReceiptsCreated = company.receipts["3m"].reduce(
    (sum, value) => sum + value,
    0,
  );
  const totalReceiptAmount =
    totalReceiptsCreated * company.avgReceiptValue["3m"];
  const totalExpensesAdded = company.expenses["3m"].reduce(
    (sum, value) => sum + value,
    0,
  );
  const totalExpenseAmount = totalExpensesAdded * company.avgExpenseValue["3m"];

  const subscriptionColor = !company
    ? "gray"
    : company.subscriptionStatus === "active"
      ? "green"
      : company.subscriptionStatus === "temporary" ||
          company.subscriptionStatus === "pending"
        ? "orange"
        : "red";
  const issueScore = company
    ? company.receiptsSubmittedStuck + company.zReportsStuck
    : 0;
  const traStatus = issueScore >= 4 ? "blocked" : "active";
  const vrnDigits = String(
    10000000 +
      ((Number((company?.id || "cmp-001").replace("cmp-", "")) * 137) %
        89999999),
  ).padStart(8, "0");
  const vrnSuffix = String.fromCharCode(
    65 + (Number((company?.id || "cmp-001").replace("cmp-", "")) % 26),
  );
  const vrn =
    Number((company?.id || "cmp-001").replace("cmp-", "")) % 4 === 0
      ? "NOT REGISTERED"
      : `${vrnDigits}${vrnSuffix}`;
  const lastReceiptCreatedAt = (() => {
    const dayOffset =
      Number((company?.id || "cmp-001").replace("cmp-", "")) % 14;
    const date = new Date("2026-04-20T16:30:00");
    date.setDate(date.getDate() - dayOffset);
    return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} EAT`;
  })();
  const lastExpenseCreatedAt = (() => {
    const dayOffset =
      (Number((company?.id || "cmp-001").replace("cmp-", "")) % 12) + 1;
    const date = new Date("2026-04-20T14:20:00");
    date.setDate(date.getDate() - dayOffset);
    return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} EAT`;
  })();
  const creditProfile = company && canViewCreditData
    ? getCompanyCreditProfile(company, creditRerunVersion)
    : null;

  if (!company) {
    return (
      <Card withBorder>
        <Title order={3}>Company not found</Title>
        <Link href="/admin/companies">Back to companies</Link>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Title order={2}>{company.name}</Title>
          <Text size="sm" c="dimmed">
            TIN: {company.tin}
          </Text>
        </Stack>
        <Button component={Link} href="/admin/companies" variant="default">
          Back to companies
        </Button>
      </Group>

      <Card withBorder>
        <Grid align="center">
          <GridCol span={{ base: 12, md: 8 }}>
            <Group gap="xl">
              <Text size="sm">
                <Text span fw={700}>
                  TRA status:
                </Text>{" "}
                <Text
                  span
                  c={traStatus === "active" ? "green" : "red"}
                  fw={600}
                  tt="uppercase"
                >
                  {traStatus}
                </Text>
              </Text>
              <Text size="sm">
                <Text span fw={700}>
                  Subscription:
                </Text>{" "}
                <Text span c={subscriptionColor} fw={600} tt="capitalize">
                  {company.subscriptionStatus}
                </Text>
              </Text>
              <Text size="sm">
                <Text span fw={700}>
                  VRN:
                </Text>{" "}
                {vrn}
              </Text>
            </Group>
          </GridCol>
          <GridCol span={{ base: 12, md: 4 }}>
            <Text size="sm" ta={{ base: "left", md: "right" }}>
              <Text span fw={700}>
                Integrations:
              </Text>{" "}
              <Text
                span
                c={company.integrations.api ? "gray.7" : "gray.5"}
                fw={600}
              >
                API {company.integrations.api ? "On" : "Off"}
              </Text>{" "}
              |{" "}
              <Text
                span
                c={company.integrations.xero ? "blue.7" : "gray.5"}
                fw={600}
              >
                Xero {company.integrations.xero ? "On" : "Off"}
              </Text>{" "}
              |{" "}
              <Text
                span
                c={company.integrations.quickbooks ? "green.7" : "gray.5"}
                fw={600}
              >
                QuickBooks {company.integrations.quickbooks ? "On" : "Off"}
              </Text>
            </Text>
          </GridCol>
        </Grid>
      </Card>

      {creditProfile && (
        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <IconRefresh size={18} />
              <Title order={4}>Credit Readiness</Title>
            </Group>
            <Button
              variant="light"
              loading={isCreditRerunning}
              onClick={() => {
                if (isCreditRerunning) return;
                setIsCreditRerunning(true);
                setTimeout(() => {
                  setCreditRerunVersion((current) => current + 1);
                  setIsCreditRerunning(false);
                  notifications.show({
                    title: "Credit model re-run",
                    message: "Latest credit profile has been refreshed.",
                    color: "blue",
                  });
                }, 1200);
              }}
            >
              Re-run scoring
            </Button>
          </Group>
          <Grid gutter="sm">
            <GridCol span={{ base: 6, md: 3 }}>
              <Text size="xs" c="dimmed">
                Credit score
              </Text>
              <Text fw={700} fz={30}>
                {creditProfile.score}
              </Text>
            </GridCol>
            <GridCol span={{ base: 6, md: 3 }}>
              <Text size="xs" c="dimmed">
                Band
              </Text>
              <Text fw={700} fz={30}>
                {creditProfile.band}
              </Text>
            </GridCol>
            <GridCol span={{ base: 6, md: 3 }}>
              <Text size="xs" c="dimmed">
                Status
              </Text>
              <Text fw={700} fz={22} c={creditProfile.ready ? "green" : "red"}>
                {creditProfile.status}
              </Text>
            </GridCol>
            <GridCol span={{ base: 6, md: 3 }}>
              <Text size="xs" c="dimmed">
                Suggested limit
              </Text>
              <Text fw={700} fz={22}>
                TSh {creditProfile.suggestedLimit.toLocaleString()}
              </Text>
            </GridCol>
            <GridCol span={12}>
              <Text size="sm" c="dimmed">
                Last evaluated: {creditProfile.lastEvaluatedAt}
              </Text>
              <Text size="sm" mt={6}>
                {creditProfile.reasons.length
                  ? `Key reason(s): ${creditProfile.reasons.join(" | ")}`
                  : "Key reason(s): Meets threshold checks"}
              </Text>
            </GridCol>
          </Grid>
        </Card>
      )}

      <Grid>
        <GridCol span={{ base: 12, lg: 8 }}>
          <Card withBorder h="100%">
            <Grid gutter="sm">
              <GridCol span={{ base: 12, md: 6 }}>
                <Text size="sm">
                  <Text span fw={700}>
                    Receipts created so far:
                  </Text>{" "}
                  {totalReceiptsCreated.toLocaleString()}
                </Text>
              </GridCol>
              {canViewFinanceData ? (
                <GridCol span={{ base: 12, md: 6 }}>
                  <Text size="sm">
                    <Text span fw={700}>
                      Total amount:
                    </Text>{" "}
                    TSh {totalReceiptAmount.toLocaleString()}
                  </Text>
                </GridCol>
              ) : null}
              <GridCol span={{ base: 12, md: 6 }}>
                <Text size="sm">
                  <Text span fw={700}>
                    Expenses added:
                  </Text>{" "}
                  {totalExpensesAdded.toLocaleString()}
                </Text>
              </GridCol>
              {canViewFinanceData ? (
                <GridCol span={{ base: 12, md: 6 }}>
                  <Text size="sm">
                    <Text span fw={700}>
                      Expense value:
                    </Text>{" "}
                    TSh {totalExpenseAmount.toLocaleString()}
                  </Text>
                </GridCol>
              ) : null}
              <GridCol span={{ base: 12, md: 6 }}>
                <Text size="sm">
                  <Text span fw={700}>
                    Last receipt created:
                  </Text>{" "}
                  {lastReceiptCreatedAt}
                </Text>
              </GridCol>
              <GridCol span={{ base: 12, md: 6 }}>
                <Text size="sm">
                  <Text span fw={700}>
                    Last expense created:
                  </Text>{" "}
                  {lastExpenseCreatedAt}
                </Text>
              </GridCol>
            </Grid>
          </Card>
        </GridCol>

        <GridCol span={{ base: 12, lg: 4 }}>
          <Card withBorder h="100%">
            <Stack gap={8}>
              <div>
                <Text size="xs" c="dimmed">
                  Current status
                </Text>
                <Text fw={700} tt="capitalize" c={subscriptionColor}>
                  {company.subscriptionStatus}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Expiry date
                </Text>
                <Text fw={700}>{company.expiryDate}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Days to expiry
                </Text>
                <Text fw={700}>{getDaysUntil(company.expiryDate)}</Text>
              </div>
              <Group justify="flex-end" mt="auto">
                <Button
                  component={Link}
                  href={`/admin/subscriptions?company=${encodeURIComponent(company.name)}`}
                  size="xs"
                  variant="default"
                >
                  View in subscriptions
                </Button>
              </Group>
            </Stack>
          </Card>
        </GridCol>
      </Grid>

      <Grid>
        <GridCol span={{ base: 12, lg: 6 }}>
          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <IconPencil size={18} />
                <Title order={4}>Company Details</Title>
              </Group>
              {isEditingProfile ? (
                <Group gap="xs">
                  <Button
                    variant="default"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    loading={isSaving}
                    onClick={() => {
                      setIsSaving(true);
                      setTimeout(() => {
                        setIsSaving(false);
                        setIsEditingProfile(false);
                        notifications.show({
                          title: "Company updated",
                          message: "Company details saved successfully.",
                          color: "green",
                        });
                      }, 800);
                    }}
                  >
                    Save Details
                  </Button>
                </Group>
              ) : canManageCompanyProfile ? (
                <Button
                  variant="light"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Details
                </Button>
              ) : null}
            </Group>
            <CompanyInfoTable
              company={company}
              editable={isEditingProfile && canManageCompanyProfile}
              form={editableForm}
              setForm={setEditableForm}
              organizationOptions={organizationOptions}
            />
          </Card>
        </GridCol>

        {canManageCompanyOps ? (
          <GridCol span={{ base: 12, lg: 6 }}>
            <Card withBorder>
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <IconRefresh size={18} />
                  <Title order={4}>VAT Updates</Title>
                </Group>
                <Group gap="sm">
                  <Text size="xs" c="dimmed">
                    Last updated: {vatData.lastUpdated}
                  </Text>
                  <Button
                    loading={isUpdatingVat}
                    onClick={() => {
                      setIsUpdatingVat(true);
                      setTimeout(() => {
                        setVatData((current) => ({
                          ...current,
                          lastUpdated: "21/04/2026, 10:02:15 EAT",
                        }));
                        setIsUpdatingVat(false);
                        notifications.show({
                          title: "TRA update triggered",
                          message: "VAT command sent to TRA and response stored.",
                          color: "blue",
                        });
                      }, 900);
                    }}
                  >
                    Fetch Updates
                  </Button>
                </Group>
              </Group>
              <Table withTableBorder striped verticalSpacing="xs">
                <TableTbody>
                  <TableTr>
                    <TableTd>Serial</TableTd>
                    <TableTd>{vatData.serial}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>VRN</TableTd>
                    <TableTd>{vatData.vrn}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>Street</TableTd>
                    <TableTd>{vatData.street}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>City</TableTd>
                    <TableTd>{vatData.city}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>Country</TableTd>
                    <TableTd>{vatData.country}</TableTd>
                  </TableTr>
                  <TableTr>
                    <TableTd>Tax Office</TableTd>
                    <TableTd>{vatData.taxOffice}</TableTd>
                  </TableTr>
                </TableTbody>
              </Table>
            </Card>
          </GridCol>
        ) : null}
      </Grid>

      {canManageCompanyOps ? (
        <Grid>
          <GridCol span={{ base: 12, md: 8 }}>
            <Card withBorder h="100%">
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <IconClipboardList size={18} />
                  <Title order={4}>Z-Report Re-Issuing</Title>
                </Group>
                <Text size="sm" c="dimmed">
                  Issued: {totalZReportsIssued} | Stuck: {company.zReportsStuck}
                </Text>
            </Group>
              <Group align="end">
                <TextInput
                  label="From"
                  type="date"
                  value={zRange.from}
                  onChange={(event) =>
                    setZRange((current) => ({
                      ...current,
                      from: event.currentTarget.value,
                    }))
                  }
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="To"
                  type="date"
                  value={zRange.to}
                  onChange={(event) =>
                    setZRange((current) => ({
                      ...current,
                      to: event.currentTarget.value,
                    }))
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  loading={isResendingZ}
                  onClick={() => {
                    setIsResendingZ(true);
                    setTimeout(() => {
                      setIsResendingZ(false);
                      notifications.show({
                        title: "Z-report resend queued",
                        message: "Backend command sent for selected date range.",
                        color: "green",
                      });
                    }, 900);
                  }}
                >
                  Resend Z-Reports
                </Button>
              </Group>
            </Card>
          </GridCol>
          <GridCol span={{ base: 12, md: 4 }}>
            <Card withBorder h="100%">
              <Group justify="space-between" align="center" mb="sm">
                <Group gap="xs">
                  <IconTrash size={18} />
                  <Title order={4}>Token Clearing</Title>
                </Group>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Clear TRA server tokens for client technical authentication
                issues.
              </Text>
              <Button
                variant="light"
                color="red"
                fullWidth
                onClick={() => setTokenModalOpen(true)}
              >
                Clear TRA Tokens
              </Button>
            </Card>
          </GridCol>
        </Grid>
      ) : (
        <Card withBorder>
          <Text size="sm" c="dimmed">
            Advanced operational controls are hidden for your current role.
          </Text>
        </Card>
      )}

      {canManageCompanyOps ? (
        <Modal
          opened={tokenModalOpen}
          onClose={() => setTokenModalOpen(false)}
          title="Clear TRA Tokens"
          centered
        >
          <Stack>
            <Text size="sm">
              Clear TRA tokens for <b>{company.name}</b>.
            </Text>
            <Text size="sm" c="dimmed">
              Inform client to log out and log in again after token clearing.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setTokenModalOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={isClearingToken}
                onClick={() => {
                  setIsClearingToken(true);
                  setTimeout(() => {
                    setIsClearingToken(false);
                    notifications.show({
                      title: "Token cleared",
                      message: "TRA token was cleared from server successfully.",
                      color: "green",
                    });
                    setTokenModalOpen(false);
                  }, 800);
                }}
              >
                Clear TRA Tokens
              </Button>
            </Group>
          </Stack>
        </Modal>
      ) : null}
    </Stack>
  );
}
