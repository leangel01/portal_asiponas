import React from "react";
import { List, useTable, CreateButton } from "@refinedev/antd";
import { Table, Tag } from "antd";
import { useCan } from "@refinedev/core";

export const UserList: React.FC = () => {
  const { tableProps } = useTable({ resource: "profiles", syncWithLocation: true });
  const { data: canCreate } = useCan({ resource: "users", action: "create" });

  return (
    <List headerButtons={() => (canCreate?.can ? <CreateButton resource="users">Nuevo Usuario</CreateButton> : null)}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="full_name" title="Nombre Completo" />
        <Table.Column dataIndex="department" title="Departamento" />
        <Table.Column
          dataIndex="role"
          title="Rol"
          render={(value) => {
            const colors: Record<string, string> = { admin_general: "red", admin_asipona: "blue", viewer: "green" };
            return <Tag color={colors[value] || "default"}>{value?.toUpperCase()}</Tag>;
          }}
        />
        <Table.Column
          dataIndex="asipona_id"
          title="ASIPONA"
          render={(value) => value || "Todas (General)"}
        />
      </Table>
    </List>
  );
};