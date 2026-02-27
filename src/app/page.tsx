"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  ArrowUp,
  Sparkles,
  Star,
  Settings,
  MessageSquare,
  Archive,
  Moon,
  Sun,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

/* ───────────────────────────────────────────────
   Utility
   ─────────────────────────────────────────────── */
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ───────────────────────────────────────────────
   Inline shadcn-style Components
   ─────────────────────────────────────────────── */

// Badge
function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  className?: string;
}) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";
  const variants: Record<string, string> = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-red-600 text-white",
    outline: "text-foreground",
    success: "border-transparent bg-emerald-600 text-white",
  };
  return (
    <span
      className={cn(base, variants[variant] || variants.default, className)}
    >
      {children}
    </span>
  );
}

// Skeleton
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/* ───────────────────────────────────────────────
   Mock Data
   ─────────────────────────────────────────────── */

const MOCK_RESPONSE = {
  role: "assistant" as const,
  narrative:
    "Based on the transaction dataset, Bill Payments show the highest failure rate at 8.2%. Here is the detailed breakdown.",
  components: [
    {
      type: "card_carousel",
      cards: [
        {
          id: "card_1",
          title: "Maharashtra",
          description: "Highest P2M Volume",
          content: "₹4.2M",
          trend: { value: "+12%", direction: "up" },
          footer: "Compared to yesterday",
          badges: [{ label: "Top Performer", variant: "default" }],
        },
        {
          id: "card_2",
          title: "Karnataka",
          description: "Fastest Growth",
          content: "₹2.8M",
          trend: { value: "+28%", direction: "up" },
          footer: "Week over week",
          badges: [{ label: "Trending", variant: "success" }],
        },
        {
          id: "card_3",
          title: "Tamil Nadu",
          description: "High Failure Rate",
          content: "8.2%",
          trend: { value: "+3.1%", direction: "up" },
          footer: "Above threshold",
          badges: [{ label: "Alert", variant: "destructive" }],
        },
        {
          id: "card_4",
          title: "Delhi NCR",
          description: "Lowest Latency",
          content: "120ms",
          trend: { value: "-15%", direction: "down" },
          footer: "Improved from 140ms",
          badges: [{ label: "Stable", variant: "secondary" }],
        },
      ],
    },
    {
      type: "chart",
      chart_type: "composed",
      title: "Transaction Volume vs Failure Rate",
      description: "Hourly breakdown for current date",
      footer_text: "Peak failure rate observed at 14:00.",
      data: [
        { category: "10:00", volume: 120000, rate: 1.8 },
        { category: "11:00", volume: 135000, rate: 2.0 },
        { category: "12:00", volume: 150000, rate: 2.1 },
        { category: "13:00", volume: 185000, rate: 3.5 },
        { category: "14:00", volume: 210000, rate: 5.2 },
        { category: "15:00", volume: 178000, rate: 4.1 },
        { category: "16:00", volume: 165000, rate: 3.0 },
      ],
      config: {
        xAxis: { dataKey: "category", label: "Time of Day" },
        yAxis: { label: "Volume (INR)" },
        secondary_yAxis: {
          label: "Failure Rate (%)",
          orientation: "right",
        },
        tooltip: true,
        legend: true,
        series: [
          {
            dataKey: "volume",
            label: "Total Volume (INR)",
            type: "bar",
            color: "#3b82f6",
            yAxisId: "left",
          },
          {
            dataKey: "rate",
            label: "Failure Rate (%)",
            type: "line",
            color: "#ef4444",
            yAxisId: "right",
          },
        ],
      },
    },
    {
      type: "table",
      title: "Anomalous Transactions Flagged for Review",
      description: "High-value transfers on 3G networks.",
      columns: [
        { key: "tx_id", header: "Transaction ID", format: "text" },
        { key: "amount", header: "Amount", format: "currency" },
        { key: "status", header: "Status", format: "badge" },
      ],
      rows: [
        {
          tx_id: "TXN-99482",
          amount: 150000,
          status: { label: "Flagged", variant: "destructive" },
        },
        {
          tx_id: "TXN-99501",
          amount: 87000,
          status: { label: "Review", variant: "destructive" },
        },
        {
          tx_id: "TXN-99523",
          amount: 220000,
          status: { label: "Cleared", variant: "success" },
        },
      ],
      summary_row: {
        tx_id: "Total Flagged",
        amount: 457000,
        status: null,
      },
    },
    { type: "separator" },
    {
      type: "list",
      title: "Recent Failed Transactions",
      items: [
        {
          id: "item_1",
          leading_slot: { type: "text", value: "TXN-001" },
          default_slot: "Payment to Amazon Web Services",
          secondary_slot: "B2B Transaction • Server Costs",
          tertiary_slot: "HDFC Credit Card",
          metadata_slot: "Today, 10:45 AM",
          trailing_slot: {
            is_badge: true,
            text: "Failed",
            variant: "destructive",
          },
        },
        {
          id: "item_2",
          leading_slot: { type: "icon", value: "AlertCircle" },
          default_slot: "UPI Transfer to Vendor",
          secondary_slot: "P2M Transaction • Office Supplies",
          tertiary_slot: "SBI Debit Card",
          metadata_slot: "Today, 11:20 AM",
          trailing_slot: {
            is_badge: true,
            text: "Timeout",
            variant: "destructive",
          },
        },
      ],
    },
    { type: "separator" },
    {
      type: "select",
      prompt_text: "Would you like to filter this analysis by device type?",
      parameter_name: "device_type",
      placeholder: "Select Device Type",
      options: [
        { label: "All Devices", value: "ALL" },
        { label: "Android", value: "Android" },
        { label: "iOS", value: "iOS" },
        { label: "Web", value: "Web" },
      ],
    },
  ],
  suggested_follow_ups: [
    "Why are Bill Payments failing?",
    "Show me the failure rate by network type.",
    "Compare Android vs iOS failure rates.",
  ],
};

