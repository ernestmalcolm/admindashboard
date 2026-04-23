"use client";

import { Badge } from "@mantine/core";
import { getDaysUntil, isExpiringSoon } from "@/lib/mock-data";

const palette = {
  active: "green",
  expired: "red",
  pending: "gray",
  temporary: "blue",
};

export function SubscriptionStatusBadge({ status, expiryDate }) {
  if (status === "active" && isExpiringSoon(expiryDate)) {
    return <Badge color="orange">Expiring soon</Badge>;
  }

  return <Badge color={palette[status] || "gray"}>{status}</Badge>;
}

export function SubscriptionTimingLabel({ expiryDate }) {
  const days = getDaysUntil(expiryDate);
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today";
  return `${days} days`;
}
