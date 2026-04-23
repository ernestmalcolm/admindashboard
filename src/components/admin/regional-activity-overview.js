"use client";

import { Group, Text, Title, Tooltip } from "@mantine/core";

export function RegionalActivityOverview({ regionalData, range }) {
  const maxActiveCompanies = Math.max(...regionalData.map((item) => item.activeCompanies), 1);
  const chartWidth = 980;
  const chartHeight = 280;
  const chartPadding = { top: 24, right: 22, bottom: 58, left: 22 };
  const barsAreaHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const barsAreaWidth = chartWidth - chartPadding.left - chartPadding.right;
  const barSlot = barsAreaWidth / Math.max(regionalData.length, 1);
  const barWidth = Math.max(Math.min(barSlot * 0.8, 58), 20);

  return (
    <div>
      <Title order={4}>Regional Active Companies</Title>
      <Text size="sm" c="dimmed" mb="sm">
        Active companies by region ({range})
      </Text>

      <div style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: 10, padding: 10, background: "white" }}>
        <Group gap={6} mb="xs">
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "var(--mantine-color-blue-6)" }} />
          <Text size="xs" c="dimmed">
            Active companies
          </Text>
        </Group>

        <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Regional receipt count bar chart">
          <line
            x1={chartPadding.left}
            y1={chartHeight - chartPadding.bottom}
            x2={chartWidth - chartPadding.right}
            y2={chartHeight - chartPadding.bottom}
            stroke="var(--mantine-color-gray-3)"
          />

          {regionalData.map((regionItem, index) => {
            const x = chartPadding.left + barSlot * index + barSlot / 2 - barWidth / 2;
            const barHeight = (regionItem.activeCompanies / maxActiveCompanies) * barsAreaHeight;
            const y = chartHeight - chartPadding.bottom - barHeight;
            return (
              <g key={regionItem.region}>
                <Tooltip
                  label={
                    <div>
                      <Text size="sm" fw={700}>
                        {regionItem.region}
                      </Text>
                      <Text size="xs">Active companies: {regionItem.activeCompanies}</Text>
                      <Text size="xs">Receipts issued: {regionItem.receipts}</Text>
                      <Text size="xs">Expenses added: {regionItem.expensesAdded}</Text>
                    </div>
                  }
                  withArrow
                  color="blue"
                  radius="md"
                  multiline
                >
                  <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill="var(--mantine-color-blue-6)" />
                </Tooltip>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--mantine-color-gray-7)"
                >
                  {regionItem.region}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
