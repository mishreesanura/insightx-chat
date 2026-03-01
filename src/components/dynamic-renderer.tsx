"use client"

import React from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { List } from "@/components/ui/list-item"
import { DatePicker } from "@/components/ui/date-picker"

/* ═══════════════════════════════════════════════════════
   Tick formatters for chart Y-axis
   ═══════════════════════════════════════════════════════ */
const TICK_FORMATTERS: Record<string, (v: number) => string> = {
  currency: (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`),
  percentage: (v) => `${v}%`,
  compact_number: (v) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
        ? `${(v / 1_000).toFixed(0)}k`
        : `${v}`,
  standard: (v) => `${v}`,
}

/* Default palette applied when the LLM doesn't provide colours */
const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

/* ═══════════════════════════════════════════════════════
   Build a ChartConfig from the LLM series array
   ═══════════════════════════════════════════════════════ */
function buildChartConfig(series: any[]): ChartConfig {
  const cfg: ChartConfig = {}
  series.forEach((s: any, i: number) => {
    cfg[s.dataKey] = {
      label: s.label ?? s.dataKey,
      color: s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }
  })
  return cfg
}

/* ═══════════════════════════════════════════════════════
   CHART RENDERER
   ═══════════════════════════════════════════════════════ */
function ChartRenderer({ component }: { component: any }) {
  const { config, data, chart_type, title, description, footer_text } =
    component
  const series: any[] = config?.series ?? []
  const chartConfig = buildChartConfig(series)
  const hasSecondaryYAxis = !!config?.secondary_yAxis
  const yTickFmt =
    TICK_FORMATTERS[config?.yAxis?.tickFormatter ?? "standard"] ??
    TICK_FORMATTERS.standard

  /* ── helper components ── */
  const SharedXAxis = (
    <XAxis
      dataKey={config?.xAxis?.dataKey}
      stroke="hsl(var(--muted-foreground))"
      fontSize={11}
      tickLine={false}
      axisLine={false}
    />
  )

  const SharedYAxisLeft = (
    <YAxis
      yAxisId="left"
      stroke="hsl(var(--muted-foreground))"
      fontSize={11}
      tickLine={false}
      axisLine={false}
      tickFormatter={yTickFmt}
    />
  )

  const SharedYAxisRight = hasSecondaryYAxis ? (
    <YAxis
      yAxisId="right"
      orientation="right"
      stroke="hsl(var(--muted-foreground))"
      fontSize={11}
      tickLine={false}
      axisLine={false}
      tickFormatter={
        TICK_FORMATTERS[
          config?.secondary_yAxis?.tickFormatter ?? "percentage"
        ] ?? TICK_FORMATTERS.standard
      }
    />
  ) : null

  const SharedGrid = (
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
  )

  /* ── render the right chart variant ── */
  const renderChart = () => {
    switch (chart_type) {
      /* ─── Pie ─── */
      case "pie": {
        const pieDataKey = series[0]?.dataKey ?? "value"
        const pieNameKey = config?.xAxis?.dataKey ?? "category"
        const pieData = data.map((d: any, i: number) => ({
          ...d,
          fill: d.fill || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        }))

        return (
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={pieData}
              dataKey={pieDataKey}
              nameKey={pieNameKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((entry: any, i: number) => (
                <Cell
                  key={i}
                  fill={entry.fill}
                />
              ))}
            </Pie>
            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        )
      }

      /* ─── Radar ─── */
      case "radar":
        return (
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={config?.xAxis?.dataKey ?? "category"} />
            <PolarRadiusAxis />
            {series.map((s: any, i: number) => (
              <Radar
                key={i}
                name={s.label}
                dataKey={s.dataKey}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
          </RadarChart>
        )

      /* ─── Radial ─── */
      case "radial": {
        const radialDataKey = series[0]?.dataKey ?? "value"
        const radialData = data.map((d: any, i: number) => ({
          ...d,
          fill: d.fill || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        }))

        return (
          <RadialBarChart
            data={radialData}
            innerRadius="30%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey={radialDataKey}
              background
              label={{ position: "insideStart", fill: "#fff" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
          </RadialBarChart>
        )
      }

      /* ─── Composed (bar + line + area mix) ─── */
      case "composed":
        return (
          <ComposedChart data={data}>
            {SharedGrid}
            {SharedXAxis}
            {SharedYAxisLeft}
            {SharedYAxisRight}
            <ChartTooltip content={<ChartTooltipContent />} />
            {config?.legend !== false && (
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
            )}
            {series.map((s: any, i: number) => {
              const color =
                s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
              if (s.type === "bar")
                return (
                  <Bar
                    key={i}
                    yAxisId={s.yAxisId ?? "left"}
                    dataKey={s.dataKey}
                    name={s.label}
                    fill={color}
                    radius={[4, 4, 0, 0]}
                    opacity={0.9}
                  />
                )
              if (s.type === "area")
                return (
                  <Area
                    key={i}
                    yAxisId={s.yAxisId ?? "left"}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.label}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.1}
                  />
                )
              /* default → line */
              return (
                <Line
                  key={i}
                  yAxisId={s.yAxisId ?? "left"}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: color }}
                  activeDot={{ r: 6 }}
                />
              )
            })}
          </ComposedChart>
        )

      /* ─── Area ─── */
      case "area":
        return (
          <AreaChart data={data}>
            {SharedGrid}
            {SharedXAxis}
            {SharedYAxisLeft}
            <ChartTooltip content={<ChartTooltipContent />} />
            {config?.legend !== false && (
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
            )}
            {series.map((s: any, i: number) => {
              const color =
                s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
              return (
                <Area
                  key={i}
                  yAxisId={s.yAxisId ?? "left"}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.label}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.15}
                />
              )
            })}
          </AreaChart>
        )

      /* ─── Line ─── */
      case "line":
        return (
          <LineChart data={data}>
            {SharedGrid}
            {SharedXAxis}
            {SharedYAxisLeft}
            <ChartTooltip content={<ChartTooltipContent />} />
            {config?.legend !== false && (
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
            )}
            {series.map((s: any, i: number) => (
              <Line
                key={i}
                yAxisId={s.yAxisId ?? "left"}
                type="monotone"
                dataKey={s.dataKey}
                name={s.label}
                stroke={
                  s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
                }
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        )

      /* ─── Bar (default) ─── */
      case "bar":
      default:
        return (
          <BarChart data={data}>
            {SharedGrid}
            {SharedXAxis}
            {SharedYAxisLeft}
            <ChartTooltip content={<ChartTooltipContent />} />
            {config?.legend !== false && (
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
            )}
            {series.map((s: any, i: number) => (
              <Bar
                key={i}
                yAxisId={s.yAxisId ?? "left"}
                dataKey={s.dataKey}
                name={s.label}
                fill={
                  s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
                }
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )
    }
  }

  return (
    <Card className="mt-4 border-border/50 bg-card/30 backdrop-blur-sm">
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-sm">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-xs">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          {renderChart()}
        </ChartContainer>
      </CardContent>
      {footer_text && (
        <CardFooter className="text-xs text-muted-foreground italic">
          {footer_text}
        </CardFooter>
      )}
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   TABLE RENDERER
   ═══════════════════════════════════════════════════════ */
function TableRenderer({ component }: { component: any }) {
  const badgeVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    default: "default",
    secondary: "secondary",
    destructive: "destructive",
    success: "default",        // map "success" → default (green handled via className)
    outline: "outline",
  }

  const renderCell = (col: any, row: any) => {
    const val = row[col.key]
    if (col.format === "currency" && val != null) {
      return (
        <span className="font-mono">
          ₹{Number(val).toLocaleString("en-IN")}
        </span>
      )
    }
    if (col.format === "badge" && val && typeof val === "object") {
      return (
        <Badge
          variant={badgeVariantMap[val.variant] ?? "default"}
          className={
            val.variant === "success"
              ? "bg-emerald-600 text-white border-transparent"
              : undefined
          }
        >
          {val.label}
        </Badge>
      )
    }
    return (
      <span className="font-mono text-muted-foreground">{val ?? ""}</span>
    )
  }

  return (
    <Card className="mt-4 border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
      {(component.title || component.description) && (
        <CardHeader className="pb-2">
          {component.title && (
            <CardTitle className="text-sm">{component.title}</CardTitle>
          )}
          {component.description && (
            <CardDescription className="text-xs">
              {component.description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {component.columns.map((col: any) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {component.rows.map((row: any, i: number) => (
              <TableRow key={i} className="hover:bg-muted/20">
                {component.columns.map((col: any) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left",
                    )}
                  >
                    {renderCell(col, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {component.summary_row && (
            <TableFooter>
              <TableRow className="bg-muted/20 font-semibold">
                {component.columns.map((col: any) => (
                  <TableCell key={col.key}>
                    {renderCell(col, component.summary_row)}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   CARD CAROUSEL RENDERER
   ═══════════════════════════════════════════════════════ */
function CardCarouselRenderer({ cards }: { cards: any[] }) {
  const trendIcon = (dir: string, value: string) => {
    if (dir === "up") {
      const isPositive = value?.startsWith("+")
      return (
        <ArrowUpRight
          size={14}
          className={isPositive ? "text-emerald-500" : "text-red-500"}
        />
      )
    }
    if (dir === "down") {
      return <ArrowDownRight size={14} className="text-emerald-500" />
    }
    return <Minus size={14} className="text-muted-foreground" />
  }

  return (
    <div className="mt-4">
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {cards.map((card: any, i: number) => (
            <CarouselItem
              key={card.id ?? i}
              className="pl-3 basis-[260px] md:basis-[280px]"
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {card.description}
                      </CardDescription>
                    </div>
                    {card.badges?.map((b: any, j: number) => (
                      <Badge
                        key={j}
                        variant={
                          b.variant === "success" ? "default" : b.variant
                        }
                        className={cn(
                          "ml-2 shrink-0",
                          b.variant === "success" &&
                            "bg-emerald-600 text-white border-transparent",
                        )}
                      >
                        {b.label}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
                    {card.content}
                  </div>
                  {card.trend && (
                    <div className="flex items-center gap-1">
                      {trendIcon(card.trend.direction, card.trend.value)}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          card.trend.direction === "up" &&
                            card.trend.value?.startsWith("+")
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
                </CardContent>
                {card.footer && (
                  <CardFooter className="text-xs text-muted-foreground pt-0">
                    {card.footer}
                  </CardFooter>
                )}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 h-8 w-8" />
        <CarouselNext className="-right-4 h-8 w-8" />
      </Carousel>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SELECT RENDERER
   ═══════════════════════════════════════════════════════ */
function SelectRenderer({
  component,
  onSelect,
}: {
  component: any
  onSelect?: (parameterName: string, value: string) => void
}) {
  return (
    <div className="mt-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
      <p className="text-sm text-foreground mb-3">{component.prompt_text}</p>
      <Select
        onValueChange={(val) =>
          onSelect?.(component.parameter_name, val)
        }
      >
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue
            placeholder={component.placeholder ?? "Select an option..."}
          />
        </SelectTrigger>
        <SelectContent>
          {component.options?.map((opt: any) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC COMPONENT RENDERER  –  Root Entry Point
   Maps the LLM JSON component objects → shadcn components
   ═══════════════════════════════════════════════════════ */
export interface DynamicRendererProps {
  component: any
  /** Callback when user interacts with Select / DatePicker */
  onInteraction?: (parameterName: string, value: string) => void
}

export function DynamicComponentRenderer({
  component,
  onInteraction,
}: DynamicRendererProps) {
  switch (component.type) {
    case "card_carousel":
      return <CardCarouselRenderer cards={component.cards} />
    case "chart":
      return <ChartRenderer component={component} />
    case "table":
      return <TableRenderer component={component} />
    case "list":
      return <List title={component.title} items={component.items} />
    case "select":
      return (
        <SelectRenderer component={component} onSelect={onInteraction} />
      )
    case "date_picker":
      return (
        <DatePicker
          prompt_text={component.prompt_text}
          parameter_name={component.parameter_name}
          mode={component.mode}
          onSelect={onInteraction}
        />
      )
    case "separator":
      return (
        <div className="my-6">
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )
    default:
      return null
  }
}
