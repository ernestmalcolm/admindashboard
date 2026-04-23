"use client";

import { Button, Card, Grid, GridCol, Group, Modal, Stack, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, Tabs, Text, Title } from "@mantine/core";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SubscriptionActionModals } from "@/components/admin/subscription-action-modals";
import { SubscriptionStatusBadge, SubscriptionTimingLabel } from "@/components/admin/subscription-status-badge";
import { useAuth } from "@/lib/auth-context";
import { companies, getCompanyCreditProfile, getDaysUntil } from "@/lib/mock-data";

function addMonths(dateString, months) {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function addYears(dateString, years) {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function buildXeroInvoiceNumber(company, index) {
  return `XERO-${company.id.toUpperCase().replace("CMP-", "")}-${String(100 + index).padStart(3, "0")}`;
}

function buildReceiptCode(company, index) {
  return `RCT-${company.id.toUpperCase().replace("CMP-", "")}-${String(200 + index).padStart(4, "0")}`;
}

function buildInvoicePdfUrl(company, index) {
  return `https://example.com/xero/invoices/${company.id}/${index + 1}.pdf`;
}

function buildProofUrl(company, proof) {
  const extension = proof.type === "PDF" ? "pdf" : "jpg";
  return `https://example.com/payments/${company.id}/${proof.id}.${extension}`;
}

export default function SubscriptionDetailPage() {
  const { can } = useAuth();
  const canViewFinanceDetails = can("subscriptions.finance.view");
  const canManageSubscriptions = can("subscriptions.manage");
  const canViewCredit = can("credit_scoring.view");
  const params = useParams();
  const companyId = params?.companyId;
  const [rows, setRows] = useState(companies);
  const [modalMode, setModalMode] = useState(null);
  const [proofMessagePreview, setProofMessagePreview] = useState(null);
  const [creditRerunVersion, setCreditRerunVersion] = useState(0);
  const [isCreditRerunning, setIsCreditRerunning] = useState(false);
  const company = useMemo(() => rows.find((item) => item.id === companyId), [rows, companyId]);
  const creditProfile = useMemo(
    () =>
      company && canViewCredit
        ? getCompanyCreditProfile(company, creditRerunVersion)
        : null,
    [canViewCredit, company, creditRerunVersion],
  );

  if (!company) {
    return (
      <Card withBorder>
        <Title order={3}>Company not found</Title>
        <Button component={Link} href="/admin/subscriptions" variant="subtle" mt="md">
          Back to subscriptions
        </Button>
      </Card>
    );
  }

  function applyAction(action, payload) {
    setRows((currentRows) =>
      currentRows.map((item) => {
        if (item.id !== company.id) return item;

        if (action === "approve") {
          return {
            ...item,
            subscriptionStatus: "active",
            expiryDate: addMonths(payload.paidDate || "2026-04-20", 12),
            lastApprovedPayment: {
              paymentMethod: payload.paymentMethod || "Bank Transfer",
              amount: payload.amount || 620000,
              paidDate: payload.paidDate || "2026-04-20",
              reference: payload.reference || "APR-MOCK",
              proofId: payload.selectedProofId || null,
            },
            subscriptionHistory: [
              {
                year: Number(String(payload.paidDate || "2026-04-20").slice(0, 4)),
                amount: payload.amount || 620000,
                method: payload.paymentMethod || "Bank Transfer",
                reference: payload.reference || "APR-MOCK",
                paymentFlow: "approved-from-proof",
                proofId: payload.selectedProofId || null,
                xeroInvoiceNumber: `XERO-${item.id.toUpperCase().replace("CMP-", "")}-APPROVED`,
                receiptCode: `RCT-${item.id.toUpperCase().replace("CMP-", "")}-APPROVED`,
                invoicePdfUrl: `https://example.com/xero/invoices/${item.id}/approved.pdf`,
              },
              ...item.subscriptionHistory.filter((entry) => !String(entry.reference || "").startsWith("PN-")),
            ],
          };
        }

        if (action === "renew") {
          const paymentYear = Number(String(payload.paymentDate || "2026-04-20").slice(0, 4));
          const nextProofs =
            payload.proofUploadType === "file" && payload.proofFileName
              ? [
                  {
                    id: `proof-${Date.now()}`,
                    label: payload.proofFileName,
                    uploadedAt: String(payload.paymentDate || "2026-04-20"),
                    type: "PDF",
                  },
                  ...item.paymentProofs,
                ]
              : payload.proofUploadType === "text" && payload.proofTextMessage
                ? [
                    {
                      id: `proof-${Date.now()}`,
                      label: "Payment text message",
                      uploadedAt: String(payload.paymentDate || "2026-04-20"),
                      type: "Text",
                      textMessage: payload.proofTextMessage,
                    },
                    ...item.paymentProofs,
                  ]
                : item.paymentProofs;
          return {
            ...item,
            subscriptionStatus: "active",
            expiryDate: payload.projectedExpiryDate || addYears(item.expiryDate, payload.durationYears || 1),
            lastApprovedPayment: {
              paymentMethod: payload.paymentMethod || item.lastApprovedPayment?.paymentMethod || "LIPA_NAMBA",
              amount: item.lastApprovedPayment?.amount || 620000,
              paidDate: payload.paymentDate || item.lastApprovedPayment?.paidDate || "2026-04-20",
              reference: payload.reference || item.lastApprovedPayment?.reference || "RX-RENEW-MOCK",
              proofId: item.lastApprovedPayment?.proofId || null,
            },
            subscriptionHistory: [
              {
                year: paymentYear,
                amount: 620000,
                method: payload.paymentMethod || "LIPA_NAMBA",
                reference: payload.reference || null,
                remark: payload.remark || null,
                xeroInvoiceNumber: `XERO-${item.id.toUpperCase().replace("CMP-", "")}-RENEW`,
                receiptCode: `RCT-${item.id.toUpperCase().replace("CMP-", "")}-RENEW`,
                invoicePdfUrl: `https://example.com/xero/invoices/${item.id}/renew.pdf`,
              },
              ...item.subscriptionHistory,
            ],
            paymentProofs: nextProofs,
          };
        }

        if (action === "suspend") {
          return { ...item, subscriptionStatus: "expired", expiryDate: "2026-04-20" };
        }

        if (action === "temporary") {
          return { ...item, subscriptionStatus: "temporary" };
        }

        return item;
      }),
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Title order={3}>{company.name}</Title>
          <Text c="dimmed" size="sm">
            Subscription profile and payment records.
          </Text>
        </Stack>
        <Button component={Link} href="/admin/subscriptions" variant="default">
          Back
        </Button>
      </Group>

      <Card withBorder p="md">
        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            {canViewFinanceDetails ? (
              <>
                <Tabs.Tab value="history">Subscription history</Tabs.Tab>
                <Tabs.Tab value="proof">Proof of payment</Tabs.Tab>
              </>
            ) : null}
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Grid>
              <GridCol span={{ base: 12, md: 8 }}>
                <Stack gap={4}>
                  <Text fw={700}>Company info</Text>
                  <Text size="sm">TIN: {company.tin}</Text>
                  <Text size="sm">Date joined: {company.dateJoined}</Text>
                  <Text size="sm">Expiry date: {company.expiryDate}</Text>
                  <Text size="sm">Days remaining: <SubscriptionTimingLabel expiryDate={company.expiryDate} /></Text>
                </Stack>
              </GridCol>
              <GridCol span={{ base: 12, md: 4 }}>
                <Group justify="flex-end">
                  <SubscriptionStatusBadge status={company.subscriptionStatus} expiryDate={company.expiryDate} />
                </Group>
              </GridCol>
            </Grid>
              {creditProfile && (
                <Card withBorder p="sm" mt="md">
                  <Group justify="space-between" mb={6}>
                    <Text fw={700}>Credit snapshot</Text>
                    <Button
                      size="xs"
                      variant="light"
                      loading={isCreditRerunning}
                      onClick={() => {
                        if (isCreditRerunning) return;
                        setIsCreditRerunning(true);
                        setTimeout(() => {
                          setCreditRerunVersion((current) => current + 1);
                          setIsCreditRerunning(false);
                        }, 1200);
                      }}
                    >
                      Re-run score
                    </Button>
                  </Group>
                  <Grid>
                    <GridCol span={{ base: 6, md: 3 }}>
                      <Text size="xs" c="dimmed">Score</Text>
                      <Text fw={700}>{creditProfile.score}</Text>
                    </GridCol>
                    <GridCol span={{ base: 6, md: 3 }}>
                      <Text size="xs" c="dimmed">Status</Text>
                      <Text fw={700} c={creditProfile.ready ? "green" : "red"}>{creditProfile.status}</Text>
                    </GridCol>
                    <GridCol span={{ base: 6, md: 3 }}>
                      <Text size="xs" c="dimmed">Band</Text>
                      <Text fw={700}>{creditProfile.band}</Text>
                    </GridCol>
                    <GridCol span={{ base: 6, md: 3 }}>
                      <Text size="xs" c="dimmed">Suggested limit</Text>
                      <Text fw={700}>TSh {creditProfile.suggestedLimit.toLocaleString()}</Text>
                    </GridCol>
                    <GridCol span={12}>
                      <Text size="xs" c="dimmed">Last updated: {creditProfile.lastEvaluatedAt}</Text>
                    </GridCol>
                  </Grid>
                </Card>
              )}
          </Tabs.Panel>

          {canViewFinanceDetails ? (
            <Tabs.Panel value="history" pt="md">
            <Table withTableBorder striped verticalSpacing="xs">
              <TableThead>
                <TableTr>
                  <TableTh>Year</TableTh>
                  <TableTh>Amount</TableTh>
                  <TableTh>Method</TableTh>
                  <TableTh>Reference</TableTh>
                  <TableTh>Remark</TableTh>
                  <TableTh>Xero invoice</TableTh>
                  <TableTh>Receipt code</TableTh>
                  <TableTh>Invoice PDF</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {company.subscriptionHistory.map((entry, index) => {
                  const xeroInvoiceNumber = entry.xeroInvoiceNumber || buildXeroInvoiceNumber(company, index);
                  const receiptCode = entry.receiptCode || buildReceiptCode(company, index);
                  const invoicePdfUrl = entry.invoicePdfUrl || buildInvoicePdfUrl(company, index);
                  return (
                  <TableTr key={`${entry.reference}-${entry.year}-${index}`}>
                    <TableTd>{entry.year}</TableTd>
                    <TableTd>{entry.amount.toLocaleString()}</TableTd>
                    <TableTd>{entry.method}</TableTd>
                    <TableTd>{entry.reference || "-"}</TableTd>
                    <TableTd>{entry.remark || "-"}</TableTd>
                    <TableTd>{xeroInvoiceNumber}</TableTd>
                    <TableTd>{receiptCode}</TableTd>
                    <TableTd>
                      <Text
                        component="a"
                        href={invoicePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        c="indigo.7"
                        fw={600}
                        size="sm"
                      >
                        Open / Print PDF
                      </Text>
                    </TableTd>
                  </TableTr>
                  );
                })}
              </TableTbody>
            </Table>
            </Tabs.Panel>
          ) : null}

          {canViewFinanceDetails ? (
            <Tabs.Panel value="proof" pt="md">
            {company.paymentProofs.length ? (
              <Table withTableBorder striped verticalSpacing="xs">
                <TableThead>
                  <TableTr>
                    <TableTh>Label</TableTh>
                    <TableTh>Type</TableTh>
                    <TableTh>Uploaded</TableTh>
                    <TableTh>File</TableTh>
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {company.paymentProofs.map((proof) => (
                    <TableTr key={proof.id}>
                      <TableTd>{proof.label}</TableTd>
                      <TableTd>{proof.type}</TableTd>
                      <TableTd>{proof.uploadedAt}</TableTd>
                      <TableTd>
                        {proof.type === "Text" ? (
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => setProofMessagePreview(proof.textMessage || "No message content.")}
                          >
                            View message
                          </Button>
                        ) : (
                          <Text
                            component="a"
                            href={proof.fileUrl || buildProofUrl(company, proof)}
                            target="_blank"
                            rel="noreferrer"
                            c="indigo.7"
                            fw={600}
                            size="sm"
                          >
                            Open {proof.type === "PDF" ? "PDF" : "Image"}
                          </Text>
                        )}
                      </TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
            ) : (
              <Text c="dimmed" size="sm">
                No payment proofs uploaded yet.
              </Text>
            )}
            </Tabs.Panel>
          ) : null}
        </Tabs>
      </Card>

      <Card withBorder p="md">
        <Group justify="flex-end">
          {canManageSubscriptions ? (
            <>
              <Button variant="default" color="green" onClick={() => setModalMode("approve")}>
                Approve subscription
              </Button>
              <Button variant="default" color="blue" onClick={() => setModalMode("renew")}>
                Renew subscription
              </Button>
              {company.subscriptionStatus === "expired" && (
                <Button color="orange" variant="light" onClick={() => setModalMode("temporary")}>
                  Set temporary access
                </Button>
              )}
              <Button color="red" variant="light" onClick={() => setModalMode("suspend")}>
                Suspend subscription
              </Button>
            </>
          ) : (
            <Text c="dimmed" size="sm">
              Subscription management actions are hidden for your current role.
            </Text>
          )}
        </Group>
        <Text c="dimmed" size="xs" mt="xs">
          Days to expiry (dynamic): {getDaysUntil(company.expiryDate)}
        </Text>
      </Card>

      {canManageSubscriptions ? (
        <SubscriptionActionModals
          company={company}
          opened={Boolean(modalMode)}
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onApply={applyAction}
        />
      ) : null}

      <Modal
        opened={Boolean(proofMessagePreview)}
        onClose={() => setProofMessagePreview(null)}
        title="Uploaded payment text message"
        centered
      >
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {proofMessagePreview}
        </Text>
      </Modal>
    </Stack>
  );
}
