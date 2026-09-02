import { Badge, Button, Card, Col, Progress, Row, Space, Statistic, Typography } from "antd";
import { ApartmentOutlined, EnvironmentOutlined, FundOutlined, GlobalOutlined, TeamOutlined, ToolOutlined } from "@ant-design/icons";
import type { Asipona, ScopedDashboardData } from "./types";
import { PressModule } from "./PressModule";

const { Text } = Typography;

export const OverviewModule: React.FC<{
  current?: Asipona;
  scoped: ScopedDashboardData;
  canEdit: boolean;
  onEdit: () => void;
}> = ({ current, scoped, canEdit, onEdit }) => {
  const completed = scoped.goals.filter((item) => item.status === "Completado").length;
  const metrics = [
    ["Área concesionada", `${current?.concession_area_ha || 0} Ha`, <GlobalOutlined />],
    ["Superficie CPD", `${current?.cpd_area_ha || 0} Ha`, <ApartmentOutlined />],
    ["Capacidad TEUs", `${(current?.teu_capacity_annual || 0).toLocaleString("es-MX")} / año`, <FundOutlined />],
    ["Calado máximo", `${current?.max_draft_meters || 0} metros`, <EnvironmentOutlined />],
    ["Posiciones de atraque", `${current?.berth_positions || 0} posiciones`, <ApartmentOutlined />],
    ["Carga anual", `${((current?.annual_cargo_volume_tons || 0) / 1000000).toFixed(1)} M toneladas`, <ToolOutlined />],
  ] as const;
  return <>
    <Card className="identity-strip" variant="borderless"><Space wrap split={<span className="muted-dot">•</span>}><Badge status="success" text={current?.full_name} /><Text><strong>Región:</strong> {current?.region}</Text><Text><strong>Titular:</strong> {current?.director || "Sin registrar"}</Text><Text><strong>Coordinación:</strong> {current?.coordinating_entity || "SEMAR"}</Text>{canEdit && <Button size="small" onClick={onEdit}>Editar ficha</Button>}</Space></Card>
    <Row gutter={[12, 12]} className="technical-grid">{metrics.map(([label, value, icon]) => <Col xs={12} sm={8} lg={4} key={label}><Card size="small" className="metric-tile"><Text type="secondary">{icon} {label}</Text><div className="metric-value">{value}</div></Card></Col>)}</Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}><Col xs={24} lg={10}><Card title="Estado operativo" className="inner-card"><Statistic title="Contactos activos" value={scoped.contacts.length} prefix={<TeamOutlined />} /><Progress percent={Math.round((completed / Math.max(scoped.goals.length, 1)) * 100)} strokeColor="#0f766e" format={(value) => `${value}% metas completadas`} /></Card></Col><Col xs={24} lg={14}><Card title="Actividad reciente" className="inner-card"><PressModule items={scoped.news.slice(0, 4)} /></Card></Col></Row>
  </>;
};
