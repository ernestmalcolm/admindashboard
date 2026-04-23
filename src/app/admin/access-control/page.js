"use client";

import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getEffectivePermissions,
  getPermissionLabel,
  getRoleLabel,
  PERMISSIONS,
} from "@/lib/rbac";

const MANAGEABLE_PERMISSIONS = Object.values(PERMISSIONS).filter(
  (permission) => permission !== PERMISSIONS.ACCESS_CONTROL_MANAGE,
);

export default function AccessControlPage() {
  const { accounts, updateAccountOverrides } = useAuth();
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || null,
    [accounts, selectedAccountId],
  );
  const selectedEffectivePermissions = selectedAccount
    ? getEffectivePermissions(
        selectedAccount.role,
        selectedAccount.permissionOverrides,
      )
    : null;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={2}>
          <Title order={3}>Access Control</Title>
          <Text c="dimmed" size="sm">
            Super Admin can define what each account can view or do.
          </Text>
        </Stack>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {accounts.map((account) => {
          const effective = getEffectivePermissions(
            account.role,
            account.permissionOverrides,
          );
          const enabledCount = MANAGEABLE_PERMISSIONS.filter(
            (permission) => effective[permission],
          ).length;
          return (
            <Card withBorder p="md" key={account.id}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={700}>{account.name}</Text>
                  <Badge variant="light">{getRoleLabel(account.role)}</Badge>
                </Group>
                <Divider />
                <Text size="sm" c="dimmed">
                  {enabledCount} of {MANAGEABLE_PERMISSIONS.length} permissions
                  enabled
                </Text>
                <Button
                  variant="light"
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  Manage permissions
                </Button>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>

      <Modal
        opened={Boolean(selectedAccount)}
        onClose={() => setSelectedAccountId(null)}
        title={selectedAccount ? `Permissions - ${selectedAccount.name}` : "Permissions"}
        size="lg"
        centered
      >
        {selectedAccount && selectedEffectivePermissions ? (
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Role: {getRoleLabel(selectedAccount.role)}
            </Text>
            <Divider />
            {MANAGEABLE_PERMISSIONS.map((permission) => (
              <Group key={`${selectedAccount.id}-${permission}`} justify="space-between">
                <Text size="sm">{getPermissionLabel(permission)}</Text>
                <Switch
                  checked={Boolean(selectedEffectivePermissions[permission])}
                  onChange={(event) =>
                    updateAccountOverrides(
                      selectedAccount.id,
                      permission,
                      event.currentTarget.checked,
                    )
                  }
                />
              </Group>
            ))}
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
