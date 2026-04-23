"use client";

import { Button, Card, Select, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getRoleLabel } from "@/lib/rbac";

export default function Home() {
  const router = useRouter();
  const { login, accounts } = useAuth();
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === accountId) || accounts[0],
    [accountId, accounts],
  );
  const [name, setName] = useState(selectedAccount?.name || "Admin User");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card withBorder shadow="sm" radius="md" maw={420} w="100%">
        <Stack>
          <Title order={3}>Simplify Admin Login (Mock)</Title>
          <Text c="dimmed" size="sm">
            Choose a mock account to switch views by role and permissions.
          </Text>
          <Select
            label={`Mock account (${getRoleLabel(selectedAccount?.role)})`}
            value={accountId}
            onChange={(value) => {
              const nextId = value || accounts[0]?.id || "";
              setAccountId(nextId);
              const nextAccount =
                accounts.find((account) => account.id === nextId) || accounts[0];
              setName(nextAccount?.name || "Admin User");
            }}
            data={accounts.map((account) => ({
              value: account.id,
              label: `${account.name} - ${getRoleLabel(account.role)}`,
            }))}
          />
          <TextInput label="Display name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <Button
            onClick={() => {
              login({
                accountId: selectedAccount?.id,
                name,
                role: selectedAccount?.role,
              });
              notifications.show({
                title: "Welcome",
                message: `Logged in as ${selectedAccount?.name || "user"}`,
              });
              router.push("/admin");
            }}
          >
            Enter Dashboard
          </Button>
        </Stack>
      </Card>
    </div>
  );
}
