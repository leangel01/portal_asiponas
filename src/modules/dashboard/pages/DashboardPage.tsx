import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import {
  ApartmentOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FundOutlined,
  GlobalOutlined,
  HistoryOutlined,
  LineChartOutlined,
  ReadOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useCan, useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../../config/supabaseClient";
import type { UserProfile } from "../../../types/auth";
import {
  BudgetModule,
  ContractsModule,
  DirectoryModule,
  GoalsModule,
  HistoricalTimelineModule,
  InvestmentsModule,
  LocationsModule,
  OverviewModule,
  PressModule,
} from "../components";
import type {
  Asipona,
  Budget,
  BudgetItem,
  Contract,
  DirectoryContact,
  Goal,
  Investment,
  HistoricalTimeline,
  Location,
  News,
} from "../components";
import {
  fieldsByResource,
  resourceByModule,
  type CrudResource,
} from "../components/crudConfig";
import "./dashboard.css";

const { Title, Text } = Typography;
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
  timeline: HistoricalTimeline[];
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
  timeline: [],
};

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
  const { data: canCreateTimeline } = useCan({
    resource: "historical_timeline",
    action: "create",
  });
  const { data: canEditTimeline } = useCan({
    resource: "historical_timeline",
    action: "edit",
  });
  const { data: canDeleteTimeline } = useCan({
    resource: "historical_timeline",
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
  const [newsDateRange, setNewsDateRange] = useState<[string, string]>();
  const [newsDateOrder, setNewsDateOrder] = useState<"ascend" | "descend">(
    "descend",
  );
  const [newsCategory, setNewsCategory] = useState<string>();
  const [newsSentiment, setNewsSentiment] = useState<string>();

  useEffect(() => {
    const load = async () => {
      if (identity === undefined) return;
      if (!identity) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const ids = identity.asipona_ids;
      const isAdmin = identity.role === "admin_general";
      const queries = await Promise.all([
        (isAdmin
          ? supabaseClient.from("asiponas").select("*").eq("is_active", true)
          : supabaseClient.from("asiponas").select("*").in("id", ids)
        ).order("name"),
        (isAdmin
          ? supabaseClient.from("directory_contacts").select("*")
          : supabaseClient
              .from("directory_contacts")
              .select("*")
              .in("asipona_id", ids)
        ).order("display_order"),
        (isAdmin
          ? supabaseClient.from("locations").select("*")
          : supabaseClient.from("locations").select("*").in("asipona_id", ids)
        ).order("name"),
        (isAdmin
          ? supabaseClient.from("budgets").select("*")
          : supabaseClient.from("budgets").select("*").in("asipona_id", ids)
        ).order("fiscal_year", { ascending: false }),
        (isAdmin
          ? supabaseClient.from("news").select("*")
          : supabaseClient.from("news").select("*").in("asipona_id", ids)
        ).order("published_date", { ascending: false }),
        (isAdmin
          ? supabaseClient.from("goals").select("*")
          : supabaseClient.from("goals").select("*").in("asipona_id", ids)
        ).order("created_at", { ascending: false }),
        (isAdmin
          ? supabaseClient.from("contracts").select("*")
          : supabaseClient.from("contracts").select("*").in("asipona_id", ids)
        ).order("end_date"),
        (isAdmin
          ? supabaseClient.from("investment_projects").select("*")
          : supabaseClient
              .from("investment_projects")
              .select("*")
              .in("asipona_id", ids)
        ).order("created_at", { ascending: false }),
        (isAdmin
          ? supabaseClient.from("historical_timeline").select("*")
          : supabaseClient
              .from("historical_timeline")
              .select("*")
              .in("asipona_id", ids)
        ).order("year", { ascending: false }),
      ]);
      const budgets = queries[3];
      const accessibleAsiponaIds = (queries[0].data || []).map(
        (asipona) => asipona.id,
      );
      const budgetItems = accessibleAsiponaIds.length
        ? await supabaseClient
            .from("budget_items")
            .select("*")
            .in("asipona_id", accessibleAsiponaIds)
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
        timeline,
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
        timeline: timeline.data || [],
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
    return {
      contacts: belongs(data.contacts),
      locations: belongs(data.locations),
      news: belongs(data.news),
      goals: belongs(data.goals),
      contracts: belongs(data.contracts),
      investments: belongs(data.investments),
      timeline: belongs(data.timeline),
      budget: budgets[0],
      budgets,
      budgetItems: data.budgetItems.filter(
        (item) => item.asipona_id === current?.id,
      ),
    };
  }, [current?.id, data]);
  const filteredNews = useMemo(() => {
    const [from, to] = newsDateRange || [];
    return [...scoped.news]
      .filter((item) => !newsCategory || item.category === newsCategory)
      .filter((item) => !newsSentiment || item.sentiment === newsSentiment)
      .filter((item) => !from || item.published_date >= from)
      .filter((item) => !to || item.published_date <= to)
      .sort((left, right) => {
        const difference = left.published_date.localeCompare(
          right.published_date,
        );
        return newsDateOrder === "ascend" ? difference : -difference;
      });
  }, [newsCategory, newsDateOrder, newsDateRange, newsSentiment, scoped.news]);
  const newsCategories = Array.from(
    new Set(scoped.news.map((item) => item.category)),
  );
  const newsSentiments = Array.from(
    new Set(scoped.news.map((item) => item.sentiment)),
  );
  const modules = [
    ["Resumen", <GlobalOutlined />],
    ["Directorio", <TeamOutlined />],
    ["Recintos", <EnvironmentOutlined />],
    ["Presupuesto", <FundOutlined />],
    ["Noticias", <ReadOutlined />],
    ["Metas", <LineChartOutlined />],
    ["Contratos", <FileTextOutlined />],
    ["Inversiones", <ToolOutlined />],
    ["Línea de tiempo", <HistoryOutlined />],
  ] as const;
  const openCrud = (
    resource: CrudResource,
    record?: Record<string, unknown>,
  ) => {
    setCrudResource(resource);
    setCrudRecord(record);
    crudForm.resetFields();
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
        ? { ...values, asipona_id: current?.id }
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
    crudForm.resetFields();
    setCrudRecord(undefined);
    setCrudOpen(false);
    setRefreshKey((value) => value + 1);
  };

  if (loading)
    return <Card loading variant="borderless" style={{ minHeight: 420 }} />;
  if (error) return <Alert type="error" showIcon message={error} />;
  const permissions = {
    canEdit: canEdit?.can === true,
    canDelete: canDelete?.can === true,
  };
  return (
    <div className="asipona-dashboard">
      <div className="dashboard-hero">
        <Space align="start" size="middle">
          <div className="hero-mark">
            <ApartmentOutlined />
          </div>
          <div>
            <Text className="eyebrow">DGPCMC 2</Text>
            <Title level={2}>{current?.name || "Panel de ASIPONAs"}</Title>
            <Text type="secondary">
              Sistema integral de seguimiento portuario
            </Text>
          </div>
        </Space>
        <Select
          className="asipona-selector"
          value={selectedId}
          onChange={setSelectedId}
          options={data.asiponas.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          placeholder="Selecciona una ASIPONA"
          aria-label="Seleccionar ASIPONA"
        />
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
            {(activeModule === "Línea de tiempo"
              ? canCreateTimeline?.can === true
              : canCreate?.can === true) &&
              resourceByModule[activeModule] && (
              <Button
                type="primary"
                size="small"
                onClick={() =>
                  openCrud(resourceByModule[activeModule] as CrudResource)
                }
              >
                Agregar
              </Button>
            )}
          </div>
        )}
        {activeModule === "Resumen" && (
          <OverviewModule
            current={current}
            scoped={scoped}
            canEdit={permissions.canEdit}
            onEdit={() => current && openCrud("asiponas", current)}
          />
        )}
        {activeModule === "Directorio" && (
          <DirectoryModule
            items={scoped.contacts}
            {...permissions}
            onEdit={(item) => openCrud("directory_contacts", item)}
            onDelete={(id) => void deleteCrud("directory_contacts", id)}
          />
        )}
        {activeModule === "Recintos" && (
          <LocationsModule
            items={scoped.locations}
            {...permissions}
            onEdit={(item) => openCrud("locations", item)}
            onDelete={(id) => void deleteCrud("locations", id)}
          />
        )}
        {activeModule === "Presupuesto" && (
          <BudgetModule
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
        {activeModule === "Noticias" && (
          <>
            <div className="news-filters" aria-label="Filtros de noticias">
              <DatePicker.RangePicker
                format="DD/MM/YYYY"
                onChange={(dates) =>
                  setNewsDateRange(
                    dates?.[0] && dates?.[1]
                      ? [
                          dates[0].format("YYYY-MM-DD"),
                          dates[1].format("YYYY-MM-DD"),
                        ]
                      : undefined,
                  )
                }
                placeholder={["Fecha inicial", "Fecha final"]}
              />
              <Select
                allowClear
                value={newsCategory}
                placeholder="Categoría"
                options={newsCategories.map((category) => ({
                  label: category,
                  value: category,
                }))}
                onChange={setNewsCategory}
              />
              <Select
                allowClear
                value={newsSentiment}
                placeholder="Alerta"
                options={newsSentiments.map((sentiment) => ({
                  label: sentiment,
                  value: sentiment,
                }))}
                onChange={setNewsSentiment}
              />
              <Select
                value={newsDateOrder}
                options={[
                  { label: "Fecha más reciente", value: "descend" },
                  { label: "Fecha más antigua", value: "ascend" },
                ]}
                onChange={setNewsDateOrder}
              />
            </div>
            <PressModule
              items={filteredNews}
              {...permissions}
              onEdit={(item) => openCrud("news", item)}
              onDelete={(id) => void deleteCrud("news", id)}
            />
          </>
        )}
        {activeModule === "Metas" && (
          <GoalsModule
            items={scoped.goals}
            {...permissions}
            onEdit={(item) => openCrud("goals", item)}
            onDelete={(id) => void deleteCrud("goals", id)}
          />
        )}
        {activeModule === "Contratos" && (
          <ContractsModule
            items={scoped.contracts}
            {...permissions}
            onEdit={(item) => openCrud("contracts", item)}
            onDelete={(id) => void deleteCrud("contracts", id)}
          />
        )}
        {activeModule === "Inversiones" && (
          <InvestmentsModule
            items={scoped.investments}
            {...permissions}
            onEdit={(item) => openCrud("investment_projects", item)}
            onDelete={(id) => void deleteCrud("investment_projects", id)}
          />
        )}
        {activeModule === "Línea de tiempo" && (
          <HistoricalTimelineModule
            items={scoped.timeline}
            canEdit={canEditTimeline?.can === true}
            canDelete={canDeleteTimeline?.can === true}
            onEdit={(item) => openCrud("historical_timeline", item)}
            onDelete={(id) => void deleteCrud("historical_timeline", id)}
          />
        )}
        <Modal
          title={`${crudRecord ? "Editar" : "Agregar"} ${
            crudResource === "asiponas" ? "ficha de ASIPONA" : activeModule
          }`}
          open={crudOpen}
          confirmLoading={crudSaving}
          onCancel={() => {
            crudForm.resetFields();
            setCrudRecord(undefined);
            setCrudOpen(false);
          }}
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
      </Card>
    </div>
  );
};