const ARCHIVE_ITEMS = [
  {
    id: 1,
    title: "Transaction Volume Analysis - Q4 2025",
    date: "Yesterday, 2:30 PM",
    messages: 12,
    starred: false,
  },
  {
    id: 2,
    title: "Failure Rate Deep Dive - Maharashtra",
    date: "Feb 25, 4:15 PM",
    messages: 8,
    starred: true,
  },
  {
    id: 3,
    title: "Network Latency Investigation",
    date: "Feb 24, 11:00 AM",
    messages: 15,
    starred: false,
  },
  {
    id: 4,
    title: "P2M vs Bill Payment Comparison",
    date: "Feb 23, 9:45 AM",
    messages: 6,
    starred: true,
  },
  {
    id: 5,
    title: "Risk Assessment - High Value Transfers",
    date: "Feb 22, 3:20 PM",
    messages: 20,
    starred: false,
  },
];

/* ───────────────────────────────────────────────
   TypeScript Interfaces
   ─────────────────────────────────────────────── */
interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  narrative?: string;
  components?: any[];
  suggested_follow_ups?: string[];
}

/* ───────────────────────────────────────────────
   Dynamic Component Renderer
   ─────────────────────────────────────────────── */
function DynamicComponentRenderer({ component }: { component: any }) {
  switch (component.type) {
    case "card_carousel":
      return <CardCarouselRenderer cards={component.cards} />;
    case "chart":
      return <ChartRenderer component={component} />;
    case "table":
      return <TableRenderer component={component} />;
    case "list":
      return <ListRenderer component={component} />;
    case "select":
      return <SelectRenderer component={component} />;
    case "separator":
      return (
        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      );
    default:
      return null;
  }
}

