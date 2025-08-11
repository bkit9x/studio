
"use client";

import { TrendingUp } from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/formatters";

type ReportsChartProps = {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
};

export function ReportsChart({ data }: ReportsChartProps) {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name };
    return acc;
  }, {} as ChartConfig);

  return (
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-48"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
                hideLabel 
                formatter={(value, name) => (
                    <div className="flex flex-col">
                        <span className="font-bold">{name}</span>
                        <span>{formatCurrency(value as number)}</span>
                    </div>
                )}
             />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={5}
            activeIndex={0}
            activeShape={({ outerRadius = 0, ...props }) => (
              <g>
                <circle cx={props.cx} cy={props.cy} r={outerRadius} fill={props.fill} />
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={props.innerRadius}
                  fill={props.fill}
                  stroke={props.stroke}
                  strokeWidth={props.strokeWidth}
                  style={{
                    filter: `drop-shadow(0 0 5px ${props.fill})`,
                  }}
                />
              </g>
            )}
          >
             {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
  );
}

