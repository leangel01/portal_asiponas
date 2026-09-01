import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ApartmentOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FundOutlined,
  GlobalOutlined,
  LineChartOutlined,
  ReadOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useCan, useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../../config/supabaseClient";
import type { Database } from "../../../types/supabase";
import type { UserProfile } from "../../../types/auth";
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
import "./dashboard.css";

const { Title, Text } = Typography;
type Tables = Database["public"]["Tables"];
type Asipona = Tables["asiponas"]["Row"];
type DirectoryContact = Tables["directory_contacts"]["Row"];
type Location = Tables["locations"]["Row"];
type Budget = Tables["budgets"]["Row"];
type BudgetItem = Tables["budget_items"]["Row"];
type News = Tables["news"]["Row"];
type Goal = Tables["goals"]["Row"];
type Contract = Tables["contracts"]["Row"];
type Investment = Tables["investment_projects"]["Row"];
type CrudResource =
  | "asiponas"
  | "directory_contacts"
  | "locations"
  | "news"
  | "goals"
  | "contracts"
  | "investment_projects"
  | "budget_items";
type CrudField = {
  name: string;
  label: string;
  type?: "number" | "select" | "date";
  options?: string[];
  required?: boolean;
};

type DashboardData = {
  asiponas: Asipona[];
  contacts: DirectoryContact[];
  locations: Location[];
  budgets: Budget[];
  budgetItems: BudgetItem[];
  news: News[];
  goals: Goal[];
  contracts: Contract[];
  investments: Investment[];
};
const emptyData: DashboardData = {
  asiponas: [],
  contacts: [],
  locations: [],
  budgets: [],
  budgetItems: [],
  news: [],
  goals: [],
  contracts: [],
  investments: [],
};
const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
const moneyMillions = (value: number) =>
  `$${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((value || 0) / 1_000_000)} M`;
const bounded = (value: number | null) =>
  Math.max(0, Math.min(100, value || 0));
const statusColor = (status: string) =>
  ["Completado", "Vigente", "Positivo"].includes(status)
    ? "success"
    : ["En Riesgo", "Alerta"].includes(status)
    ? "error"
    : "processing";

