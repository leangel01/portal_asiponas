import { Card, Col, Row, Tag, Typography } from "antd";
import type { Location } from "./types";
import { EmptyState, RowActions } from "./shared";

const { Text } = Typography;

export const LocationsModule: React.FC<{
  items: Location[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: Location) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) =>
  items.length ? (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} md={12} lg={8} key={item.id}>
          <Card size="small" title={item.name} extra={<Tag>{item.type}</Tag>} actions={[<RowActions key={item.id} item={item} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />]}>
            <Text type="secondary">{item.description}</Text>
            <br />
            <a href={item.map_url || `https://maps.google.com/?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer">Abrir ubicación</a>
          </Card>
        </Col>
      ))}
    </Row>
  ) : <EmptyState label="recintos" />;
