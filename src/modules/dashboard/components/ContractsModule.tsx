import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Tooltip as AntTooltip,
  Typography,
} from "antd";
import { ArrowLeftOutlined, LinkOutlined } from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import type { Contract } from "./types";
import { EmptyState, RowActions, statusColor } from "./shared";

const { Text, Title } = Typography;
type ContractFilters = {
  fiscal_year?: number[];
  type?: string[];
  status?: string[];
  contract_type?: string[];
};
type FilterKey = keyof ContractFilters;
type Series = { key: string; label: string; color: string };

const palette = [
  "#9b2247",
  "#1e5b4f",
  "#a57f2c",
  "#611232",
  "#002f2a",
  "#98989a",
  "#161a1d",
  "#e6d194",
  "#8b6f47",
  "#3b7770",
  "#c25d78",
  "#62777b",
];

const amountOf = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const contractTotal = (item: Contract) =>
  amountOf(item.amount) + amountOf(item.tax_amount);

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");

const isAwarded = (item: Contract) => normalize(item.status) === "adjudicado";

const currencyCode = (item: Contract) =>
  item.currency?.trim().toUpperCase() || "Sin moneda especificada";

const formatCurrency = (
  value: number | null | undefined,
  currency: string | null | undefined,
) => {
  const amount = amountOf(value);
  const code = currency?.trim().toUpperCase();
  if (!code) {
    return `${new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 2,
    }).format(amount)} (sin moneda)`;
  }
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return `${new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 2,
    }).format(amount)} ${code}`;
  }
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "No especificada";
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = dateParts
    ? new Date(
        Number(dateParts[1]),
        Number(dateParts[2]) - 1,
        Number(dateParts[3]),
      )
    : new Date(value);
  if (
    dateParts &&
    (date.getFullYear() !== Number(dateParts[1]) ||
      date.getMonth() !== Number(dateParts[2]) - 1 ||
      date.getDate() !== Number(dateParts[3]))
  ) {
    return value;
  }
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);
};

const dateColumn = (value: string | null | undefined) =>
  value ? formatDate(value) : "—";

const matchesFilters = (
  item: Contract,
  filters: ContractFilters,
  excluded?: FilterKey,
) =>
  (excluded === "fiscal_year" ||
    !filters.fiscal_year?.length ||
    filters.fiscal_year.includes(item.fiscal_year)) &&
  (excluded === "type" ||
    !filters.type?.length ||
    filters.type.includes(item.type)) &&
  (excluded === "status" ||
    !filters.status?.length ||
    filters.status.includes(item.status)) &&
  (excluded === "contract_type" ||
    !filters.contract_type?.length ||
    filters.contract_type.includes(item.contract_type));

const uniqueValues = <T extends string | number>(
  values: Array<T | null | undefined>,
) =>
  [
    ...new Set(
      values.filter(
        (value): value is T => value !== null && value !== undefined,
      ),
    ),
  ].sort((left, right) =>
    typeof left === "number" && typeof right === "number"
      ? right - left
      : String(left).localeCompare(String(right), "es"),
  );

const indexValues = (values: string[]) =>
  new Map(values.map((value, index) => [value, `series_${index}`]));

const countByCategory = (
  records: Contract[],
  getCategory: (item: Contract) => string,
  field = "total",
) => {
  const totals = new Map<string, number>();
  records.forEach((item) => {
    const label = getCategory(item);
    totals.set(label, (totals.get(label) ?? 0) + 1);
  });
  return [...totals].map(([name, total]) => ({ name, [field]: total }));
};

const moneyByCategory = (
  records: Contract[],
  getCategory: (item: Contract) => string,
) => {
  const currencies = uniqueValues(records.map(currencyCode)).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const currencyKeys = indexValues(currencies);
  const rows = new Map<string, Record<string, string | number>>();
  records.forEach((item) => {
    const category = getCategory(item);
    const key = currencyKeys.get(currencyCode(item));
    if (!key) return;
    const row = rows.get(category) ?? { name: category };
    row[key] = Number(row[key] ?? 0) + contractTotal(item);
    rows.set(category, row);
  });
  return {
    rows: [...rows.values()],
    series: currencies.map((label, index) => ({
      key: `series_${index}`,
      label,
      color: palette[index % palette.length],
    })),
  };
};