export const DashboardPage: React.FC = () => {
  const { data: identity } = useGetIdentity<UserProfile>();
  const { data: canCreate } = useCan({
    resource: "dashboard",
    action: "create",
  });
  const { data: canCreateBudgetItem } = useCan({
    resource: "budget_items",
    action: "create",
  });
  const { data: canEditBudgetItem } = useCan({
    resource: "budget_items",
    action: "edit",
  });
  const { data: canDeleteBudgetItem } = useCan({
    resource: "budget_items",
    action: "delete",
  });
  const { data: canEdit } = useCan({ resource: "dashboard", action: "edit" });
  const { data: canDelete } = useCan({
    resource: "dashboard",
    action: "delete",
  });
  const [data, setData] = useState<DashboardData>(emptyData);
  const [selectedId, setSelectedId] = useState<string>();
  const [activeModule, setActiveModule] = useState("Resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudResource, setCrudResource] =
    useState<CrudResource>("directory_contacts");
  const [crudRecord, setCrudRecord] = useState<Record<string, unknown>>();
  const [crudSaving, setCrudSaving] = useState(false);
  const [crudForm] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (identity === undefined) return;
      if (!identity) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const allowedAsiponaIds = identity.asipona_ids;
      const isGeneralAdmin = identity.role === "admin_general";
      const queries = await Promise.all([
        (isGeneralAdmin
          ? supabaseClient.from("asiponas").select("*").eq("is_active", true)
          : supabaseClient
              .from("asiponas")
              .select("*")
              .in("id", allowedAsiponaIds)
        ).order("name"),
        (isGeneralAdmin
          ? supabaseClient.from("directory_contacts").select("*")
          : supabaseClient
              .from("directory_contacts")
              .select("*")
              .in("asipona_id", allowedAsiponaIds)
        ).order("display_order"),
        (isGeneralAdmin
          ? supabaseClient.from("locations").select("*")
          : supabaseClient
              .from("locations")
              .select("*")
              .in("asipona_id", allowedAsiponaIds)
        ).order("name"),
        (isGeneralAdmin
          ? supabaseClient.from("budgets").select("*")
          : supabaseClient
              .from("budgets")
              .select("*")
              .in("asipona_id", allowedAsiponaIds)
        ).order("fiscal_year", { ascending: false }),
        (isGeneralAdmin
          ? supabaseClient.from("news").select("*")
          : supabaseClient
              .from("news")
              .select("*")
              .in("asipona_id", allowedAsiponaIds)
        ).order("published_date", { ascending: false }),
        (isGeneralAdmin
          ? supabaseClient.from("goals").select("*")
          : supabaseClient
              .from("goals")
              .select("*")
              .in("asipona_id", allowedAsiponaIds)
        ).order("created_at", { ascending: false }),
        (isGeneralAdmin
          ? supabaseClient.from("contracts").select("*")
          : supabaseClient
              .from("contracts")
              .select("*")
              .in("asipona_id", allowedAsiponaIds)
        ).order("end_date"),
        (isGeneralAdmin
          ? supabaseClient.from("investment_projects").select("*")
          : supabaseClient
              .from("investment_projects")
              .select("*")
              .in("asipona_id", allowedAsiponaIds)
        ).order("created_at", { ascending: false }),
      ]);
      const budgets = queries[3];
      const budgetIds = (budgets.data || []).map((budget) => budget.id);
      const budgetItems = budgetIds.length
        ? await supabaseClient
            .from("budget_items")
            .select("*")
            .in("budget_id", budgetIds)
        : { data: [], error: null };
      if (queries.some((query) => query.error) || budgetItems.error)
        setError("No fue posible cargar la información del portal.");
      const [
        asiponas,
        contacts,
        locations,
        ,
        news,
        goals,
        contracts,
        investments,
      ] = queries;
      const next = {
        asiponas: asiponas.data || [],
        contacts: contacts.data || [],
        locations: locations.data || [],
        budgets: budgets.data || [],
        budgetItems: budgetItems.data || [],
        news: news.data || [],
        goals: goals.data || [],
        contracts: contracts.data || [],
        investments: investments.data || [],
      };
      setData(next);
      setSelectedId((previous) =>
        next.asiponas.some((item) => item.id === previous)
          ? previous
          : next.asiponas[0]?.id,
      );
      setLoading(false);
    };
    void load();
  }, [identity, refreshKey]);

  const current =
    data.asiponas.find((item) => item.id === selectedId) || data.asiponas[0];
  const scoped = useMemo(() => {
    const belongs = <T extends { asipona_id: string }>(items: T[]) =>
      items.filter((item) => item.asipona_id === current?.id);
    const budgets = data.budgets.filter(
      (item) => item.asipona_id === current?.id,
    );
    const budget = budgets[0];
    return {
      contacts: belongs(data.contacts),
      locations: belongs(data.locations),
      news: belongs(data.news),
      goals: belongs(data.goals),
      contracts: belongs(data.contracts),
      investments: belongs(data.investments),
      budget,
      budgets,
      budgetItems: data.budgetItems.filter(
        (item) => item.budget_id === budget?.id,
      ),
    };
  }, [current?.id, data]);
  const modules = [
    ["Resumen", <GlobalOutlined />],
    ["Directorio", <TeamOutlined />],
    ["Recintos", <EnvironmentOutlined />],
    ["Presupuesto", <FundOutlined />],
    ["Prensa", <ReadOutlined />],
    ["Metas", <LineChartOutlined />],
    ["Contratos", <FileTextOutlined />],
    ["Inversiones", <ToolOutlined />],
  ] as const;
  const resourceByModule: Record<string, CrudResource | undefined> = {
    Directorio: "directory_contacts",
    Recintos: "locations",
    Prensa: "news",
    Metas: "goals",
    Contratos: "contracts",
    Inversiones: "investment_projects",
  };
  const fieldsByResource: Record<CrudResource, CrudField[]> = {
    asiponas: [
      { name: "code", label: "Código", required: true },
      { name: "name", label: "Nombre corto", required: true },
      { name: "full_name", label: "Nombre oficial", required: true },
      { name: "region", label: "Región", required: true },
      { name: "coordinating_entity", label: "Entidad coordinadora" },
      { name: "director", label: "Titular" },
      { name: "website", label: "Sitio web" },
      {
        name: "concession_area_ha",
        label: "Área concesionada (Ha)",
        type: "number",
      },
      {
        name: "concession_area_detail",
        label: "Detalle del área concesionada",
      },
      { name: "cpd_area_ha", label: "Superficie CPD (Ha)", type: "number" },
      {
        name: "teu_capacity_annual",
        label: "Capacidad TEUs anual",
        type: "number",
      },
      { name: "max_draft_meters", label: "Calado máximo (m)", type: "number" },
      {
        name: "berth_positions",
        label: "Posiciones de atraque",
        type: "number",
      },
      {
        name: "annual_cargo_volume_tons",
        label: "Carga anual (toneladas)",
        type: "number",
      },
    ],
    directory_contacts: [
      { name: "name", label: "Nombre", required: true },
      { name: "position", label: "Cargo", required: true },
      { name: "department", label: "Departamento", required: true },
      { name: "email", label: "Correo" },
      { name: "phone", label: "Teléfono" },
      { name: "ext", label: "Extensión" },
    ],
    locations: [
      { name: "name", label: "Nombre", required: true },
      { name: "type", label: "Tipo", required: true },
      { name: "description", label: "Descripción" },
      { name: "latitude", label: "Latitud", type: "number" },
      { name: "longitude", label: "Longitud", type: "number" },
      { name: "map_url", label: "URL del mapa" },
    ],
    news: [
      { name: "title", label: "Titular", required: true },
      { name: "source", label: "Fuente" },
      { name: "summary", label: "Resumen" },
      {
        name: "category",
        label: "Categoría",
        type: "select",
        options: [
          "Operaciones",
          "Infraestructura",
          "Seguridad",
          "Finanzas",
          "Ambiental",
          "Institucional",
        ],
      },
      {
        name: "sentiment",
        label: "Sentimiento",
        type: "select",
        options: ["Positivo", "Neutro", "Alerta"],
      },
      { name: "published_date", label: "Fecha", type: "date" },
    ],
    goals: [
      { name: "title", label: "Meta", required: true },
      { name: "kpi_name", label: "KPI", required: true },
      { name: "target_value", label: "Valor objetivo", required: true },
      { name: "progress", label: "Avance (%)", type: "number" },
      {
        name: "term",
        label: "Plazo",
        type: "select",
        options: ["Corto Plazo", "Mediano Plazo", "Largo Plazo"],
      },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: [
          "Planeación",
          "En Proceso",
          "Completado",
          "En Riesgo",
          "Suspendido",
        ],
      },
    ],
    contracts: [
      { name: "code", label: "Clave", required: true },
      { name: "contractor", label: "Contratista", required: true },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        options: [
          "Obra Pública",
          "Cesión Parcial de Derechos",
          "Servicios Privados",
          "Arrendamiento",
        ],
      },
      { name: "start_date", label: "Inicio", type: "date", required: true },
      { name: "end_date", label: "Término", type: "date", required: true },
      { name: "amount", label: "Monto", type: "number" },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: [
          "Vigente",
          "En Ejecución",
          "Concluido",
          "Cancelado",
          "En Licitación",
        ],
      },
    ],
    investment_projects: [
      { name: "code", label: "Clave", required: true },
      { name: "name", label: "Proyecto", required: true },
      { name: "description", label: "Descripción" },
      { name: "total_cost", label: "Costo total", type: "number" },
      { name: "exec_physical", label: "Avance físico (%)", type: "number" },
      {
        name: "exec_financial",
        label: "Avance financiero (%)",
        type: "number",
      },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: [
          "Planeación",
          "Licitación",
          "En Ejecución",
          "Completado",
          "Suspendido",
        ],
      },
    ],
    budget_items: [
      { name: "concept", label: "Concepto", required: true },
      { name: "type", label: "Tipo", required: true },
      { name: "allocated", label: "Asignado", type: "number" },
      { name: "spent", label: "Ejecutado", type: "number" },
    ],
  };
  const openCrud = (
    resource: CrudResource,
    record?: Record<string, unknown>,
  ) => {
    setCrudResource(resource);
    setCrudRecord(record);
    crudForm.setFieldsValue(record || {});
    setCrudOpen(true);
  };
  const deleteCrud = async (resource: CrudResource, id: string) => {
    const { error: deleteError } = await (supabaseClient as any)
      .from(resource)
      .delete()
      .eq("id", id);
    if (deleteError) {
      message.error(deleteError.message);
      return;
    }
    message.success("Elemento eliminado");
    setRefreshKey((value) => value + 1);
  };
  const saveCrud = async (values: Record<string, unknown>) => {
    if (!current?.id && crudResource !== "asiponas") return;
    setCrudSaving(true);
    const payload =
      crudResource === "budget_items"
        ? { ...values, budget_id: scoped.budget?.id }
        : crudResource === "asiponas"
        ? values
        : { ...values, asipona_id: current.id };
    const query = (supabaseClient as any).from(crudResource);
    const result = crudRecord
      ? await query.update(payload).eq("id", crudRecord.id)
      : await query.insert(payload);
    setCrudSaving(false);
    if (result.error) {
      message.error(result.error.message);
      return;
    }
    message.success(crudRecord ? "Elemento actualizado" : "Elemento agregado");
    setCrudOpen(false);
    setRefreshKey((value) => value + 1);
  };

  if (loading)
    return <Card loading variant="borderless" style={{ minHeight: 420 }} />;
  if (error) return <Alert type="error" showIcon message={error} />;
  return (
    <div className="asipona-dashboard">
      <div className="dashboard-hero">
        <Space align="start" size="middle">
          <div className="hero-mark">
            <ApartmentOutlined />
          </div>
          <div>
            <Text className="eyebrow">PLATAFORMA UNIFICADA · SEMAR</Text>
            <Title level={2}>{current?.name || "Panel de ASIPONAs"}</Title>
            <Text type="secondary">
              Sistema integral de monitoreo portuario y proyectos
            </Text>
          </div>
        </Space>
        <Space direction="vertical" align="end">
          <Select
            className="asipona-selector"
            value={selectedId}
            onChange={(value) => setSelectedId(value)}
            options={data.asiponas.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            placeholder="Selecciona una ASIPONA"
            aria-label="Seleccionar ASIPONA"
          />
        </Space>
      </div>
      <div className="module-tabs">
        {modules.map(([label, icon]) => (
          <button
            className={activeModule === label ? "active" : ""}
            onClick={() => setActiveModule(label)}
            key={label}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>
      <Card className="module-card" variant="borderless">
        {activeModule !== "Resumen" && activeModule !== "Presupuesto" && (
          <div className="module-actions">
            <Text type="secondary">
              Gestión de {activeModule.toLowerCase()}
            </Text>
            <Space>
              {canCreate?.can === true &&
                (resourceByModule[activeModule] ||
                  activeModule === "Presupuesto") && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() =>
                      openCrud(
                        activeModule === "Presupuesto"
                          ? "budget_items"
                          : (resourceByModule[activeModule] as CrudResource),
                      )
                    }
                  >
                    Agregar
                  </Button>
                )}
            </Space>
          </div>
        )}
        {activeModule === "Resumen" && (
          <Overview
            current={current}
            scoped={scoped}
            canEdit={canEdit?.can === true}
            onEdit={() => current && openCrud("asiponas", current)}
          />
        )}
        {activeModule === "Directorio" && (
          <ContactList
            items={scoped.contacts}
            canEdit={canEdit?.can === true}
            canDelete={canDelete?.can === true}
            onEdit={(item) => openCrud("directory_contacts", item)}
            onDelete={(id) => void deleteCrud("directory_contacts", id)}
          />
        )}
        {activeModule === "Recintos" && (
          <LocationList
            items={scoped.locations}
            canEdit={canEdit?.can === true}
            canDelete={canDelete?.can === true}
            onEdit={(item) => openCrud("locations", item)}
            onDelete={(id) => void deleteCrud("locations", id)}
          />
        )}
        {activeModule === "Presupuesto" && (
          <BudgetView
            budget={scoped.budget}
            budgets={scoped.budgets}
            items={scoped.budgetItems}
            canEdit={canEditBudgetItem?.can === true}
            canDelete={canDeleteBudgetItem?.can === true}
            onAdd={
              canCreateBudgetItem?.can === true
                ? () => openCrud("budget_items")
                : undefined
            }
            onEdit={(item) => openCrud("budget_items", item)}
            onDelete={(id) => void deleteCrud("budget_items", id)}
          />
        )}
        {activeModule === "Prensa" && (
          <NewsList
            items={scoped.news}
            canEdit={canEdit?.can === true}
            canDelete={canDelete?.can === true}
            onEdit={(item) => openCrud("news", item)}
            onDelete={(id) => void deleteCrud("news", id)}
          />
        )}
        {activeModule === "Metas" && (
          <GoalList
            items={scoped.goals}
            canEdit={canEdit?.can === true}
            canDelete={canDelete?.can === true}
            onEdit={(item) => openCrud("goals", item)}
            onDelete={(id) => void deleteCrud("goals", id)}
          />
        )}
        {activeModule === "Contratos" && (
          <ContractTable
            items={scoped.contracts}
            canEdit={canEdit?.can === true}
            canDelete={canDelete?.can === true}
            onEdit={(item) => openCrud("contracts", item)}
            onDelete={(id) => void deleteCrud("contracts", id)}
          />
        )}
        {activeModule === "Inversiones" && (
          <InvestmentList
            items={scoped.investments}
            canEdit={canEdit?.can === true}
            canDelete={canDelete?.can === true}
            onEdit={(item) => openCrud("investment_projects", item)}
            onDelete={(id) => void deleteCrud("investment_projects", id)}
          />
        )}
        {crudOpen && (
          <Modal
            title={`${crudRecord ? "Editar" : "Agregar"} ${
              crudResource === "asiponas" ? "ficha de ASIPONA" : activeModule
            }`}
            open={crudOpen}
            confirmLoading={crudSaving}
            onCancel={() => setCrudOpen(false)}
            onOk={() => void crudForm.submit()}
            okText="Guardar"
            cancelText="Cancelar"
          >
            <Form form={crudForm} layout="vertical" onFinish={saveCrud}>
              {fieldsByResource[crudResource].map((field) => (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  rules={
                    field.required
                      ? [
                          {
                            required: true,
                            message: `Indica ${field.label.toLowerCase()}`,
                          },
                        ]
                      : undefined
                  }
                >
                  {field.type === "select" ? (
                    <Select
                      options={field.options?.map((option) => ({
                        label: option,
                        value: option,
                      }))}
                    />
                  ) : field.type === "number" ? (
                    <InputNumber style={{ width: "100%" }} min={0} />
                  ) : (
                    <Input type={field.type === "date" ? "date" : "text"} />
                  )}
                </Form.Item>
              ))}
            </Form>
          </Modal>
        )}
      </Card>
    </div>
  );
};

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <Empty
    image={Empty.PRESENTED_IMAGE_SIMPLE}
    description={`Sin datos de ${label}`}
  />
);
function Overview({
  current,
  scoped,
  canEdit,
  onEdit,
}: {
  current?: Asipona;
  scoped: any;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const completed = scoped.goals.filter(
    (item: Goal) => item.status === "Completado",
  ).length;
  return (
    <>
      <Card className="identity-strip" variant="borderless">
        <Space wrap split={<span className="muted-dot">•</span>}>
          <Badge status="success" text={current?.full_name} />
          <Text>
            <strong>Región:</strong> {current?.region}
          </Text>
          <Text>
            <strong>Titular:</strong> {current?.director || "Sin registrar"}
          </Text>
          <Text>
            <strong>Coordinación:</strong>{" "}
            {current?.coordinating_entity || "SEMAR"}
          </Text>
          {canEdit && (
            <Button size="small" onClick={onEdit}>
              Editar ficha
            </Button>
          )}
        </Space>
      </Card>
      <Row gutter={[12, 12]} className="technical-grid">
        {[
          [
            "Área concesionada",
            `${current?.concession_area_ha || 0} Ha`,
            <GlobalOutlined />,
          ],
          [
            "Superficie CPD",
            `${current?.cpd_area_ha || 0} Ha`,
            <ApartmentOutlined />,
          ],
          [
            "Capacidad TEUs",
            `${(current?.teu_capacity_annual || 0).toLocaleString(
              "es-MX",
            )} / año`,
            <FundOutlined />,
          ],
          [
            "Calado máximo",
            `${current?.max_draft_meters || 0} metros`,
            <EnvironmentOutlined />,
          ],
          [
            "Posiciones de atraque",
            `${current?.berth_positions || 0} posiciones`,
            <ApartmentOutlined />,
          ],
          [
            "Carga anual",
            `${((current?.annual_cargo_volume_tons || 0) / 1000000).toFixed(
              1,
            )} M toneladas`,
            <ToolOutlined />,
          ],
        ].map(([label, value, icon]) => (
          <Col xs={12} sm={8} lg={4} key={String(label)}>
            <Card size="small" className="metric-tile">
              <Text type="secondary">
                {icon} {label}
              </Text>
              <div className="metric-value">{value}</div>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="Estado operativo" className="inner-card">
            <Statistic
              title="Contactos activos"
              value={scoped.contacts.length}
              prefix={<TeamOutlined />}
            />
            <Progress
              percent={Math.round(
                (completed / Math.max(scoped.goals.length, 1)) * 100,
              )}
              strokeColor="#0f766e"
              format={(value) => `${value}% metas completadas`}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Actividad reciente" className="inner-card">
            <NewsList items={scoped.news.slice(0, 4)} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
function RowActions({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: { id: string };
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <Space>
      {canEdit && (
        <Button size="small" onClick={() => onEdit?.(item)}>
          Editar
        </Button>
      )}
      {canDelete && (
        <Popconfirm
          title="¿Eliminar este elemento?"
          onConfirm={() => onDelete?.(item.id)}
          okText="Eliminar"
          cancelText="Cancelar"
        >
          <Button danger size="small">
            Eliminar
          </Button>
        </Popconfirm>
      )}
    </Space>
  );
}
function ContactList({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: DirectoryContact[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: DirectoryContact) => void;
  onDelete?: (id: string) => void;
}) {
  return items.length ? (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[
            <RowActions
              key={item.id}
              item={item}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
            />,
          ]}
        >
          <List.Item.Meta
            avatar={<TeamOutlined />}
            title={item.name}
            description={`${item.position} · ${item.department}`}
          />
          <Space direction="vertical" align="end">
            <Text type="secondary">{item.email || "Sin correo"}</Text>
            <Text type="secondary">
              {item.phone || "Sin teléfono"}
              {item.ext ? ` · Ext. ${item.ext}` : ""}
            </Text>
          </Space>
        </List.Item>
      )}
    />
  ) : (
    <EmptyState label="directorio" />
  );
}
function LocationList({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: Location[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Location) => void;
  onDelete?: (id: string) => void;
}) {
  return items.length ? (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} md={12} lg={8} key={item.id}>
          <Card
            size="small"
            title={item.name}
            extra={<Tag>{item.type}</Tag>}
            actions={[
              <RowActions
                key={item.id}
                item={item}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
              />,
            ]}
          >
            <Text type="secondary">{item.description}</Text>
            <br />
            <a
              href={
                item.map_url ||
                `https://maps.google.com/?q=${item.latitude},${item.longitude}`
              }
              target="_blank"
              rel="noreferrer"
            >
              Abrir ubicación
            </a>
          </Card>
        </Col>
      ))}
    </Row>
  ) : (
    <EmptyState label="recintos" />
  );
}
function BudgetView({
  budget,
  budgets,
  items,
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}: {
  budget?: Budget;
  budgets: Budget[];
  items: BudgetItem[];
  canEdit?: boolean;
  canDelete?: boolean;
  onAdd?: () => void;
  onEdit?: (item: BudgetItem) => void;
  onDelete?: (id: string) => void;
}) {
  const execution = Math.round(
    ((budget?.spent_total || 0) / Math.max(budget?.assigned_total || 1, 1)) *
      100,
  );
  const [animatedExecution, setAnimatedExecution] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedExecution(execution));
    return () => cancelAnimationFrame(frame);
  }, [execution]);

  if (!budget) return <EmptyState label="presupuesto" />;

  const latestBudget = budgets.reduce(
    (latest, item) =>
      item.fiscal_year > latest.fiscal_year ? item : latest,
    budget,
  );
  return (
    <>
      <div className="budget-progress-heading">
        <Text strong>Avance gasto {latestBudget.fiscal_year}</Text>
      </div>
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <AnimatedMoneyStatistic
            title="Presupuesto aprobado"
            value={budget.assigned_total}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <AnimatedMoneyStatistic
            title="Presupuesto modificado"
            value={budget.modified_total}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <AnimatedMoneyStatistic
            title="Presupuesto ejercido"
            value={budget.spent_total}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <AnimatedMoneyStatistic
            title="Disponibilidad"
            value={budget.modified_total - budget.spent_total}
          />
        </Col>
      </Row>
      <div className="budget-progress-value">{animatedExecution}%</div>
      <Progress
        percent={animatedExecution}
        status={animatedExecution >= 100 ? "success" : "active"}
        strokeColor="#d97706"
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
}

