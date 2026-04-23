"use client";

import { Badge, Button, Card, Grid, GridCol, Group, MultiSelect, Select, Stack, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, Text, TextInput, Textarea, Title } from "@mantine/core";
import { IconCalendarEvent, IconPlus, IconSend } from "@tabler/icons-react";
import { useMemo, useState } from "react";

function buildScheduledRows(channel) {
  return Array.from({ length: 8 }, (_, index) => {
    const serial = index + 1;
    const month = String(1 + ((serial * 2) % 12)).padStart(2, "0");
    const day = String(5 + ((serial * 3) % 20)).padStart(2, "0");
    const hour = String(8 + (serial % 9)).padStart(2, "0");
    return {
      id: `schedule-${channel}-${serial}`,
      title: `${channel === "in-app" ? "In-app" : "SMS"} promo #${serial}`,
      audience: ["All", "Active companies", "VAT registered"][serial % 3],
      scheduledAt: `2026-${month}-${day} ${hour}:00`,
      status: serial % 3 === 0 ? "Paused" : "Queued",
    };
  });
}

function buildFormerRows(channel) {
  return Array.from({ length: 12 }, (_, index) => {
    const serial = index + 1;
    return {
      id: `batch-${channel}-${serial}`,
      batchName: `${channel === "in-app" ? "In-app" : "SMS"} batch ${serial}`,
      sentAt: `2026-${String(1 + (serial % 12)).padStart(2, "0")}-${String(2 + (serial % 26)).padStart(2, "0")} ${String(9 + (serial % 8)).padStart(2, "0")}:30`,
      audienceSize: 900 + serial * 43,
      delivered: 860 + serial * 41,
      failed: 40 + (serial % 7),
    };
  });
}

export function CommsChannelPage({ channel = "in-app" }) {
  const allRegionsOption = "All regions";
  const regionOptions = [
    allRegionsOption,
    "Dar es Salaam",
    "Arusha",
    "Mwanza",
    "Dodoma",
    "Mbeya",
    "Morogoro",
    "Tanga",
    "Kilimanjaro",
    "Kagera",
    "Zanzibar",
  ];
  const [form, setForm] = useState({
    title: "",
    audience: "All",
    regions: [allRegionsOption],
    sendType: "Schedule",
    scheduledAt: "",
    message: "",
  });

  const channelLabel = channel === "sms" ? "SMS" : "In-app";
  const scheduledRows = useMemo(() => buildScheduledRows(channel), [channel]);
  const formerRows = useMemo(() => buildFormerRows(channel), [channel]);

  return (
    <Stack gap="md">
      <Card withBorder p="sm">
        <Group justify="space-between" mb="sm">
          <Title order={3}>{channelLabel} Notifications</Title>
          <Badge color={channel === "sms" ? "orange" : "indigo"} variant="light">
            {channelLabel} channel
          </Badge>
        </Group>
        <Text c="dimmed" size="sm">
          Create and schedule notification campaigns for {channelLabel === "SMS" ? "SMS delivery" : "in-app delivery"}.
        </Text>
      </Card>

      <Card withBorder p="sm">
        <Group justify="space-between" mb="md">
          <Title order={4}>New setup / schedule</Title>
          <Button leftSection={<IconPlus size={16} />} variant="light">
            Save draft
          </Button>
        </Group>

        <Grid>
          <GridCol span={{ base: 12, md: 6 }}>
            <TextInput
              label="Campaign title"
              placeholder={`Enter ${channelLabel.toLowerCase()} campaign name`}
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.currentTarget.value }))}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 6 }}>
            <Select
              label="Audience"
              value={form.audience}
              onChange={(value) => setForm((current) => ({ ...current, audience: value || "All" }))}
              data={[
                "All",
                "Active companies",
                "Inactive companies",
                "Expired companies",
                "VAT registered",
                "Non-VAT",
              ]}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 6 }}>
            <MultiSelect
              label="Region"
              placeholder="Select one or more regions"
              value={form.regions}
              onChange={(value) => {
                let nextRegions = value;
                if (value.includes(allRegionsOption)) {
                  nextRegions = [allRegionsOption];
                } else if (!value.length) {
                  nextRegions = [allRegionsOption];
                }
                setForm((current) => ({ ...current, regions: nextRegions }));
              }}
              data={regionOptions}
              searchable
              clearable
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 4 }}>
            <Select
              label="Send type"
              value={form.sendType}
              onChange={(value) => setForm((current) => ({ ...current, sendType: value || "Schedule" }))}
              data={["Send now", "Schedule"]}
            />
          </GridCol>
          <GridCol span={{ base: 12, md: 8 }}>
            <TextInput
              label="Scheduled at"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.currentTarget.value }))}
              disabled={form.sendType !== "Schedule"}
            />
          </GridCol>
          <GridCol span={12}>
            <Textarea
              label="Message"
              minRows={4}
              placeholder={channel === "sms" ? "SMS content..." : "In-app notification content..."}
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.currentTarget.value }))}
            />
          </GridCol>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button variant="default" leftSection={<IconCalendarEvent size={16} />}>
            Schedule
          </Button>
          <Button leftSection={<IconSend size={16} />}>Send now</Button>
        </Group>
      </Card>

      <Card withBorder p="sm">
        <Title order={4} mb="md">
          Scheduled {channelLabel} notifications
        </Title>
        <Table withTableBorder striped highlightOnHover>
          <TableThead>
            <TableTr>
              <TableTh>Campaign</TableTh>
              <TableTh>Audience</TableTh>
              <TableTh>Scheduled at</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {scheduledRows.map((row) => (
              <TableTr key={row.id}>
                <TableTd>{row.title}</TableTd>
                <TableTd>{row.audience}</TableTd>
                <TableTd>{row.scheduledAt}</TableTd>
                <TableTd>
                  <Badge variant="light" color={row.status === "Queued" ? "teal" : "yellow"}>
                    {row.status}
                  </Badge>
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </Card>

      <Card withBorder p="sm">
        <Title order={4} mb="md">
          Former sendings / batches
        </Title>
        <Table withTableBorder striped highlightOnHover>
          <TableThead>
            <TableTr>
              <TableTh>Batch name</TableTh>
              <TableTh>Sent at</TableTh>
              <TableTh>Audience size</TableTh>
              <TableTh>Delivered</TableTh>
              <TableTh>Failed</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {formerRows.map((row) => (
              <TableTr key={row.id}>
                <TableTd>{row.batchName}</TableTd>
                <TableTd>{row.sentAt}</TableTd>
                <TableTd>{row.audienceSize}</TableTd>
                <TableTd>{row.delivered}</TableTd>
                <TableTd>{row.failed}</TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </Card>
    </Stack>
  );
}
