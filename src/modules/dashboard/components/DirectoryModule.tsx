import { List, Space, Typography } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import type { DirectoryContact } from "./types";
import { EmptyState, RowActions } from "./shared";

const { Text } = Typography;

export const DirectoryModule: React.FC<{
  items: DirectoryContact[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: DirectoryContact) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) =>
  items.length ? (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[<RowActions key={item.id} item={item} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />]}
        >
          <List.Item.Meta
            avatar={<TeamOutlined />}
            title={item.name}
            description={`${item.position}`}
          />
          <Space direction="vertical" align="end">
            <Text type="secondary">{item.email || "Sin correo"}</Text>
            <Text type="secondary">{item.phone || "Sin teléfono"}{item.ext ? ` · Ext. ${item.ext}` : ""}</Text>
          </Space>
        </List.Item>
      )}
    />
  ) : <EmptyState label="directorio" />;