const FloatingLegend: React.FC<{
  items: Series[];
  className?: string;
}> = ({ items, className }) => (
  <div
    className={className ?? "contracts-floating-legend"}
    aria-label="Leyenda del gráfico"
  >
    {items.map((item) => (
      <span key={item.key} title={item.label}>
        <i style={{ backgroundColor: item.color }} />
        {item.label}
      </span>
    ))}
  </div>
);

type ChartTooltipProps = Pick<
  TooltipContentProps,
  "active" | "label" | "payload"
> & {
  series?: Series[];
  money?: boolean;
};

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  label,
  payload,
  series = [],
  money = false,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="contracts-chart-tooltip">
      {label !== undefined && <strong>{label}</strong>}
      {payload.map((entry) => {
        const item = series.find((candidate) => candidate.key === entry.dataKey);
        return (
          <span key={String(entry.dataKey)}>
            <i style={{ backgroundColor: entry.color }} />
            {item?.label ?? entry.name ?? "Total"}:{" "}
            {money
              ? formatCurrency(
                  typeof entry.value === "number" ? entry.value : undefined,
                  item?.label,
                )
              : new Intl.NumberFormat("es-MX").format(
                  typeof entry.value === "number" ? entry.value : 0,
                )}
          </span>
        );
      })}
    </div>
  );
};

