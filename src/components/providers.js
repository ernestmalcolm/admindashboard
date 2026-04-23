"use client";

import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AuthProvider } from "@/lib/auth-context";

const theme = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  fontFamily: "var(--font-geist-sans), sans-serif",
});

export function Providers({ children }) {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <AuthProvider>{children}</AuthProvider>
    </MantineProvider>
  );
}
