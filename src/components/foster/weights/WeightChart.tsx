import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TagColour } from "@/components/foster/ui/KittenDot";
import type { WeighInRow } from "@/lib/foster-queries";

const lineColours: Record<TagColour, string> = {
  blue: "#0ea5e9",
  pink: "#f472b6",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#10b981",
  purple: "#a855f7",
  white: "#94a3b8",
  grey: "#6b7280",
  brown: "#92400e",
  black: "#111827",
};

const fallbackColours = ["#ea580c", "#0891b2", "#7c3aed", "#db2777", "#16a34a"];

function parseSessionTime(date: string, time: string) {
  return new Date(`${date}T${time}`).getTime();
}

function formatAxisDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(timestamp);
}

function formatTooltipDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}

export function WeightChart({ weighIns }: { weighIns: WeighInRow[] }) {
  const { chartData, kittens, config } = useMemo(() => {
    const kittenDetails = new Map<string, { id: string; name: string; colour: TagColour | null }>();

    for (const session of weighIns) {
      for (const weight of session.weights) {
        if (!kittenDetails.has(weight.kitten_id)) {
          kittenDetails.set(weight.kitten_id, {
            id: weight.kitten_id,
            name: weight.kittens?.name ?? "Kitten",
            colour: weight.kittens?.tag_colour ?? null,
          });
        }
      }
    }

    const series = [...kittenDetails.values()];
    const chartConfig = Object.fromEntries(
      series.map((kitten, index) => [
        kitten.id,
        {
          label: kitten.name,
          color: kitten.colour
            ? lineColours[kitten.colour]
            : fallbackColours[index % fallbackColours.length]!,
        },
      ]),
    ) satisfies ChartConfig;

    const data = [...weighIns].reverse().map((session) => ({
      timestamp: parseSessionTime(session.date, session.time),
      ...Object.fromEntries(session.weights.map((weight) => [weight.kitten_id, weight.grams])),
    }));

    return { chartData: data, kittens: series, config: chartConfig };
  }, [weighIns]);

  if (!chartData.length || !kittens.length) return null;

  return (
    <ChartContainer
      config={config}
      className="h-[280px] w-full min-w-0 sm:h-[340px]"
      aria-label="Kitten weight over time"
    >
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatAxisDate}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
        />
        <YAxis
          width={48}
          tickFormatter={(value: number) => `${value}g`}
          tickLine={false}
          axisLine={false}
          domain={[
            (minimum: number) => Math.max(0, Math.floor((minimum - 50) / 50) * 50),
            (maximum: number) => Math.ceil((maximum + 50) / 50) * 50,
          ]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const timestamp = payload?.[0]?.payload?.timestamp;
                return typeof timestamp === "number" ? formatTooltipDate(timestamp) : "";
              }}
              formatter={(value, name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                  <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                    {Number(value).toLocaleString()}g
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-2" />} />
        {kittens.map((kitten) => (
          <Line
            key={kitten.id}
            type="monotone"
            dataKey={kitten.id}
            stroke={`var(--color-${kitten.id})`}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }}
            connectNulls
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
