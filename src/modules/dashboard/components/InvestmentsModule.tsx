import { List, Space, Tag, Typography } from "antd";
import type { Investment } from "./types";
import { EmptyState, RowActions, bounded, statusColor } from "./shared";

const { Text } = Typography;

export const InvestmentsModule: React.FC<{
  items: Investment[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Investment) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) => items.length ? <List dataSource={items} renderItem={(item) => <List.Item actions={[<RowActions key={item.id} item={item} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />]}><List.Item.Meta title={`${item.code} · ${item.name}`} description={item.description || "Sin descripción"} /><Space direction="vertical" align="end"><Tag color={statusColor(item.status)}>{item.status}</Tag><Text>Físico {bounded(item.exec_physical)}% · Financiero {bounded(item.exec_financial)}%</Text></Space></List.Item>} /> : <EmptyState label="inversiones" />;
