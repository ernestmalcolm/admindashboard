"use client";

import { Button, FileInput, Group, Modal, NumberInput, Select, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMemo, useState } from "react";

function buildProofUrl(companyId, proof) {
  const extension = proof.type === "PDF" ? "pdf" : "jpg";
  return `https://example.com/payments/${companyId}/${proof.id}.${extension}`;
}

function addYears(dateString, years) {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = String(dateString).slice(0, 10).split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "LIPA_NAMBA", label: "LIPA_NAMBA" },
  { value: "CRDB", label: "CRDB" },
  { value: "CASH", label: "CASH" },
  { value: "WAIVER", label: "WAIVER" },
  { value: "COMMISSION", label: "COMMISSION" },
];

export function SubscriptionActionModals({ company, opened, mode, onClose, onApply }) {
  const [renewYears, setRenewYears] = useState(1);
  const [renewMethod, setRenewMethod] = useState("LIPA_NAMBA");
  const [renewPaymentDate, setRenewPaymentDate] = useState("2026-04-20");
  const [renewReference, setRenewReference] = useState("");
  const [renewRemark, setRenewRemark] = useState("");
  const [renewProofMode, setRenewProofMode] = useState("none");
  const [renewProofFile, setRenewProofFile] = useState(null);
  const [renewProofText, setRenewProofText] = useState("");

  const isApprove = mode === "approve";
  const isRenew = mode === "renew";
  const isSuspend = mode === "suspend";
  const isTemporary = mode === "temporary";
  const recentProofs = useMemo(
    () => [...(company?.paymentProofs || [])].sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt))).slice(0, 3),
    [company],
  );

  const title = isApprove
    ? `Subscription approval for ${company?.name || ""}`
    : isRenew
      ? `Renew subscription for ${company?.name || ""}`
      : isTemporary
        ? `Set temporary access for ${company?.name || ""}`
      : `Suspend subscription for ${company?.name || ""}`;

  function closeAndReset() {
    onClose();
  }

  const pendingSubmission = useMemo(() => {
    const latestProof = recentProofs[0];
    const pendingHistory = (company?.subscriptionHistory || []).find(
      (entry) => String(entry.reference || "").startsWith("PN-"),
    );
    const proofHintAmount = pendingHistory?.amount || company?.lastApprovedPayment?.amount || 620000;
    const proofHintMethod =
      pendingHistory?.method || company?.lastApprovedPayment?.paymentMethod || "Bank Transfer";
    const proofHintDate = latestProof?.uploadedAt || company?.lastApprovedPayment?.paidDate || "2026-04-20";
    const proofHintReference = pendingHistory?.reference || `PN-${company?.id?.replace("cmp-", "") || "000"}-SUBMIT`;

    return {
      amount: proofHintAmount,
      paymentMethod: proofHintMethod,
      paidDate: proofHintDate,
      reference: proofHintReference,
      proofId: latestProof?.id || pendingHistory?.proofId || null,
    };
  }, [company, recentProofs]);
  const lastSubscribedYear = useMemo(() => {
    const years = (company?.subscriptionHistory || [])
      .map((entry) => Number(entry.year))
      .filter((value) => Number.isFinite(value));
    return years.length ? Math.max(...years) : Number(new Date().getFullYear());
  }, [company]);
  const projectedExpiryDate = useMemo(
    () => addYears(company?.expiryDate || "2026-04-20", renewYears || 1),
    [company?.expiryDate, renewYears],
  );

  function showSuccess(message) {
    notifications.show({
      title: "Subscription updated",
      message,
      color: "green",
    });
  }

  return (
    <Modal opened={opened} onClose={closeAndReset} title={title} centered>
      {isApprove && (
        <Stack>
          <TextInput
            label="Payment method (submitted by client)"
            value={pendingSubmission.paymentMethod}
            readOnly
          />
          <TextInput
            label="Amount (submitted by client)"
            value={new Intl.NumberFormat("en-TZ").format(pendingSubmission.amount)}
            readOnly
          />
          <TextInput
            label="Payment date (submitted by client)"
            value={pendingSubmission.paidDate}
            readOnly
          />
          <TextInput label="Payment reference" value={pendingSubmission.reference} readOnly />
          <Stack gap={4}>
            <Text fw={600} size="sm">
              Uploaded proof of payment
            </Text>
            {recentProofs.length > 0 ? (
              recentProofs.map((proof) => (
                <Text key={proof.id} size="sm" c="dimmed">
                  {proof.label} ({proof.type}) - {proof.uploadedAt} -{" "}
                  <Text
                    span
                    component="a"
                    href={proof.fileUrl || buildProofUrl(company.id, proof)}
                    target="_blank"
                    rel="noreferrer"
                    c="indigo.7"
                    fw={700}
                    td="underline"
                  >
                    Open proof
                  </Text>
                </Text>
              ))
            ) : (
              <Text size="sm" c="red">
                No uploaded proof found for this submission.
              </Text>
            )}
          </Stack>
          <Group justify="flex-end">
            <Button variant="light" color="red" onClick={closeAndReset}>
              Reject
            </Button>
            <Button
              onClick={() => {
                onApply("approve", {
                  paymentMethod: pendingSubmission.paymentMethod,
                  amount: pendingSubmission.amount,
                  paidDate: pendingSubmission.paidDate,
                  reference: pendingSubmission.reference,
                  selectedProofId: pendingSubmission.proofId,
                });
                showSuccess("Client payment approved and subscription renewed.");
                closeAndReset();
              }}
            >
              Approve & renew
            </Button>
          </Group>
        </Stack>
      )}

      {isRenew && (
        <Stack>
          <NumberInput
            label="Subscription duration (years)"
            min={1}
            max={5}
            value={renewYears}
            onChange={(value) => setRenewYears(Number(value) || 1)}
          />
          <Text size="sm" c="dimmed">
            Last subscribed year: {lastSubscribedYear}
          </Text>
          <Text size="sm" c="dimmed">
            Current expiry: {formatDisplayDate(company?.expiryDate)}
          </Text>
          <Text size="sm" fw={600}>
            Next expiry after renewal: {formatDisplayDate(projectedExpiryDate)}
          </Text>
          <TextInput
            label="Date of renewal / payment"
            type="date"
            value={renewPaymentDate}
            onChange={(event) => setRenewPaymentDate(event.currentTarget.value)}
          />
          <Select
            label="Payment method"
            value={renewMethod}
            onChange={(value) => setRenewMethod(value || "LIPA_NAMBA")}
            data={PAYMENT_METHOD_OPTIONS}
          />
          <TextInput
            label="Reference"
            value={renewReference}
            onChange={(event) => setRenewReference(event.currentTarget.value)}
            placeholder="Optional reference"
          />
          <Textarea
            label="Remark (optional)"
            value={renewRemark}
            onChange={(event) => setRenewRemark(event.currentTarget.value)}
            placeholder="Optional internal note for this subscription renewal"
            minRows={2}
          />
          <Select
            label="Upload payment proof (optional)"
            value={renewProofMode}
            onChange={(value) => setRenewProofMode(value || "none")}
            data={[
              { value: "none", label: "No upload" },
              { value: "file", label: "Upload file (image/pdf)" },
              { value: "text", label: "Upload payment text message" },
            ]}
          />
          {renewProofMode === "file" && (
            <FileInput
              label="Proof file"
              value={renewProofFile}
              onChange={setRenewProofFile}
              placeholder="Attach payment proof file"
            />
          )}
          {renewProofMode === "text" && (
            <Textarea
              label="Payment text message"
              value={renewProofText}
              onChange={(event) => setRenewProofText(event.currentTarget.value)}
              placeholder="Paste payment confirmation text message"
              minRows={3}
            />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onApply("renew", {
                  durationYears: renewYears,
                  paymentMethod: renewMethod,
                  paymentDate: renewPaymentDate,
                  projectedExpiryDate,
                  reference: renewReference.trim() || null,
                  remark: renewRemark.trim() || null,
                  proofUploadType: renewProofMode,
                  proofFileName: renewProofFile?.name || null,
                  proofTextMessage: renewProofText.trim() || null,
                });
                showSuccess("Subscription renewed successfully.");
                closeAndReset();
              }}
            >
              Renew
            </Button>
          </Group>
        </Stack>
      )}

      {isSuspend && (
        <Stack>
          <Text size="sm">
            This action will move the company subscription to <b>expired</b> and can immediately impact receipt issuance.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                onApply("suspend", {});
                showSuccess("Subscription suspended.");
                closeAndReset();
              }}
            >
              Yes, suspend
            </Button>
          </Group>
        </Stack>
      )}

      {isTemporary && (
        <Stack>
          <Text size="sm">
            This action will move the company from <b>expired</b> to <b>temporary</b> access for urgent operational continuity.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button
              color="orange"
              onClick={() => {
                onApply("temporary", {});
                showSuccess("Subscription moved to temporary status.");
                closeAndReset();
              }}
            >
              Set temporary
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
