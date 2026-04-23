"use client";

import { AppShell, Burger, Group, NavLink, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAdjustmentsHorizontal,
  IconBuildingStore,
  IconBuildingWarehouse,
  IconMessageCircle2,
  IconReceipt,
  IconShieldCheck,
  IconTool,
  IconUsersGroup,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getRoleLabel, PERMISSIONS } from "@/lib/rbac";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: IconBuildingWarehouse, permission: PERMISSIONS.DASHBOARD_VIEW },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: IconReceipt, permission: PERMISSIONS.SUBSCRIPTIONS_VIEW },
  { href: "/admin/credit-scoring", label: "Credit Scoring", icon: IconShieldCheck, permission: PERMISSIONS.CREDIT_SCORING_VIEW },
  { href: "/admin/organizations", label: "Organizations", icon: IconBuildingStore, permission: PERMISSIONS.ORGANIZATIONS_VIEW },
  { href: "/admin/companies", label: "Companies", icon: IconBuildingStore, permission: PERMISSIONS.COMPANIES_VIEW },
  { href: "/admin/operators", label: "Operators", icon: IconUsersGroup, permission: PERMISSIONS.OPERATORS_VIEW },
  {
    href: "/admin/tax-hub-cms",
    label: "Tax Hub",
    icon: IconReceipt,
    permission: PERMISSIONS.TAX_HUB_VIEW,
    children: [
      { href: "/admin/tax-hub-cms?section=videos", label: "Tax Videos", permission: PERMISSIONS.TAX_HUB_VIEW },
      { href: "/admin/tax-hub-cms?section=reminders", label: "Tax Reminders", permission: PERMISSIONS.TAX_HUB_VIEW },
      { href: "/admin/tax-hub-cms?section=articles", label: "Tax Articles", permission: PERMISSIONS.TAX_HUB_VIEW },
      { href: "/admin/tax-hub-cms?section=tips", label: "Tax Tips", permission: PERMISSIONS.TAX_HUB_VIEW },
    ],
  },
  {
    href: "/admin/comms",
    label: "Comms",
    icon: IconMessageCircle2,
    permission: PERMISSIONS.COMMS_VIEW,
    children: [
      { href: "/admin/comms/in-app", label: "In App", permission: PERMISSIONS.COMMS_VIEW },
      { href: "/admin/comms/sms", label: "SMS", permission: PERMISSIONS.COMMS_VIEW },
    ],
  },
  {
    href: "/admin/troubleshooting",
    label: "Troubleshooting",
    icon: IconTool,
    permission: PERMISSIONS.TROUBLESHOOTING_VIEW,
    children: [
      { href: "/admin/troubleshooting", label: "Receipt Reissuing", permission: PERMISSIONS.TROUBLESHOOTING_VIEW },
      { href: "/admin/troubleshooting/z-report-reissuing", label: "Z-Report Reissuing", permission: PERMISSIONS.TROUBLESHOOTING_VIEW },
    ],
  },
  { href: "/admin/access-control", label: "Access Control", icon: IconAdjustmentsHorizontal, permission: PERMISSIONS.ACCESS_CONTROL_MANAGE },
];

function isPathActive(pathname, searchParams, href, options = {}) {
  if (!href) return false;
  const { includeSubpaths = false } = options;
  const [cleanHref, queryString] = href.split("?");
  const pathMatch = pathname === cleanHref || (includeSubpaths && cleanHref !== "/admin" && pathname.startsWith(`${cleanHref}/`));

  if (!pathMatch) return false;
  if (!queryString) return true;

  const expectedParams = new URLSearchParams(queryString);
  return Array.from(expectedParams.entries()).every(
    ([key, value]) => searchParams.get(key) === value,
  );
}

function hasActiveChild(pathname, searchParams, item) {
  if (!item.children?.length) return false;
  return item.children.some((child) => isPathActive(pathname, searchParams, child.href, { includeSubpaths: false }));
}

export function AdminShell({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, accounts, switchAccount, logout, can } = useAuth();
  const roleLabel = getRoleLabel(user?.role || "support");
  const activeAccountId = user?.id || accounts[0]?.id || "";

  return (
    <AppShell
      header={{ height: 62 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700}>Simplify Admin MVP</Text>
          </Group>
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              {user?.name} - {roleLabel}
            </Text>
            <Text
              size="sm"
              c="indigo.6"
              style={{ cursor: "pointer" }}
              onClick={() => {
                const index = accounts.findIndex(
                  (account) => account.id === activeAccountId,
                );
                const next = accounts[(index + 1) % accounts.length];
                if (next) switchAccount(next.id);
              }}
            >
              Switch Mock User
            </Text>
            <Text
              size="sm"
              c="indigo.6"
              style={{ cursor: "pointer" }}
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Logout
            </Text>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        {navItems
          .filter((item) => can(item.permission))
          .map((item) => {
            const parentActive = isPathActive(pathname, searchParams, item.href, { includeSubpaths: true });
            const childActive = hasActiveChild(pathname, searchParams, item);
            const isGroup = Boolean(item.children?.length);

            if (!isGroup) {
              return (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={
                    <Text c={parentActive ? "indigo.6" : undefined} fw={parentActive ? 600 : 400}>
                      {item.label}
                    </Text>
                  }
                  leftSection={<item.icon size={16} />}
                />
              );
            }

            return (
              <NavLink
                key={item.href}
                label={
                  <Text c={parentActive || childActive ? "indigo.6" : undefined} fw={parentActive || childActive ? 600 : 400}>
                    {item.label}
                  </Text>
                }
                leftSection={<item.icon size={16} />}
                defaultOpened={parentActive || childActive}
              >
                {item.children
                  .filter((child) => can(child.permission))
                  .map((child) => (
                    (() => {
                      const isChildActive = isPathActive(pathname, searchParams, child.href, { includeSubpaths: false });
                      return (
                    <NavLink
                      key={child.href}
                      component={Link}
                      href={child.href}
                      label={
                        <Text c={isChildActive ? "indigo.6" : undefined} fw={isChildActive ? 600 : 400}>
                          {child.label}
                        </Text>
                      }
                    />
                      );
                    })()
                  ))}
              </NavLink>
            );
          })}
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
