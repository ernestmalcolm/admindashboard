"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getEffectivePermissions,
  MOCK_ACCOUNTS,
  normalizeOverrides,
} from "@/lib/rbac";

const AuthContext = createContext(null);
const STORAGE_KEY = "simplify_admin_auth";

function readStoredAuth() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    const savedAccounts = Array.isArray(parsed?.accounts)
      ? parsed.accounts
      : [];
    const mergedAccounts = MOCK_ACCOUNTS.map((defaultAccount) => {
      const matched = savedAccounts.find(
        (item) => item.id === defaultAccount.id,
      );
      if (!matched) return defaultAccount;
      return {
        ...defaultAccount,
        ...matched,
        permissionOverrides: normalizeOverrides(matched.permissionOverrides),
      };
    });
    return {
      user: parsed?.user || null,
      accounts: mergedAccounts,
    };
  } catch {
    return { user: null, accounts: MOCK_ACCOUNTS };
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, accounts: MOCK_ACCOUNTS });
  const [ready, setReady] = useState(false);
  const user = state.user;
  const accounts = state.accounts;

  useEffect(() => {
    const loaded = readStoredAuth() || { user: null, accounts: MOCK_ACCOUNTS };
    queueMicrotask(() => {
      setState(loaded);
      setReady(true);
    });
  }, []);

  function persist(nextState) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    setState(nextState);
  }

  const value = useMemo(
    () => ({
      user,
      accounts,
      ready,
      isAuthenticated: Boolean(user),
      permissions: getEffectivePermissions(
        user?.role,
        user?.permissionOverrides || {},
      ),
      can: (permission) =>
        Boolean(
          getEffectivePermissions(user?.role, user?.permissionOverrides || {})[
            permission
          ],
        ),
      login: ({ accountId, name, role }) => {
        const selectedAccount = accounts.find(
          (account) => account.id === accountId,
        );
        const fallbackRole = role || selectedAccount?.role || "support";
        const nextUser = {
          id: selectedAccount?.id || "custom-user",
          name: name || selectedAccount?.name || "Admin User",
          role: fallbackRole,
          permissionOverrides:
            normalizeOverrides(selectedAccount?.permissionOverrides) || {},
        };
        persist({ user: nextUser, accounts });
      },
      switchAccount: (accountId) => {
        const selectedAccount = accounts.find(
          (account) => account.id === accountId,
        );
        if (!selectedAccount) return;
        persist({
          user: {
            id: selectedAccount.id,
            name: selectedAccount.name,
            role: selectedAccount.role,
            permissionOverrides: normalizeOverrides(
              selectedAccount.permissionOverrides,
            ),
          },
          accounts,
        });
      },
      updateAccountOverrides: (accountId, permission, value) => {
        const nextAccounts = accounts.map((account) => {
          if (account.id !== accountId) return account;
          return {
            ...account,
            permissionOverrides: {
              ...normalizeOverrides(account.permissionOverrides),
              [permission]: value,
            },
          };
        });

        const matched = nextAccounts.find((item) => item.id === user?.id);
        const nextUser = matched
          ? {
              ...user,
              role: matched.role,
              permissionOverrides: normalizeOverrides(
                matched.permissionOverrides,
              ),
            }
          : user;
        persist({ user: nextUser, accounts: nextAccounts });
      },
      logout: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setState({ user: null, accounts: MOCK_ACCOUNTS });
      },
    }),
    [accounts, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
