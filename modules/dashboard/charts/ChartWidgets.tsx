"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  CartesianGrid,
} from "recharts";

export type ChartType = "PIE" | "DONUT" | "BAR" | "LINE" | "AREA" | "RADAR";

export interface ChartWidgetProps {
  data: Array<{
    name?: string;
    label?: string;
    value?: number;
    total?: number;
    concluidos?: number;
    emAtendimento?: number;
    color?: string;
    percentage?: number;
    [key: string]: any;
  }>;
  type: ChartType;
  height?: number;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  unit?: string;
  isTimeSeries?: boolean;
}

const DEFAULT_COLORS = [
  "#3b82f6", // 1. Blue
  "#8b5cf6", // 2. Violet
  "#10b981", // 3. Emerald
  "#f59e0b", // 4. Amber
  "#f43f5e", // 5. Rose
  "#06b6d4", // 6. Cyan
  "#6366f1", // 7. Indigo
  "#14b8a6", // 8. Teal
  "#ec4899", // 9. Pink
];

// Custom Tooltip estilizada
const CustomTooltip = ({ active, payload, label, unit = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border rounded-lg p-2.5 shadow-xl text-xs">
        <p className="font-semibold text-foreground mb-1">
          {label || payload[0]?.name || payload[0]?.payload?.label || "Detalhe"}
        </p>
        <div className="space-y-1">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: item.color || item.payload?.fill || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                />
                {item.name || item.dataKey}:
              </span>
              <span className="font-bold text-foreground font-mono">
                {item.value} {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ChartWidget({
  data,
  type,
  height = 260,
  dataKey = "value",
  nameKey = "name",
  colors = DEFAULT_COLORS,
  unit = "",
  isTimeSeries = false,
}: ChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg p-4"
      >
        <span>Sem dados suficientes no período selecionado.</span>
      </div>
    );
  }

  // Mapear dados com cores garantidas
  const formattedData = data.map((d, idx) => ({
    ...d,
    displayLabel: d.label || d[nameKey] || d.name || `Item ${idx + 1}`,
    displayValue: d[dataKey] ?? d.value ?? d.total ?? 0,
    fillColor: d.color || colors[idx % colors.length],
  }));

  switch (type) {
    case "PIE":
    case "DONUT": {
      const innerRadius = type === "DONUT" ? "48%" : 0;
      const isSingleCategory = formattedData.length === 1;
      
      // Custom label renderer — only show for items > 5% and when multiple categories
      const renderLabel = isSingleCategory
        ? false
        : ({ percent, displayLabel }: any) => {
            if (!percent || percent < 0.05) return "";
            return `${(percent * 100).toFixed(0)}%`;
          };

      return (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value: string) => <span className="text-foreground">{value}</span>}
              />
              <Pie
                data={formattedData}
                dataKey="displayValue"
                nameKey="displayLabel"
                cx="50%"
                cy="45%"
                outerRadius="70%"
                innerRadius={innerRadius}
                paddingAngle={formattedData.length > 1 ? 2 : 0}
                label={renderLabel}
                labelLine={!isSingleCategory && formattedData.length <= 8}
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fillColor}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "BAR": {
      const hasLongLabels = formattedData.length > 5;
      return (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -15, bottom: hasLongLabels ? 40 : 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="displayLabel"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                angle={hasLongLabels ? -45 : 0}
                textAnchor={hasLongLabels ? "end" : "middle"}
                height={hasLongLabels ? 70 : 30}
                tickFormatter={(value: string) => value.length > 12 ? value.slice(0, 12) + "..." : value}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {isTimeSeries ? (
                <>
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                  />
                  <Bar
                    dataKey="total"
                    name="Total de Chamados"
                    fill={colors[0]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="concluidos"
                    name="Resolvidos"
                    fill={colors[1]}
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <Bar
                  dataKey="displayValue"
                  name="Volume"
                  radius={[4, 4, 0, 0]}
                >
                  {formattedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fillColor} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "LINE": {
      return (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 15, left: -15, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="displayLabel"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {isTimeSeries ? (
                <>
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke={colors[0]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="concluidos"
                    name="Resolvidos"
                    stroke={colors[1]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="displayValue"
                  name="Valor"
                  stroke={colors[0]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: colors[0] }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "AREA": {
      return (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 15, left: -15, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[1]} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={colors[1]} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="displayLabel"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {isTimeSeries ? (
                <>
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: "11px" }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke={colors[0]}
                    fillOpacity={1}
                    fill="url(#colorPrimary)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="concluidos"
                    name="Resolvidos"
                    stroke={colors[1]}
                    fillOpacity={1}
                    fill="url(#colorSecondary)"
                    strokeWidth={2}
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="displayValue"
                  name="Volume"
                  stroke={colors[0]}
                  fillOpacity={1}
                  fill="url(#colorPrimary)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "RADAR": {
      // Limit radar to 8 items and truncate names
      const radarData = formattedData.slice(0, 8).map((d) => ({
        ...d,
        displayLabel: d.displayLabel.length > 12 ? d.displayLabel.slice(0, 12) + "..." : d.displayLabel,
      }));
      return (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
              <PolarGrid stroke="var(--border)" opacity={0.6} />
              <PolarAngleAxis
                dataKey="displayLabel"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, "auto"]}
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Radar
                name="Volume / Indicador"
                dataKey="displayValue"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    default:
      return null;
  }
}