function AnimatedMoneyStatistic({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(value * easedProgress);
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
}

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

function BudgetHistory({ budgets }: { budgets: Budget[] }) {
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
          <LineChart data={history} margin={{ top: 14, right: 18, left: 18, bottom: 12 }}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              className="budget-grid"
            />
            <XAxis dataKey="fiscal_year" tick={{ className: "budget-chart-text" }} />
            <YAxis tickFormatter={formatAxisMillions} tick={{ className: "budget-chart-text" }} />
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
}

function BudgetLegend() {
  return (
    <div className="budget-history-legend">
      {budgetSeries.map((series) => (
        <span key={series.dataKey} style={{ color: series.color }}>
          <i style={{ backgroundColor: series.color }} />
          {series.label}
        </span>
      ))}
    </div>
  );
}

function BudgetTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: number | string;
}) {
  if (!active || !payload?.length) return null;
  return (
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
}

function NewsList({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: News[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: News) => void;
  onDelete?: (id: string) => void;
}) {
  return items.length ? (
    <Collapse
      ghost
      items={items.map((item) => ({
        key: item.id,
        label: (
          <div className="news-heading">
            <span>
              <strong>{item.title}</strong>
              <small>
                {item.source || "Fuente interna"} · {item.published_date}
              </small>
            </span>
            <Tag color={statusColor(item.sentiment)}>{item.sentiment}</Tag>
          </div>
        ),
        children: (
          <div className="news-expanded">
            <p>{item.summary || "Sin resumen disponible"}</p>
            <RowActions
              item={item}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ),
      }))}
    />
  ) : (
    <EmptyState label="prensa" />
  );
}
function GoalList({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: Goal[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Goal) => void;
  onDelete?: (id: string) => void;
}) {
  return items.length ? (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} md={12} key={item.id}>
          <Card
            size="small"
            title={item.title}
            extra={<Tag color={statusColor(item.status)}>{item.status}</Tag>}
            actions={[
              <RowActions
                key={item.id}
                item={item}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
              />,
            ]}
          >
            <Text type="secondary">
              {item.kpi_name} · Meta: {item.target_value}
            </Text>
            <Progress percent={bounded(item.progress)} />
          </Card>
        </Col>
      ))}
    </Row>
  ) : (
    <EmptyState label="metas" />
  );
}
function ContractTable({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: Contract[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Contract) => void;
  onDelete?: (id: string) => void;
}) {
  return items.length ? (
    <Table
      rowKey="id"
      dataSource={items}
      scroll={{ x: 720 }}
      pagination={false}
      columns={[
        { title: "Clave", dataIndex: "code" },
        { title: "Contratista", dataIndex: "contractor" },
        { title: "Tipo", dataIndex: "type" },
        {
          title: "Vigencia",
          render: (_: unknown, item: Contract) =>
            `${item.start_date} a ${item.end_date}`,
        },
        {
          title: "Monto",
          dataIndex: "amount",
          render: (value) => money(value),
        },
        {
          title: "Estado",
          dataIndex: "status",
          render: (value) => <Tag color={statusColor(value)}>{value}</Tag>,
        },
        {
          title: "Acciones",
          render: (_: unknown, item: Contract) => (
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
  ) : (
    <EmptyState label="contratos" />
  );
}
function InvestmentList({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: Investment[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Investment) => void;
  onDelete?: (id: string) => void;
}) {
  return items.length ? (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[
            <RowActions
              key={item.id}
              item={item}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
            />,
          ]}
        >
          <List.Item.Meta
            title={`${item.code} · ${item.name}`}
            description={item.description || "Sin descripción"}
          />
          <Space direction="vertical" align="end">
            <Tag color={statusColor(item.status)}>{item.status}</Tag>
            <Text>
              Físico {bounded(item.exec_physical)}% · Financiero{" "}
              {bounded(item.exec_financial)}%
            </Text>
          </Space>
        </List.Item>
      )}
    />
  ) : (
    <EmptyState label="inversiones" />
  );
}