/* Card Carousel */
function CardCarouselRenderer({ cards }: { cards: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollLeft = () =>
    scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () =>
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });

  return (
    <div className="mt-4 relative group">
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg -ml-4"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg -mr-4"
      >
        <ChevronRight size={16} />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
      >
        {cards.map((card: any, i: number) => (
          <div
            key={card.id || i}
            className="snap-start shrink-0 w-[260px] rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:bg-card/80 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {card.description}
                </p>
              </div>
              {card.badges?.map((b: any, j: number) => (
                <Badge key={j} variant={b.variant} className="ml-2 shrink-0">
                  {b.label}
                </Badge>
              ))}
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {card.content}
            </div>
            {card.trend && (
              <div className="flex items-center gap-1 mb-2">
                {card.trend.direction === "up" ? (
                  <ArrowUpRight
                    size={14}
                    className={
                      card.trend.value.startsWith("+")
                        ? "text-emerald-500"
                        : "text-red-500"
                    }
                  />
                ) : (
                  <ArrowDownRight size={14} className="text-emerald-500" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    card.trend.direction === "up" &&
                      card.trend.value.startsWith("+")
                      ? "text-emerald-500"
                      : card.trend.direction === "down"
                        ? "text-emerald-500"
                        : "text-red-500",
                  )}
                >
                  {card.trend.value}
                </span>
              </div>
            )}
            {card.footer && (
              <p className="text-xs text-muted-foreground">{card.footer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Chart */
function ChartRenderer({ component }: { component: any }) {
  const { config, data, chart_type, title, description, footer_text } =
    component;
  const hasSecondaryYAxis = !!config.secondary_yAxis;

  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5 overflow-hidden">
      {title && (
        <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
      )}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart_type === "composed" || hasSecondaryYAxis ? (
            <ComposedChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey={config.xAxis.dataKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) =>
                  val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `${val}`
                }
              />
              {hasSecondaryYAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `${val}%`}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              {config.legend && (
                <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              )}
              {config.series.map((s: any, i: number) =>
                s.type === "bar" ? (
                  <Bar
                    key={i}
                    yAxisId={s.yAxisId || "left"}
                    dataKey={s.dataKey}
                    name={s.label}
                    fill={s.color}
                    radius={[4, 4, 0, 0]}
                    opacity={0.9}
                  />
                ) : s.type === "line" ? (
                  <Line
                    key={i}
                    yAxisId={s.yAxisId || "left"}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: s.color }}
                    activeDot={{ r: 6 }}
                  />
                ) : s.type === "area" ? (
                  <Area
                    key={i}
                    yAxisId={s.yAxisId || "left"}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.label}
                    stroke={s.color}
                    fill={s.color}
                    fillOpacity={0.1}
                  />
                ) : null,
              )}
            </ComposedChart>
          ) : chart_type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey={config.xAxis.dataKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) =>
                  val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `${val}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              {config.series.map((s: any, i: number) => (
                <Bar
                  key={i}
                  yAxisId={s.yAxisId || "left"}
                  dataKey={s.dataKey}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey={config.xAxis.dataKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              {config.series.map((s: any, i: number) => (
                <Line
                  key={i}
                  yAxisId={s.yAxisId || "left"}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {footer_text && (
        <p className="text-xs text-muted-foreground mt-3 italic">
          {footer_text}
        </p>
      )}
    </div>
  );
}

/* Table */
function TableRenderer({ component }: { component: any }) {
  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
      {component.title && (
        <div className="px-5 pt-4 pb-2">
          <h4 className="text-sm font-semibold text-foreground">
            {component.title}
          </h4>
          {component.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {component.description}
            </p>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {component.columns.map((col: any) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {component.rows.map((row: any, i: number) => (
              <tr
                key={i}
                className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
              >
                {component.columns.map((col: any) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-5 py-3.5",
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left",
                    )}
                  >
                    {col.format === "currency" ? (
                      <span className="font-mono">
                        ₹{row[col.key]?.toLocaleString("en-IN")}
                      </span>
                    ) : col.format === "badge" && row[col.key] ? (
                      <Badge variant={row[col.key].variant}>
                        {row[col.key].label}
                      </Badge>
                    ) : (
                      <span className="font-mono text-muted-foreground">
                        {row[col.key]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {component.summary_row && (
              <tr className="bg-muted/20 font-semibold">
                {component.columns.map((col: any) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-5 py-3.5",
                      col.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {col.format === "currency" &&
                    component.summary_row[col.key] ? (
                      <span className="font-mono">
                        ₹
                        {component.summary_row[col.key]?.toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    ) : col.format === "badge" &&
                      component.summary_row[col.key] ? (
                      <Badge variant={component.summary_row[col.key].variant}>
                        {component.summary_row[col.key].label}
                      </Badge>
                    ) : (
                      component.summary_row[col.key] || ""
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* List */
function ListRenderer({ component }: { component: any }) {
  return (
    <div className="mt-4">
      {component.title && (
        <h4 className="text-sm font-semibold text-foreground mb-3">
          {component.title}
        </h4>
      )}
      <div className="space-y-2">
        {component.items.map((item: any, i: number) => (
          <div
            key={item.id || i}
            className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.leading_slot && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                  {item.leading_slot.type === "icon" ? (
                    <AlertCircle size={16} />
                  ) : (
                    <span className="text-[10px] font-bold tracking-tight">
                      {item.leading_slot.value}
                    </span>
                  )}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm text-foreground truncate">
                  {item.default_slot}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.secondary_slot}
                </div>
                {item.tertiary_slot && (
                  <div className="text-xs text-muted-foreground/60 truncate">
                    {item.tertiary_slot}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
              {item.metadata_slot && (
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {item.metadata_slot}
                </span>
              )}
              {item.trailing_slot?.is_badge && (
                <Badge variant={item.trailing_slot.variant}>
                  {item.trailing_slot.text}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Select */
function SelectRenderer({ component }: { component: any }) {
  return (
    <div className="mt-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
      <p className="text-sm text-foreground mb-3">{component.prompt_text}</p>
      <select className="flex h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 appearance-none cursor-pointer">
        <option value="" disabled selected>
          {component.placeholder}
        </option>
        {component.options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Message Bubble
   ─────────────────────────────────────────────── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-4xl animate-fade-in-up",
        isUser ? "ml-auto flex-row-reverse" : "",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-1",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-blue-600 to-violet-600 text-white",
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[calc(100%-48px)]",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* User text or AI narrative */}
        {message.content && (
          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-md"
                : "bg-muted rounded-tl-md",
            )}
          >
            {message.content}
          </div>
        )}
        {message.narrative && (
          <div className="px-4 py-2.5 rounded-2xl bg-muted/50 rounded-tl-md text-[14px] leading-relaxed text-foreground/90">
            {message.narrative}
          </div>
        )}

        {/* Dynamic Components */}
        {message.components && (
          <div className="w-full mt-1">
            {message.components.map((comp: any, idx: number) => (
              <DynamicComponentRenderer key={idx} component={comp} />
            ))}
          </div>
        )}

        {/* Suggested Follow-ups */}
        {message.suggested_follow_ups &&
          message.suggested_follow_ups.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.suggested_follow_ups.map((q: string, i: number) => (
                <button
                  key={i}
                  className="px-3 py-1.5 text-xs rounded-full border border-border/50 bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/60 hover:border-primary/30 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Loading Skeleton for view switching
   ─────────────────────────────────────────────── */
function ViewSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-4 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="space-y-3 mt-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   MAIN APP
   ─────────────────────────────────────────────── */
export default function InsightXApp() {
  const [activeView, setActiveView] = useState<"chat" | "archive" | "settings">(
    "chat",
  );
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [archiveItems, setArchiveItems] = useState(ARCHIVE_ITEMS);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // View switch with skeleton
  const switchView = (view: "chat" | "archive" | "settings") => {
    if (view === activeView) return;
    setIsViewTransitioning(true);
    setTimeout(() => {
      setActiveView(view);
      setIsViewTransitioning(false);
    }, 300);
  };

  // Send message
  const handleSend = (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [...prev, MOCK_RESPONSE as ChatMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Toggle favorite in archive
  const toggleFavorite = (id: number) => {
    setArchiveItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item,
      ),
    );
  };

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ─── Top Navigation ─── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between px-4 md:px-6 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">InsightX</span>
        </div>

        {/* Pill Tabs */}
        <div className="flex items-center rounded-full bg-muted/40 p-1 border border-border/50">
          {(
            [
              { key: "chat", label: "Chat", icon: MessageSquare },
              { key: "archive", label: "Archive", icon: Archive },
              { key: "settings", label: "Settings", icon: Settings },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchView(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                activeView === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Upgrade Button */}
        <button className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all duration-200">
          <Sparkles size={14} />
          <span className="hidden sm:inline">Upgrade</span>
        </button>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {isViewTransitioning ? (
          <ViewSkeleton />
        ) : (
          <>
            {/* ═══ CHAT VIEW ═══ */}
            {activeView === "chat" && (
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-36 pt-6">
                <div className="max-w-3xl mx-auto w-full">
                  {messages.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center pt-16 md:pt-24 animate-fade-in-up">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 flex items-center justify-center mb-8 animate-pulse-glow">
                        <Sparkles className="h-8 w-8 text-blue-500" />
                      </div>
                      <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-center">
                        {getGreeting()}!
                      </h1>
                      <p className="text-lg text-muted-foreground mb-10 text-center">
                        I am ready to help you analyze your data.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                        {[
                          {
                            title: "Descriptive",
                            desc: "What happened in the last 24 hours?",
                            icon: BarChart3,
                            color: "from-blue-500/10 to-blue-600/5",
                          },
                          {
                            title: "Comparative",
                            desc: "Compare P2M vs Bill Payments",
                            icon: TrendingUp,
                            color: "from-emerald-500/10 to-emerald-600/5",
                          },
                          {
                            title: "Temporal",
                            desc: "Show me the hourly trend",
                            icon: Clock,
                            color: "from-amber-500/10 to-amber-600/5",
                          },
                          {
                            title: "Risk Analysis",
                            desc: "Identify anomalous transactions",
                            icon: ShieldAlert,
                            color: "from-red-500/10 to-red-600/5",
                          },
                        ].map((card, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(card.desc)}
                            className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 hover:border-primary/30 transition-all duration-200 text-left group"
                          >
                            <div
                              className={cn(
                                "h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                card.color,
                              )}
                            >
                              <card.icon
                                size={18}
                                className="text-foreground/70 group-hover:text-foreground transition-colors"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {card.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {card.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Message Thread */
                    <div className="space-y-6">
                      {messages.map((msg, idx) => (
                        <MessageBubble key={idx} message={msg} />
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 animate-fade-in-up">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white text-xs font-bold">
                            AI
                          </div>
                          <div className="flex gap-1 items-center px-4 py-3 bg-muted/50 rounded-2xl rounded-tl-md">
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ ARCHIVE VIEW ═══ */}
            {activeView === "archive" && (
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6">
                <div className="max-w-3xl mx-auto w-full animate-fade-in-up">
                  <h2 className="text-2xl font-bold mb-1">Chat Archive</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your previous analysis sessions
                  </p>
                  <div className="space-y-2">
                    {archiveItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.date} · {item.messages} messages
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            item.starred
                              ? "text-yellow-500"
                              : "text-muted-foreground/30 hover:text-yellow-500/70",
                          )}
                        >
                          <Star
                            size={18}
                            fill={item.starred ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SETTINGS VIEW ═══ */}
            {activeView === "settings" && (
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6">
                <div className="max-w-3xl mx-auto w-full animate-fade-in-up">
                  <h2 className="text-2xl font-bold mb-1">Settings</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage your preferences
                  </p>

                  {/* Appearance Card */}
                  <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                      <h3 className="font-semibold text-foreground">
                        Appearance
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Customize how InsightX looks on your device.
                      </p>
                    </div>
                    <div className="px-5 pb-5 space-y-4">
                      {/* Dark Mode Toggle */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {isDarkMode ? (
                            <Moon size={18} className="text-muted-foreground" />
                          ) : (
                            <Sun size={18} className="text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Dark Mode</p>
                            <p className="text-xs text-muted-foreground">
                              Toggle dark mode on or off
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsDarkMode(!isDarkMode)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                            isDarkMode ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200",
                              isDarkMode ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <div className="h-px bg-border/50" />

                      {/* Compact Mode */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">Compact Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Reduce spacing in chat messages
                          </p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-muted transition-colors duration-200">
                          <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200 translate-x-0" />
                        </button>
                      </div>

                      <div className="h-px bg-border/50" />

                      {/* Auto-scroll */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">Auto-scroll</p>
                          <p className="text-xs text-muted-foreground">
                            Scroll to bottom on new messages
                          </p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors duration-200">
                          <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200 translate-x-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Data Card */}
                  <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden mt-4">
                    <div className="px-5 pt-5 pb-3">
                      <h3 className="font-semibold text-foreground">
                        Data & Privacy
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your data preferences
                      </p>
                    </div>
                    <div className="px-5 pb-5 space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">
                            Save Chat History
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Keep your conversations for future reference
                          </p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-primary transition-colors duration-200">
                          <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200 translate-x-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── Input Area (Chat only) ─── */}
        {activeView === "chat" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
            <div className="relative max-w-3xl mx-auto">
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 pl-3 shadow-2xl shadow-black/10 focus-within:border-primary/30 transition-all duration-300">
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 shrink-0">
                  <Mic size={18} />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question about your transaction data..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground/60 min-w-0"
                />
                <div className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-md bg-muted/50 text-[10px] text-muted-foreground font-medium shrink-0">
                  <span>Press</span>
                  <kbd className="ml-0.5 font-mono">↵</kbd>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200 shrink-0",
                    inputValue.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                InsightX may produce inaccurate information. Verify important
                data independently.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
