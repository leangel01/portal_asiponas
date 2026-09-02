import { Card, Col, Progress, Row, Tag, Typography } from "antd";
import type { Goal } from "./types";
import { EmptyState, RowActions, bounded, statusColor } from "./shared";

const { Text } = Typography;

export const GoalsModule: React.FC<{
  items: Goal[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Goal) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) =>
  items.length ? <Row gutter={[16, 16]}>{items.map((item) => <Col xs={24} md={12} key={item.id}><Card size="small" title={item.title} extra={<Tag color={statusColor(item.status)}>{item.status}</Tag>} actions={[<RowActions key={item.id} item={item} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />]}><Text type="secondary">{item.kpi_name} · Meta: {item.target_value}</Text><Progress percent={bounded(item.progress)} /></Card></Col>)}</Row> : <EmptyState label="metas" />;
