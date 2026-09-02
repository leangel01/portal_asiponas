import { Button, Empty, Popconfirm, Space } from "antd";

export const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <Empty
    image={Empty.PRESENTED_IMAGE_SIMPLE}
    description={`Sin datos de ${label}`}
  />
);

type RowActionsProps = {
  item: { id: string };
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
};

export const RowActions: React.FC<RowActionsProps> = ({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) => (
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

export const bounded = (value: number | null) =>
  Math.max(0, Math.min(100, value || 0));

export const statusColor = (status: string) =>
  ["Completado", "Vigente", "Positivo"].includes(status)
    ? "success"
    : ["En Riesgo", "Alerta"].includes(status)
    ? "error"
    : "processing";

export const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const moneyMillions = (value: number) =>
  `$${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((value || 0) / 1_000_000)} M`;
