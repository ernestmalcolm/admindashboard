"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Grid,
  GridCol,
  Group,
  Menu,
  Modal,
  MultiSelect,
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
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { IconBell, IconCalendarEvent, IconDotsVertical, IconEye, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = ["50", "75", "100"];
const SECTION_CONFIG = {
  videos: { title: "Tax Videos", addLabel: "Add New Video" },
  reminders: { title: "Tax Reminders", addLabel: "Add New Reminder" },
  articles: { title: "Tax Articles", addLabel: "Add New Article" },
  tips: { title: "Tax Tips", addLabel: "Add New Tax Tip" },
};

function buildTaxHubRows(section) {
  const topicPool = [
    "VAT filing basics",
    "PAYE reconciliation",
    "EFD receipt validation",
    "Withholding tax updates",
    "Exemption handling",
    "Import duty guidance",
    "Deductible expenses rules",
    "Provisional tax planning",
  ];

  return Array.from({ length: 96 }, (_, index) => {
    const serial = index + 1;
    const day = String(1 + ((serial * 3) % 28)).padStart(2, "0");
    const month = String(1 + ((serial * 5) % 12)).padStart(2, "0");
    const dateAdded = `${day}/${month}/2026`;
    const titleBase = topicPool[index % topicPool.length];
    const title = `${titleBase} #${serial}`;

    if (section === "videos") {
      return {
        id: `video-${serial}`,
        title,
        date: dateAdded,
        duration: `${1 + (serial % 8)}:${String((serial * 7) % 60).padStart(2, "0")}`,
        link: `https://youtu.be/mock-video-${serial}`,
      };
    }

    if (section === "reminders") {
      const isRecurrent = serial % 3 === 0;
      return {
        id: `reminder-${serial}`,
        title,
        date: dateAdded,
        recurrent: isRecurrent ? "Yes" : "No",
        frequency: isRecurrent ? ["Weekly", "Monthly", "Quarterly"][serial % 3] : "-",
      };
    }

    if (section === "articles") {
      return {
        id: `article-${serial}`,
        title,
        description: `Guidance note for ${titleBase.toLowerCase()} and practical compliance steps for operations teams.`,
        tags: "-",
        dateAdded,
      };
    }

    return {
      id: `tip-${serial}`,
      title: serial % 2 === 0 ? "Did you know?" : `Tax tip ${serial}`,
      description: `Quick tip on ${titleBase.toLowerCase()} to reduce reporting issues and improve filing consistency.`,
      tags: ["VAT", "Exemption", "EFD", "Deductions", "Employment Tax"][serial % 5],
      dateAdded,
    };
  });
}

export default function TaxHubCmsPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const currentSection = section && SECTION_CONFIG[section] ? section : "videos";

  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState("view");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [sendForm, setSendForm] = useState({
    audience: "All Companies",
    channels: ["In-app"],
    message: "",
  });
  const [scheduleForm, setScheduleForm] = useState({
    sendAt: "",
    audience: "All Companies",
    channels: ["In-app"],
    note: "",
  });
  const [scheduledNotifications, setScheduledNotifications] = useState({
    "reminder-3": [
      {
        id: "schedule-1",
        sendAt: "2026-05-15T09:00",
        audience: "All Companies",
        channels: ["In-app"],
        note: "VAT due reminder",
      },
    ],
  });

  const rows = useMemo(() => buildTaxHubRows(currentSection), [currentSection]);

  const filteredRows = useMemo(() => {
    const query = appliedQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  }, [rows, appliedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totals = useMemo(() => {
    if (currentSection === "videos") {
      return {
        total: rows.length,
        published: rows.filter((row) => Number(row.duration.split(":")[0]) >= 3).length,
        pending: rows.filter((row) => Number(row.duration.split(":")[0]) < 3).length,
      };
    }
    if (currentSection === "reminders") {
      return {
        total: rows.length,
        recurrent: rows.filter((row) => row.recurrent === "Yes").length,
        oneTime: rows.filter((row) => row.recurrent === "No").length,
      };
    }
    return {
      total: rows.length,
      tagged: rows.filter((row) => row.tags && row.tags !== "-").length,
      recent: rows.filter((row) => row.dateAdded.endsWith("/2026")).length,
    };
  }, [currentSection, rows]);

  const sectionMeta = SECTION_CONFIG[currentSection];
  const reminderSchedules = selectedReminder ? scheduledNotifications[selectedReminder.id] || [] : [];
  const displayFields = useMemo(() => {
    if (currentSection === "videos") return ["title", "date", "duration", "link"];
    if (currentSection === "reminders") return ["title", "date", "recurrent", "frequency"];
    if (currentSection === "articles") return ["title", "description", "tags", "dateAdded"];
    return ["title", "description", "tags", "dateAdded"];
  }, [currentSection]);

  function formatFieldLabel(key) {
    if (key === "dateAdded") return "Date Added";
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());
  }

  function openCrudModal(mode, row) {
    setSelectedItem(row);
    setCrudMode(mode);
    setEditForm(displayFields.reduce((acc, field) => ({ ...acc, [field]: row[field] ?? "" }), {}));
    setCrudModalOpen(true);
  }

  function openSendModal(row) {
    setSelectedReminder(row);
    setSendForm((current) => ({ ...current, message: `Reminder: ${row.title}` }));
    setSendModalOpen(true);
  }

  function openScheduleModal(row) {
    setSelectedReminder(row);
    setScheduleForm({
      sendAt: "",
      audience: "All Companies",
      channels: ["In-app"],
      note: `Schedule for ${row.title}`,
    });
    setScheduleModalOpen(true);
  }

  function handleSendNotification() {
    setSendModalOpen(false);
  }

  function handleAddSchedule() {
    if (!selectedReminder || !scheduleForm.sendAt) return;
    const newSchedule = {
      id: `schedule-${Date.now()}`,
      sendAt: scheduleForm.sendAt,
      audience: scheduleForm.audience,
      channels: scheduleForm.channels,
      note: scheduleForm.note,
    };

    setScheduledNotifications((current) => ({
      ...current,
      [selectedReminder.id]: [...(current[selectedReminder.id] || []), newSchedule],
    }));
    setScheduleForm((current) => ({ ...current, sendAt: "", note: "" }));
  }

  function handleSaveEdit() {
    if (!selectedItem) return;
    setCrudModalOpen(false);
  }

  function handleDeleteItem() {
    if (!selectedItem) return;
    setCrudModalOpen(false);
  }

  function renderCrudMenu(row, withNotifications = false) {
    return (
      <Menu shadow="md" width={230}>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray">
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconEye size={16} />} onClick={() => openCrudModal("view", row)}>
            View
          </Menu.Item>
          <Menu.Item leftSection={<IconPencil size={16} />} onClick={() => openCrudModal("edit", row)}>
            Edit
          </Menu.Item>
          <Menu.Item leftSection={<IconTrash size={16} />} c="red" onClick={() => openCrudModal("delete", row)}>
            Delete
          </Menu.Item>
          {withNotifications ? (
            <>
              <Menu.Divider />
              <Menu.Item leftSection={<IconBell size={16} />} onClick={() => openSendModal(row)}>
                Send notification
              </Menu.Item>
              <Menu.Item leftSection={<IconCalendarEvent size={16} />} onClick={() => openScheduleModal(row)}>
                Schedule notifications
              </Menu.Item>
            </>
          ) : null}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Stack gap="md">
      {currentSection === "reminders" ? (
        <Grid>
          <GridCol span={{ base: 12, sm: 4 }}>
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">
                Total {sectionMeta.title}
              </Text>
              <Text fw={700} fz={30}>
                {totals.total}
              </Text>
            </Card>
          </GridCol>
          <GridCol span={{ base: 12, sm: 4 }}>
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">
                Recurrent
              </Text>
              <Text fw={700} fz={30}>
                {totals.recurrent}
              </Text>
            </Card>
          </GridCol>
          <GridCol span={{ base: 12, sm: 4 }}>
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">
                One-time
              </Text>
              <Text fw={700} fz={30}>
                {totals.oneTime}
              </Text>
            </Card>
          </GridCol>
        </Grid>
      ) : (
        <Grid>
          <GridCol span={12}>
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">
                Total {sectionMeta.title}
              </Text>
              <Text fw={700} fz={30}>
                {totals.total}
              </Text>
            </Card>
          </GridCol>
        </Grid>
      )}

      <Card withBorder p="sm">
        <Group justify="space-between" mb="md">
          <Title order={3}>{sectionMeta.title}</Title>
          <Button leftSection={<IconPlus size={16} />}>{sectionMeta.addLabel}</Button>
        </Group>

        <Group align="end" mb="md">
          <TextInput
            label="Search"
            placeholder={`Search ${sectionMeta.title.toLowerCase()}`}
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
            Apply search
          </Button>
        </Group>

        <Group justify="space-between" mb="sm">
          <Text size="sm" c="dimmed">
            {filteredRows.length
              ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredRows.length)} of ${filteredRows.length}`
              : "No records match current search"}
          </Text>
          <Group gap="sm">
            <Select
              value={String(pageSize)}
              onChange={(value) => {
                const next = Number(value) || 50;
                setPageSize(next);
                setPage(1);
              }}
              data={PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: `${size} / page` }))}
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

        {currentSection === "videos" ? (
          <Table withTableBorder striped highlightOnHover>
            <TableThead>
              <TableTr>
                <TableTh>Title</TableTh>
                <TableTh>Date</TableTh>
                <TableTh>Duration</TableTh>
                <TableTh>Link</TableTh>
                <TableTh>Actions</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {paginatedRows.map((row) => (
                <TableTr key={row.id}>
                  <TableTd>{row.title}</TableTd>
                  <TableTd>{row.date}</TableTd>
                  <TableTd>{row.duration}</TableTd>
                  <TableTd>{row.link}</TableTd>
                  <TableTd>{renderCrudMenu(row)}</TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        ) : null}

        {currentSection === "reminders" ? (
          <Table withTableBorder striped highlightOnHover>
            <TableThead>
              <TableTr>
                <TableTh>Title</TableTh>
                <TableTh>Date</TableTh>
                <TableTh>Recurrent</TableTh>
                <TableTh>Frequency</TableTh>
                <TableTh>Actions</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {paginatedRows.map((row) => (
                <TableTr key={row.id}>
                  <TableTd>{row.title}</TableTd>
                  <TableTd>{row.date}</TableTd>
                  <TableTd>
                    <Badge color={row.recurrent === "Yes" ? "teal" : "gray"} variant="light">
                      {row.recurrent}
                    </Badge>
                  </TableTd>
                  <TableTd>{row.frequency}</TableTd>
                  <TableTd>{renderCrudMenu(row, true)}</TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        ) : null}

        {currentSection === "articles" ? (
          <Table withTableBorder striped highlightOnHover>
            <TableThead>
              <TableTr>
                <TableTh>Title</TableTh>
                <TableTh>Description</TableTh>
                <TableTh>Tags</TableTh>
                <TableTh>Date Added</TableTh>
                <TableTh>Actions</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {paginatedRows.map((row) => (
                <TableTr key={row.id}>
                  <TableTd>{row.title}</TableTd>
                  <TableTd>{row.description}</TableTd>
                  <TableTd>{row.tags}</TableTd>
                  <TableTd>{row.dateAdded}</TableTd>
                  <TableTd>{renderCrudMenu(row)}</TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        ) : null}

        {currentSection === "tips" ? (
          <Table withTableBorder striped highlightOnHover>
            <TableThead>
              <TableTr>
                <TableTh>Title</TableTh>
                <TableTh>Description</TableTh>
                <TableTh>Tags</TableTh>
                <TableTh>Date Added</TableTh>
                <TableTh>Actions</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {paginatedRows.map((row) => (
                <TableTr key={row.id}>
                  <TableTd>{row.title}</TableTd>
                  <TableTd>{row.description}</TableTd>
                  <TableTd>
                    <Badge variant="light" color="indigo">
                      {row.tags}
                    </Badge>
                  </TableTd>
                  <TableTd>{row.dateAdded}</TableTd>
                  <TableTd>{renderCrudMenu(row, true)}</TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        ) : null}
      </Card>

      <Modal
        opened={crudModalOpen}
        onClose={() => setCrudModalOpen(false)}
        title={`${crudMode.charAt(0).toUpperCase() + crudMode.slice(1)} ${sectionMeta.title.slice(0, -1)}`}
        size={crudMode === "delete" ? "md" : "lg"}
        centered
      >
        {selectedItem ? (
          <Stack>
            {crudMode === "view" ? (
              <Table withTableBorder striped>
                <TableTbody>
                  {displayFields.map((field) => (
                    <TableTr key={field}>
                      <TableTd>{formatFieldLabel(field)}</TableTd>
                      <TableTd>{String(selectedItem[field] ?? "-")}</TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
            ) : null}

            {crudMode === "edit" ? (
              <>
                {displayFields.map((field) => (
                  <TextInput
                    key={field}
                    label={formatFieldLabel(field)}
                    value={String(editForm[field] ?? "")}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, [field]: event.currentTarget.value }))
                    }
                  />
                ))}
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setCrudModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>Save</Button>
                </Group>
              </>
            ) : null}

            {crudMode === "delete" ? (
              <>
                <Text>
                  Are you sure you want to delete this item?
                </Text>
                <Text fw={700}>{selectedItem.title}</Text>
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setCrudModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button color="red" onClick={handleDeleteItem}>
                    Delete
                  </Button>
                </Group>
              </>
            ) : null}
          </Stack>
        ) : null}
      </Modal>

      <Modal
        opened={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        title="Send Notification"
        size="lg"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {selectedReminder ? `Item: ${selectedReminder.title}` : ""}
          </Text>
          <Select
            label="Audience"
            value={sendForm.audience}
            onChange={(value) =>
              setSendForm((current) => ({ ...current, audience: value || current.audience }))
            }
            data={["All Companies", "VAT Registered Only", "Operators Only"]}
          />
          <MultiSelect
            label="Channels"
            value={sendForm.channels}
            onChange={(value) =>
              setSendForm((current) => ({ ...current, channels: value }))
            }
            data={["In-app", "SMS"]}
            searchable
            clearable
          />
          <Textarea
            label="Message"
            minRows={3}
            value={sendForm.message}
            onChange={(event) =>
              setSendForm((current) => ({ ...current, message: event.currentTarget.value }))
            }
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSendModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification}>Send notification</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Notifications"
        size="xl"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {selectedReminder ? `Item: ${selectedReminder.title}` : ""}
          </Text>
          <Title order={5}>Former schedules</Title>
          {reminderSchedules.length ? (
            <Table withTableBorder striped>
              <TableThead>
                <TableTr>
                  <TableTh>Send at</TableTh>
                  <TableTh>Audience</TableTh>
                  <TableTh>Channels</TableTh>
                  <TableTh>Note</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {reminderSchedules.map((schedule) => (
                  <TableTr key={schedule.id}>
                    <TableTd>{schedule.sendAt.replace("T", " ")}</TableTd>
                    <TableTd>{schedule.audience}</TableTd>
                    <TableTd>{(schedule.channels || []).join(", ") || "-"}</TableTd>
                    <TableTd>{schedule.note || "-"}</TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          ) : (
            <Text size="sm" c="dimmed">
              No former schedules yet for this reminder.
            </Text>
          )}

          <Title order={5}>Add schedule</Title>
          <Grid>
            <GridCol span={{ base: 12, md: 6 }}>
              <TextInput
                label="Send at"
                type="datetime-local"
                value={scheduleForm.sendAt}
                onChange={(event) =>
                  setScheduleForm((current) => ({ ...current, sendAt: event.currentTarget.value }))
                }
              />
            </GridCol>
            <GridCol span={{ base: 12, md: 6 }}>
              <Select
                label="Audience"
                value={scheduleForm.audience}
                onChange={(value) =>
                  setScheduleForm((current) => ({ ...current, audience: value || current.audience }))
                }
                data={["All Companies", "VAT Registered Only", "Operators Only"]}
              />
            </GridCol>
            <GridCol span={{ base: 12, md: 6 }}>
              <MultiSelect
                label="Channels"
                value={scheduleForm.channels}
                onChange={(value) =>
                  setScheduleForm((current) => ({ ...current, channels: value }))
                }
                data={["In-app", "SMS"]}
                searchable
                clearable
              />
            </GridCol>
            <GridCol span={{ base: 12, md: 6 }}>
              <TextInput
                label="Note"
                value={scheduleForm.note}
                onChange={(event) =>
                  setScheduleForm((current) => ({ ...current, note: event.currentTarget.value }))
                }
              />
            </GridCol>
          </Grid>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setScheduleModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleAddSchedule} disabled={!scheduleForm.sendAt}>
              Save schedule
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
