import { Collapse, Tag } from "antd";
import type { News } from "./types";
import { EmptyState, RowActions, statusColor } from "./shared";

export const PressModule: React.FC<{
  items: News[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: News) => void;
  onDelete?: (id: string) => void;
}> = ({ items, canEdit, canDelete, onEdit, onDelete }) =>
  items.length ? (
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
    <EmptyState label="Noticias" />
  );