const dateKey = (value: string | null | undefined) => {
  if (!value) return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (match) return match[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const ContractsModule: React.FC<{
  items: Contract[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Contract) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) => {
  const [filters, setFilters] = useState<ContractFilters>({});
  const [selected, setSelected] = useState<Contract>();

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => matchesFilters(item, filters))
        .sort(
          (left, right) =>
            right.fiscal_year - left.fiscal_year ||
            (right.published_date ?? "").localeCompare(
              left.published_date ?? "",
            ),
        ),
    [items, filters],
  );
  const chartPeriod = useMemo(() => {
    const years = uniqueValues(filteredItems.map((item) => item.fiscal_year))
      .sort((left, right) => left - right);
    if (!years.length) return "Periodo: sin resultados";
    if (years.length === 1) return `Periodo: ${years[0]}`;
    const ranges: string[] = [];
    let start = years[0];
    let end = start;
    years.slice(1).forEach((year) => {
      if (year === end + 1) {
        end = year;
      } else {
        ranges.push(start === end ? String(start) : `${start}–${end}`);
        start = year;
        end = year;
      }
    });
    ranges.push(start === end ? String(start) : `${start}–${end}`);
    return `Periodo: ${ranges.join(", ")}`;
  }, [filteredItems]);
  const cardPeriod = `Periodo: ${chartPeriod.replace(/^Periodo:\s*/, "")}`;

  const availableValues = (key: FilterKey) => {
    const matchingItems = items.filter((item) =>
      matchesFilters(item, filters, key),
    );
    switch (key) {
      case "fiscal_year":
        return uniqueValues(matchingItems.map((item) => item.fiscal_year));
      case "type":
        return uniqueValues(matchingItems.map((item) => item.type));
      case "status":
        return uniqueValues(matchingItems.map((item) => item.status));
      case "contract_type":
        return uniqueValues(matchingItems.map((item) => item.contract_type));
    }
  };

  const awardedItems = useMemo(
    () => filteredItems.filter(isAwarded),
    [filteredItems],
  );
  const awardedByCurrency = useMemo(() => {
    const totals = new Map<string, number>();
    awardedItems.forEach((item) => {
      const currency = currencyCode(item);
      totals.set(currency, (totals.get(currency) ?? 0) + contractTotal(item));
    });
    return [...totals].sort(([left], [right]) =>
      left.localeCompare(right, "es"),
    );
  }, [awardedItems]);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const finalizedContracts = filteredItems.filter((item) => {
    const endDate = dateKey(item.end_date);
    return endDate !== undefined && endDate < todayKey;
  }).length;
  const activeContracts = filteredItems.filter((item) => {
    const endDate = dateKey(item.end_date);
    return endDate !== undefined && endDate > todayKey;
  }).length;

  const processTypeCounts = countByCategory(
    filteredItems,
    (item) => item.type,
  );
  const statusCounts = countByCategory(
    filteredItems,
    (item) => item.status,
  );
  const contractTypeCounts = countByCategory(
    filteredItems,
    (item) => item.contract_type,
  );
  const statusLegend = statusCounts.map((item, index) => ({
    key: item.name,
    label: item.name,
    color: palette[index % palette.length],
  }));
  const contractTypeLegend = contractTypeCounts.map((item, index) => ({
    key: item.name,
    label: item.name,
    color: palette[index % palette.length],
  }));
  const awardedByContractType = moneyByCategory(
    awardedItems,
    (item) => item.contract_type,
  );
  const awardedByProcessType = moneyByCategory(
    awardedItems,
    (item) => item.type,
  );

  const updateFilter = (
    key: FilterKey,
    value: number[] | string[] | undefined,
  ) =>
    setFilters((current) => ({
      ...current,
      [key]: value?.length ? value : undefined,
    }));

  const openEdit = (item: Contract) => onEdit?.(item);
  const deleteSelected = (id: string) => {
    setSelected(undefined);
    onDelete?.(id);
  };

  if (!items.length) return <EmptyState label="contratos" />;

  if (selected) {
    return (
      <section className="contracts-detail-view" lang="es">
        <Button
          className="contracts-back-button"
          icon={<ArrowLeftOutlined />}
          onClick={() => setSelected(undefined)}
        >
          Volver a procedimientos
        </Button>
        <Card className="contracts-detail-card">
          <div className="contracts-detail-heading">
            <div>
              <Text className="contracts-detail-eyebrow">
                DETALLE DEL PROCEDIMIENTO
              </Text>
              <Title level={3}>{selected.code}</Title>
            </div>
            <div className="contracts-detail-heading-actions">
              {selected.url && (
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver ficha en Compras MX
                </Button>
              )}
              <Tag color={statusColor(selected.status)}>{selected.status}</Tag>
            </div>
          </div>
          <div className="contracts-detail-summary">
            <div>
              <Text type="secondary">Tipo de procedimiento</Text>
              <Text strong>{selected.type}</Text>
            </div>
            <div>
              <Text type="secondary">Tipo de contrato</Text>
              <Text strong>{selected.contract_type}</Text>
            </div>
            <div>
              <Text type="secondary">Año fiscal</Text>
              <Text strong>{selected.fiscal_year}</Text>
            </div>
          </div>
          <div className="contracts-detail-section">
            <Title level={5}>Descripción</Title>
            <p>{selected.description || "Sin descripción disponible."}</p>
          </div>
          <div className="contracts-detail-section">
            <Title level={5}>Fechas del procedimiento</Title>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
              <Descriptions.Item label="Publicación">
                {dateColumn(selected.published_date)}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha fallo">
                {dateColumn(selected.effective_date)}
              </Descriptions.Item>
              <Descriptions.Item label="Inicio">
                {dateColumn(selected.start_date)}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de término">
                {dateColumn(selected.end_date)}
              </Descriptions.Item>
            </Descriptions>
          </div>
          <div className="contracts-detail-section">
            <Title level={5}>Importes</Title>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card size="small" className="contracts-detail-amount">
                  <Text type="secondary">Moneda</Text>
                  <Text strong>{currencyCode(selected)}</Text>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" className="contracts-detail-amount">
                  <Text type="secondary">Monto</Text>
                  <Text strong>
                    {formatCurrency(selected.amount, selected.currency)}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" className="contracts-detail-amount">
                  <Text type="secondary">Impuestos</Text>
                  <Text strong>
                    {formatCurrency(selected.tax_amount, selected.currency)}
                  </Text>
                </Card>
              </Col>
            </Row>
          </div>
          <div className="contracts-detail-actions">
            <RowActions
              item={selected}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={(item) => {
                setSelected(undefined);
                openEdit(item);
              }}
              onDelete={deleteSelected}
            />
          </div>
        </Card>
      </section>
    );
  }

  return (
    <>
      <div className="contracts-filters" aria-label="Filtros de contratos">
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Año"
          aria-label="Filtrar por año"
          value={filters.fiscal_year}
          options={availableValues("fiscal_year").map((value) => ({
            label: String(value),
            value,
          }))}
          onChange={(value: number[]) => updateFilter("fiscal_year", value)}
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Tipo de procedimiento"
          aria-label="Filtrar por tipo de procedimiento"
          value={filters.type}
          options={availableValues("type").map((value) => ({
            label: value,
            value,
          }))}
          onChange={(value: string[]) => updateFilter("type", value)}
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Estatus del procedimiento"
          aria-label="Filtrar por estatus del procedimiento"
          value={filters.status}
          options={availableValues("status").map((value) => ({
            label: value,
            value,
          }))}
          onChange={(value: string[]) => updateFilter("status", value)}
        />
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Tipo de contrato"
          aria-label="Filtrar por tipo de contrato"
          value={filters.contract_type}
          options={availableValues("contract_type").map((value) => ({
            label: value,
            value,
          }))}
          onChange={(value: string[]) => updateFilter("contract_type", value)}
        />
        {Object.values(filters).some((value) => value?.length) && (
          <Button onClick={() => setFilters({})}>Limpiar filtros</Button>
        )}
      </div>

      <Row gutter={[14, 14]} className="contracts-statistics">
        <Col xs={24} sm={12} xl={6}>
          <Card className="contracts-stat-card">
            <div className="contracts-stat-card-heading">
              <Statistic
                title="Procedimientos publicados"
                value={filteredItems.length}
              />
              <Text className="contracts-card-period">{cardPeriod}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="contracts-stat-card">
            <div className="contracts-stat-card-heading">
              <Text className="contracts-total-title">Monto adjudicado</Text>
              <Text className="contracts-card-period">{cardPeriod}</Text>
            </div>
            {awardedByCurrency.length ? (
              <div className="contracts-currency-totals">
                {awardedByCurrency.map(([currency, total]) => (
                  <div className="contracts-currency-total" key={currency}>
                    <Text className="contracts-currency-code">{currency}</Text>
                    <Text className="contracts-currency-amount">
                      {currency === "Sin moneda especificada"
                        ? `${new Intl.NumberFormat("es-MX", {
                            maximumFractionDigits: 2,
                          }).format(total)} (sin moneda)`
                        : formatCurrency(total, currency)}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text className="contracts-currency-amount">
                Sin adjudicaciones
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="contracts-stat-card">
            <div className="contracts-stat-card-heading">
              <Statistic
                title="Contratos finalizados"
                value={finalizedContracts}
              />
              <Text className="contracts-card-period">{cardPeriod}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="contracts-stat-card">
            <div className="contracts-stat-card-heading">
              <Statistic title="Contratos vigentes" value={activeContracts} />
              <Text className="contracts-card-period">{cardPeriod}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="contracts-charts">
          <Col xs={24} xl={12}>
            <section className="contracts-chart">
              <div className="contracts-chart-heading">
                <Title level={5}>Procedimientos por tipo</Title>
                <Text className="contracts-chart-period">{chartPeriod}</Text>
              </div>
              {processTypeCounts.length ? (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(300, processTypeCounts.length * 42)}
                >
                  <BarChart
                    data={processTypeCounts}
                    layout="vertical"
                    margin={{ top: 8, right: 18, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ className: "contracts-chart-text" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={220}
                      tick={{ className: "contracts-chart-text" }}
                      interval={0}
                      tickFormatter={(value: string) =>
                        value.length > 32 ? `${value.slice(0, 29)}…` : value
                      }
                    />
                    <Tooltip
                      content={(props) => <ChartTooltip {...props} />}
                    />
                    <Bar
                      dataKey="total"
                      name="Procedimientos"
                      radius={[0, 4, 4, 0]}
                    >
                      {processTypeCounts.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={palette[index % palette.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Sin procedimientos para los filtros seleccionados" />
              )}
            </section>
          </Col>
          <Col xs={24} xl={12}>
            <section className="contracts-chart">
              <div className="contracts-chart-heading">
                <Title level={5}>Procedimientos por estatus</Title>
                <Text className="contracts-chart-period">{chartPeriod}</Text>
              </div>
              {statusCounts.length ? (
                <div className="contracts-pie-layout">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusCounts}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={98}
                      >
                        {statusCounts.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={palette[index % palette.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={(props) => <ChartTooltip {...props} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <FloatingLegend
                    className="contracts-pie-legend"
                    items={statusLegend}
                  />
                </div>
              ) : (
                <Empty description="Sin procedimientos para los filtros seleccionados" />
              )}
            </section>
          </Col>
          <Col xs={24} xl={12}>
            <section className="contracts-chart">
              <div className="contracts-chart-heading">
                <Title level={5}>Tipos de contrato</Title>
                <Text className="contracts-chart-period">{chartPeriod}</Text>
              </div>
              {contractTypeCounts.length ? (
                <div className="contracts-pie-layout">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={contractTypeCounts}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={98}
                      >
                        {contractTypeCounts.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={palette[index % palette.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={(props) => <ChartTooltip {...props} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <FloatingLegend
                    className="contracts-pie-legend"
                    items={contractTypeLegend}
                  />
                </div>
              ) : (
                <Empty description="Sin tipos de contrato para los filtros seleccionados" />
              )}
            </section>
          </Col>
          <Col xs={24} xl={12}>
            <MoneyByCategoryChart
              title="Montos adjudicados por tipo de contrato"
              period={chartPeriod}
              data={awardedByContractType.rows}
              series={awardedByContractType.series}
            />
          </Col>
          <Col xs={24}>
            <MoneyByCategoryChart
              title="Montos adjudicados por tipo de procedimiento"
              period={chartPeriod}
              data={awardedByProcessType.rows}
              series={awardedByProcessType.series}
            />
          </Col>
      </Row>

      <section className="contracts-table-section" lang="es">
        <div className="contracts-chart-heading">
          <Title level={5}>Procedimientos de contratación</Title>
          <Text type="secondary">{filteredItems.length} resultados</Text>
        </div>
        <Table
          rowKey="id"
          dataSource={filteredItems}
          tableLayout="fixed"
          scroll={{ x: 1180 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: "Clave",
              dataIndex: "code",
              width: 125,
              render: (value: string) => (
                <span className="contracts-hyphenated-cell">{value}</span>
              ),
            },
            {
              title: "Estatus",
              dataIndex: "status",
              width: 115,
              render: (value: string) => (
                <Tag color={statusColor(value)}>{value}</Tag>
              ),
            },
            {
              title: "Tipo",
              dataIndex: "type",
              width: 155,
              render: (value: string) => (
                <span className="contracts-hyphenated-cell">{value}</span>
              ),
            },
            {
              title: "Descripción",
              dataIndex: "description",
              width: 205,
              render: (value: string | null) => (
                <AntTooltip title={value || "—"}>
                  <span className="contracts-description-cell contracts-hyphenated-cell">
                    {value || "—"}
                  </span>
                </AntTooltip>
              ),
            },
            { title: "Año fiscal", dataIndex: "fiscal_year", width: 82 },
            {
              title: "Fecha de publicación",
              dataIndex: "published_date",
              width: 132,
              render: dateColumn,
            },
            {
              title: "Fecha de fallo",
              dataIndex: "effective_date",
              width: 125,
              render: dateColumn,
            },
            {
              title: "Tipo de contrato",
              dataIndex: "contract_type",
              width: 145,
              render: (value: string) => (
                <span className="contracts-hyphenated-cell">{value}</span>
              ),
            },
            {
              title: "Monto",
              width: 135,
              render: (_: unknown, item: Contract) =>
                formatCurrency(contractTotal(item), item.currency),
            },
            {
              title: "Acciones",
              width: 116,
              render: (_: unknown, item: Contract) => (
                <div className="contracts-row-actions">
                  <Button size="small" onClick={() => setSelected(item)}>
                    Ver detalles
                  </Button>
                  <RowActions
                    item={item}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ),
            },
          ]}
        />
      </section>
    </>
  );
};

const MoneyByCategoryChart: React.FC<{
  title: string;
  period: string;
  data: Array<Record<string, string | number>>;
  series: Series[];
}> = ({ title, period, data, series }) => (
  <section className="contracts-chart">
    <div className="contracts-chart-heading">
      <Title level={5}>{title}</Title>
      <Text className="contracts-chart-period">{period}</Text>
    </div>
    {data.length ? (
      <div className="contracts-chart-plot">
        <FloatingLegend items={series} />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 50, right: 16, left: 8, bottom: 54 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="name"
              tick={{ className: "contracts-chart-text" }}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tick={{ className: "contracts-chart-text" }}
              tickFormatter={(value: number) =>
                new Intl.NumberFormat("es-MX", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value)
              }
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip {...props} series={series} money />
              )}
            />
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                fill={item.color}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <Empty description="Sin contratos adjudicados para los filtros seleccionados" />
    )}
  </section>
);
