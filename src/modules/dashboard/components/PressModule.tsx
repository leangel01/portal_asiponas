import { Button, Card, Modal, Tag } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { News } from "./types";
import { EmptyState, RowActions, statusColor } from "./shared";

export const PressModule: React.FC<{
  items: News[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: News) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) => {
  const [selected, setSelected] = useState<News>();

  if (!items.length) return <EmptyState label="Noticias" />;

  return (
    <>
      <div className="news-grid">
        {items.map((item) => (
          <Card
            key={item.id}
            className="news-card"
            hoverable
            onClick={() => setSelected(item)}
          >
            <div className="news-card-meta">
              <Tag color={statusColor(item.sentiment)}>{item.sentiment}</Tag>
              <time dateTime={item.published_date}>
                {new Intl.DateTimeFormat("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(new Date(item.published_date))}
              </time>
            </div>
            <h3>{item.title}</h3>
            <small>{item.source || "Fuente interna"}</small>
          </Card>
        ))}
      </div>
      <Modal
        title={selected?.title}
        open={Boolean(selected)}
        onCancel={() => setSelected(undefined)}
        footer={null}
      >
        {selected && (
          <div className="news-expanded">
            <div className="news-detail-meta">
              <Tag color={statusColor(selected.sentiment)}>
                {selected.sentiment}
              </Tag>
              <span>{selected.category}</span>
              <time dateTime={selected.published_date}>
                {new Intl.DateTimeFormat("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(new Date(selected.published_date))}
              </time>
            </div>
            <p>{selected.summary || "Sin resumen disponible"}</p>
            <div className="news-detail-footer">
              <span>{selected.source || "Fuente interna"}</span>
              <div className="news-detail-actions">
                {selected.url && (
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consultar nota completa
                  </Button>
                )}
                <RowActions
                  item={selected}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
