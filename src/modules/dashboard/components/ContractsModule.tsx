import { Table, Tag } from "antd";
import type { Contract } from "./types";
import { EmptyState, RowActions, money, statusColor } from "./shared";

export const ContractsModule: React.FC<{
  items: Contract[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Contract) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) => items.length ? <Table rowKey="id" dataSource={items} scroll={{ x: 720 }} pagination={false} columns={[{ title: "Clave", dataIndex: "code" }, { title: "Contratista", dataIndex: "contractor" }, { title: "Tipo", dataIndex: "type" }, { title: "Vigencia", render: (_: unknown, item: Contract) => `${item.start_date} a ${item.end_date}` }, { title: "Monto", dataIndex: "amount", render: (value) => money(value) }, { title: "Estado", dataIndex: "status", render: (value) => <Tag color={statusColor(value)}>{value}</Tag> }, { title: "Acciones", render: (_: unknown, item: Contract) => <RowActions item={item} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} /> }]} /> : <EmptyState label="contratos" />;
