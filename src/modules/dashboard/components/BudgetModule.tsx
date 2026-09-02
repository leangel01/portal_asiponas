import { useEffect, useState } from "react";
import {
  Button,
  Col,
  Progress,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Budget, BudgetItem } from "./types";
import { EmptyState, RowActions, money, moneyMillions } from "./shared";

const { Text } = Typography;
const budgetSeries = [
  { dataKey: "assigned_total", label: "Aprobado", color: "#1677ff" },
  { dataKey: "modified_total", label: "Modificado", color: "#52c41a" },
  { dataKey: "spent_total", label: "Ejercido", color: "#f5222d" },
] as const;
const formatMillions = (value: number) =>
  `${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((value || 0) / 1_000_000)} M`;
const formatAxisMillions = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((value || 0) / 1_000_000);

export const BudgetModule: React.FC<{
  budget?: Budget;
  budgets: Budget[];
  items: BudgetItem[];
  canEdit?: boolean;
  canDelete?: boolean;
  onAdd?: () => void;
  onEdit?: (item: BudgetItem) => void;
  onDelete?: (id: string) => void;
}> = ({
  budget,
  budgets,
  items,
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const execution = Math.round(
    ((budget?.spent_total || 0) / Math.max(budget?.modified_total || 1, 1)) *
      100,
  );
  const [animatedExecution, setAnimatedExecution] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedExecution(execution));
    return () => cancelAnimationFrame(frame);
  }, [execution]);
  if (!budget) return <EmptyState label="presupuesto" />;
  const latestBudget = budgets.reduce(
    (latest, item) => (item.fiscal_year > latest.fiscal_year ? item : latest),
    budget,
  );
  return (
    <>
      <div className="budget-progress-heading">
        <Text strong>Avance gasto {latestBudget.fiscal_year}</Text>
      </div>
      <Row gutter={16}>
        {[
          ["Aprobado", budget.assigned_total],
          ["Modificado", budget.modified_total],
          ["Ejercido", budget.spent_total],
          ["Disponibilidad", budget.modified_total - budget.spent_total],
        ].map(([title, value]) => (
          <Col xs={24} sm={12} lg={6} key={String(title)}>
            <AnimatedMoneyStatistic
              title={String(title)}
              value={Number(value)}
            />
          </Col>
        ))}
      </Row>
      <div className="budget-progress-value">{animatedExecution}%</div>
      <Progress
        percent={animatedExecution}
        status={animatedExecution >= 100 ? "success" : "active"}
        strokeColor="#9b2247"
        className="budget-progress"
        showInfo={false}
      />
      <BudgetHistory budgets={budgets} />
      <div className="budget-items-heading">
        <Text strong>Conceptos de presupuesto</Text>
        {onAdd && (
          <Button type="primary" size="small" onClick={onAdd}>
            Agregar concepto
          </Button>
        )}
      </div>
      <Table
        rowKey="id"
        dataSource={items}
        pagination={false}
        columns={[
          { title: "Concepto", dataIndex: "concept" },
          {
            title: "Tipo",
            dataIndex: "type",
            render: (value) => <Tag>{value}</Tag>,
          },
          {
            title: "Asignado",
            dataIndex: "allocated",
            render: (value) => money(value),
          },
          {
            title: "Ejecutado",
            dataIndex: "spent",
            render: (value) => money(value),
          },
          {
            title: "Acciones",
            render: (_: unknown, item: BudgetItem) => (
              <RowActions
                item={item}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
};

const AnimatedMoneyStatistic: React.FC<{ title: string; value: number }> = ({
  title,
  value,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setAnimatedValue(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <Statistic
      title={title}
      value={animatedValue}
      formatter={() => moneyMillions(animatedValue)}
    />
  );
};

const BudgetHistory: React.FC<{ budgets: Budget[] }> = ({ budgets }) => {
  const history = [...budgets].sort(
    (left, right) => left.fiscal_year - right.fiscal_year,
  );
  if (!history.length) return null;
  return (
    <section className="budget-history" aria-label="Histórico del presupuesto">
      <div className="budget-history-heading">
        <div>
          <Text strong>Histórico presupuestal</Text>
          <Text type="secondary">Millones de pesos</Text>
        </div>
      </div>
      <div className="budget-chart-wrap">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={history}
            margin={{ top: 14, right: 18, left: 18, bottom: 12 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              className="budget-grid"
            />
            <XAxis
              dataKey="fiscal_year"
              tick={{ className: "budget-chart-text" }}
            />
            <YAxis
              tickFormatter={formatAxisMillions}
              tick={{ className: "budget-chart-text" }}
            />
            <Tooltip content={<BudgetTooltip />} />
            <Legend content={<BudgetLegend />} />
            {budgetSeries.map((series) => (
              <Line
                key={series.dataKey}
                type="monotone"
                dataKey={series.dataKey}
                name={series.label}
                stroke={series.color}
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, fill: series.color }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
const BudgetLegend = () => (
  <div className="budget-history-legend">
    {budgetSeries.map((series) => (
      <span key={series.dataKey} style={{ color: series.color }}>
        <i style={{ backgroundColor: series.color }} />
        {series.label}
      </span>
    ))}
  </div>
);
const BudgetTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: number | string;
}> = ({ active, payload, label }) =>
  !active || !payload?.length ? null : (
    <div className="budget-tooltip" role="status">
      <strong>Año {label}</strong>
      {budgetSeries.map((series) => {
        const point = payload.find((item) => item.dataKey === series.dataKey);
        return (
          <span key={series.dataKey} style={{ color: series.color }}>
            {series.label}: {formatMillions(Number(point?.value || 0))}
          </span>
        );
      })}
    </div>
  );
