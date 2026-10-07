import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Col,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import type { Key } from "react";
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
const budgetCategories = [
  { label: "Programática", value: "programatica" },
  { label: "Económica", value: "economica" },
  { label: "Objeto del gasto", value: "objetoGasto" },
] as const;
const budgetText = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);
const budgetAmount = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const normalizeCategory = (category: unknown) => {
  const normalized = budgetText(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]/g, "");
  if (normalized.startsWith("program")) return "programatica";
  if (normalized.startsWith("economic")) return "economica";
  if (normalized.startsWith("objeto")) return "objetoGasto";
  return normalized;
};
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
type BudgetFilters = {
  anio: number[];
  quarter_year: number[];
  type: string[];
  concep: string[];
};

type BudgetFilterDropdownProps = Pick<
  FilterDropdownProps,
  "selectedKeys" | "setSelectedKeys" | "confirm" | "clearFilters"
> & {
  options: Array<{ label: string; value: Key }>;
};

const BudgetFilterDropdown: React.FC<BudgetFilterDropdownProps> = ({
  options,
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
}) => {
  const [search, setSearch] = useState("");
  const visibleOptions = options.filter((option) =>
    option.label.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")),
  );
  const selectedSet = new Set(selectedKeys);
  const allSelected =
    options.length > 0 && options.every((option) => selectedSet.has(option.value));
  const partiallySelected =
    !allSelected && options.some((option) => selectedSet.has(option.value));

  return (
    <div className="budget-filter-dropdown">
      {options.length > 8 && (
        <Input
          allowClear
          size="small"
          placeholder="Buscar"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <Checkbox
        checked={allSelected}
        indeterminate={partiallySelected}
        disabled={!options.length}
        onChange={(event) =>
          setSelectedKeys(
            event.target.checked ? options.map((option) => option.value) : [],
          )
        }
      >
        Seleccionar todos
      </Checkbox>
      <Checkbox.Group
        value={selectedKeys}
        options={visibleOptions}
        onChange={(values) => setSelectedKeys(values as Key[])}
      />
      <Space>
        <Button
          type="primary"
          size="small"
          onClick={() => confirm({ closeDropdown: true })}
        >
          Aplicar
        </Button>
        <Button
          size="small"
          onClick={() => {
            setSelectedKeys([]);
            clearFilters?.({ confirm: true, closeDropdown: true });
          }}
        >
          Limpiar
        </Button>
      </Space>
    </div>
  );
};

const matchesBudgetFilters = (
  item: BudgetItem,
  filters: BudgetFilters,
  excluded?: keyof BudgetFilters,
) =>
  (excluded === "anio" ||
    !filters.anio.length ||
    filters.anio.includes(item.anio)) &&
  (excluded === "quarter_year" ||
    !filters.quarter_year.length ||
    filters.quarter_year.includes(item.quarter_year ?? -1)) &&
  (excluded === "type" ||
    !filters.type.length ||
    filters.type.includes(budgetText(item.type))) &&
  (excluded === "concep" ||
    !filters.concep.length ||
    filters.concep.includes(budgetText(item.concep)));

const budgetItemKey = (item: BudgetItem) =>
  JSON.stringify([
    item.anio,
    normalizeCategory(item.category),
    budgetText(item.type),
    budgetText(item.concep),
  ]);

export const BudgetModule: React.FC<{
  budgets: Budget[];
  items: BudgetItem[];
  canEdit?: boolean;
  canDelete?: boolean;
  loading?: boolean;
  onAdd?: (category: string) => void;
  onEdit?: (item: BudgetItem) => void;
  onDelete?: (id: string) => void;
}> = ({
  budgets = [],
  items = [],
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<string>("programatica");
  const [animatedExecution, setAnimatedExecution] = useState(0);
  const [filters, setFilters] = useState<BudgetFilters>({
    anio: [],
    quarter_year: [],
    type: [],
    concep: [],
  });
  const [periodOnly, setPeriodOnly] = useState(false);
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const latestBudget = budgets.reduce(
    (latest, item) => (item.fiscal_year > latest.fiscal_year ? item : latest),
    budgets[0],
  );
  const execution = latestBudget
    ? Math.round(
        (budgetAmount(latestBudget.spent_total) /
          Math.max(budgetAmount(latestBudget.modified_total) || 1, 1)) *
          100,
      )
    : 0;
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedExecution(execution));
    return () => cancelAnimationFrame(frame);
  }, [execution]);
  const categoryItems = useMemo(
    () =>
      items.filter(
        (item) => normalizeCategory(item.category) === selectedCategory,
      ),
    [items, selectedCategory],
  );
  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          categoryItems
            .filter((item) => matchesBudgetFilters(item, filters, "anio"))
            .map((item) => item.anio),
        ),
      ).sort((left, right) => right - left),
    [categoryItems, filters],
  );
  const availableQuarters = useMemo(
    () =>
      Array.from(
        new Set(
          categoryItems
            .filter((item) =>
              matchesBudgetFilters(item, filters, "quarter_year"),
            )
            .map((item) => item.quarter_year)
            .filter((quarter): quarter is number => quarter !== null),
        ),
      ).sort((left, right) => left - right),
    [categoryItems, filters],
  );
  const availableTypes = useMemo(
    () =>
      Array.from(
        new Set(
          categoryItems
            .filter((item) => matchesBudgetFilters(item, filters, "type"))
            .map((item) => budgetText(item.type)),
        ),
      )
        .filter((type) => type.trim().length > 0)
        .sort((left, right) => left.localeCompare(right, "es")),
    [categoryItems, filters],
  );
  const availableConcepts = useMemo(
    () =>
      Array.from(
        new Set(
          categoryItems
            .filter((item) => matchesBudgetFilters(item, filters, "concep"))
            .map((item) => budgetText(item.concep)),
        ),
      )
        .filter((concep) => concep.trim().length > 0)
        .sort((left, right) => left.localeCompare(right, "es")),
    [categoryItems, filters],
  );
  const filteredItems = useMemo(
    () => {
      const matchingItems = categoryItems.filter((item) =>
        matchesBudgetFilters(item, filters, "quarter_year"),
      );
      const itemsForSelectedQuarters = filters.quarter_year.length
        ? matchingItems.filter((item) =>
            filters.quarter_year.includes(item.quarter_year ?? -1),
          )
        : (() => {
            const latestQuarterByRecord = new Map<string, number | null>();
            matchingItems.forEach((item) => {
              const key = budgetItemKey(item);
              const previousQuarter = latestQuarterByRecord.get(key);
              if (
                previousQuarter === undefined ||
                (item.quarter_year ?? 0) > (previousQuarter ?? 0)
              ) {
                latestQuarterByRecord.set(key, item.quarter_year);
              }
            });
            return matchingItems.filter(
              (item) =>
                item.quarter_year === latestQuarterByRecord.get(budgetItemKey(item)),
            );
          })();
      return itemsForSelectedQuarters
        .map((item) => {
          const quarter = item.quarter_year;
          if (!periodOnly || quarter === null) return item;
          const previousQuarter = categoryItems.find(
            (candidate) =>
              candidate.quarter_year === quarter - 1 &&
              budgetItemKey(candidate) === budgetItemKey(item),
          );
          return {
            ...item,
            aproved:
              budgetAmount(item.aproved) -
              budgetAmount(previousQuarter?.aproved),
            modified:
              budgetAmount(item.modified) -
              budgetAmount(previousQuarter?.modified),
            spent:
              budgetAmount(item.spent) - budgetAmount(previousQuarter?.spent),
          };
        })
        .sort(
          (left, right) =>
            right.anio - left.anio ||
            (right.quarter_year ?? 0) - (left.quarter_year ?? 0) ||
            budgetText(left.type).localeCompare(budgetText(right.type), "es") ||
            budgetText(left.concep).localeCompare(
              budgetText(right.concep),
              "es",
            ),
        );
    },
    [categoryItems, filters, periodOnly],
  );
  const totalRow = useMemo(() => {
    return filteredItems.reduce(
      (total, item) => ({
        aproved: total.aproved + item.aproved,
        modified: total.modified + item.modified,
        spent: total.spent + item.spent,
      }),
      { aproved: 0, modified: 0, spent: 0 },
    );
  }, [filteredItems]);
  const showConceptColumn = selectedCategory !== "programatica";
  const showActionsColumn = canEdit || canDelete;
  return (
    <>
      {latestBudget && (
        <>
          <div className="budget-progress-heading">
            <Text strong>Avance gasto {latestBudget.fiscal_year}</Text>
          </div>
          <Row gutter={16}>
            {[
              ["Aprobado", latestBudget.assigned_total],
              ["Modificado", latestBudget.modified_total],
              ["Ejercido", latestBudget.spent_total],
              [
                "Disponibilidad",
                latestBudget.modified_total - latestBudget.spent_total,
              ],
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
        </>
      )}
      <div className="budget-items-heading">
        <Text strong>Conceptos de presupuesto</Text>
        {onAdd && (
          <Button
            type="primary"
            size="small"
            onClick={() => onAdd(selectedCategory)}
          >
            Agregar concepto
          </Button>
        )}
      </div>
      <Space wrap className="budget-filters" aria-label="Filtros de presupuesto">
        <Select
          aria-label="Categoría presupuestal"
          value={selectedCategory}
          options={budgetCategories.map(({ label, value }) => ({
            label,
            value,
          }))}
          onChange={(value: string) => {
            setSelectedCategory(value);
            setFilters({ anio: [], quarter_year: [], type: [], concep: [] });
            setTablePagination((current) => ({ ...current, current: 1 }));
          }}
        />
        <Checkbox
          checked={periodOnly}
          onChange={(event) => setPeriodOnly(event.target.checked)}
        >
          Datos del periodo
        </Checkbox>
        <Button
          onClick={() => {
            setSelectedCategory("programatica");
            setFilters({ anio: [], quarter_year: [], type: [], concep: [] });
            setPeriodOnly(false);
            setTablePagination((current) => ({ ...current, current: 1 }));
          }}
        >
          Restablecer filtros
        </Button>
      </Space>
      <Table<BudgetItem>
        rowKey="id"
        dataSource={filteredItems}
        loading={loading}
        pagination={{
          current: tablePagination.current,
          pageSize: tablePagination.pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} registros`,
        }}
        columns={[
          {
            title: "Año",
            dataIndex: "anio",
            filters: availableYears.map((year) => ({
              text: String(year),
              value: year,
            })),
            filteredValue: filters.anio,
            filterMultiple: true,
            filterDropdown: (props: FilterDropdownProps) => (
              <BudgetFilterDropdown
                {...props}
                options={availableYears.map((year) => ({
                  label: String(year),
                  value: year,
                }))}
              />
            ),
            onFilter: () => true,
          },
          {
            title: "Trimestre",
            dataIndex: "quarter_year",
            filters: availableQuarters.map((quarter) => ({
              text: `Trimestre ${quarter}`,
              value: quarter,
            })),
            filteredValue: filters.quarter_year,
            filterMultiple: true,
            filterDropdown: (props: FilterDropdownProps) => (
              <BudgetFilterDropdown
                {...props}
                options={availableQuarters.map((quarter) => ({
                  label: `Trimestre ${quarter}`,
                  value: quarter,
                }))}
              />
            ),
            onFilter: () => true,
            render: (value: number | null) => value ?? "—",
          },
          {
            title: "Tipo",
            dataIndex: "type",
            filters: availableTypes.map((type) => ({ text: type, value: type })),
            filteredValue: filters.type,
            filterMultiple: true,
            filterDropdown: (props: FilterDropdownProps) => (
              <BudgetFilterDropdown
                {...props}
                options={availableTypes.map((type) => ({
                  label: type,
                  value: type,
                }))}
              />
            ),
            onFilter: () => true,
            render: (value: string | null | undefined) => (
              <Tag>{budgetText(value) || "—"}</Tag>
            ),
          },
          ...(showConceptColumn
            ? [
                {
                  title: "Concepto",
                  dataIndex: "concep" as const,
                  render: (value: string | null | undefined) =>
                    budgetText(value) || "—",
                  filters: availableConcepts.map((concep) => ({
                    text: concep,
                    value: concep,
                  })),
                  filteredValue: filters.concep,
                  filterMultiple: true,
                  filterDropdown: (props: FilterDropdownProps) => (
                    <BudgetFilterDropdown
                      {...props}
                      options={availableConcepts.map((concep) => ({
                        label: concep,
                        value: concep,
                      }))}
                    />
                  ),
                  onFilter: () => true,
                },
              ]
            : []),
          {
            title: "Aprobado",
            dataIndex: "aproved",
            render: (value) => money(value),
          },
          {
            title: "Modificado",
            dataIndex: "modified",
            render: (value) => money(value),
          },
          {
            title: "Ejercido",
            dataIndex: "spent",
            render: (value) => money(value),
          },
          ...(showActionsColumn
            ? [
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
              ]
            : []),
        ]}
        locale={{ emptyText: <EmptyState label="conceptos de presupuesto" /> }}
        onChange={(pagination, selectedFilters) => {
          setTablePagination({
            current: pagination.current ?? 1,
            pageSize: pagination.pageSize ?? 10,
          });
          setFilters({
            anio: (selectedFilters.anio || []) as number[],
            quarter_year: (selectedFilters.quarter_year || []) as number[],
            type: (selectedFilters.type || []) as string[],
            concep: (selectedFilters.concep || []) as string[],
          });
        }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3 + Number(showConceptColumn)}>
                <Text strong>Total</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3 + Number(showConceptColumn)}>
                <Text strong>{money(totalRow.aproved)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4 + Number(showConceptColumn)}>
                <Text strong>{money(totalRow.modified)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5 + Number(showConceptColumn)}>
                <Text strong>{money(totalRow.spent)}</Text>
              </Table.Summary.Cell>
              {showActionsColumn && (
                <Table.Summary.Cell index={6 + Number(showConceptColumn)} />
              )}
            </Table.Summary.Row>
          </Table.Summary>
        )}
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
