import React, { useEffect, useState } from "react";
import { List, useSelect, useTable, CreateButton } from "@refinedev/antd";
import { Button, Form, Modal, Select, Space, Table, Tag, message } from "antd";
import { useCan } from "@refinedev/core";
import { supabaseClient } from "../../../config/supabaseClient";

type AsiponaAssignment = { profile_id: string; asipona_id: string };
type AsiponaName = { id: string; name: string };
const relationClient = supabaseClient as unknown as {
  from: (table: string) => {
    select: (columns: string) => Promise<{ data: AsiponaAssignment[] | AsiponaName[] | null }>;
  };
  rpc: (name: string, args: { target_profile_id: string; target_asipona_ids: string[] }) => Promise<{ error: { message: string } | null }>;
};

export const UserList: React.FC = () => {
  const { tableProps } = useTable({ resource: "profiles", syncWithLocation: true });
  const { data: canCreate } = useCan({ resource: "users", action: "create" });
  const { data: canAssign } = useCan({ resource: "users", action: "edit" });
  const [asiponaNames, setAsiponaNames] = useState<Record<string, string>>({});
  const [asiponaIdsByProfile, setAsiponaIdsByProfile] = useState<Record<string, string[]>>({});
  const [assignmentUserId, setAssignmentUserId] = useState<string>();
  const [assignmentIds, setAssignmentIds] = useState<string[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const { selectProps: asiponaSelectProps } = useSelect({ resource: "asiponas", optionLabel: "name", optionValue: "id" });

  useEffect(() => {
    const loadAsiponas = async () => {
      const [{ data: assignments }, { data: asiponas }] = await Promise.all([
        relationClient.from("profile_asiponas").select("profile_id, asipona_id"),
        relationClient.from("asiponas").select("id, name"),
      ]);
      const names = new Map((asiponas as AsiponaName[] | null || []).map((item) => [item.id, item.name]));
      const grouped = (assignments as AsiponaAssignment[] | null || []).reduce<Record<string, string[]>>((result, item) => {
        result[item.profile_id] = [...(result[item.profile_id] || []), names.get(item.asipona_id) || item.asipona_id];
        return result;
      }, {});
      setAsiponaIdsByProfile((assignments as AsiponaAssignment[] | null || []).reduce<Record<string, string[]>>((result, item) => {
        result[item.profile_id] = [...(result[item.profile_id] || []), item.asipona_id];
        return result;
      }, {}));
      setAsiponaNames(Object.fromEntries(Object.entries(grouped).map(([profileId, values]) => [profileId, values.join(", ")])));
    };
    void loadAsiponas();
  }, []);

  const openAssignment = (profileId: string) => {
    setAssignmentUserId(profileId);
    setAssignmentIds(asiponaIdsByProfile[profileId] || []);
  };

  const saveAssignment = async () => {
    if (!assignmentUserId) return;
    setSavingAssignment(true);
    const { error } = await relationClient.rpc("assign_profile_asiponas", { target_profile_id: assignmentUserId, target_asipona_ids: assignmentIds });
    setSavingAssignment(false);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("Asignaciones actualizadas");
    setAssignmentUserId(undefined);
    window.location.reload();
  };

  return (
    <List headerButtons={canCreate?.can === true ? () => <CreateButton resource="users">Nuevo Usuario</CreateButton> : undefined}>
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
          dataIndex="id"
          title="ASIPONA"
          render={(value, record) => record.role === "admin_general" ? "Todas (General)" : asiponaNames[value] || "Sin asignar"}
        />
        {canAssign?.can === true && <Table.Column title="Acciones" render={(_, record) => <Button size="small" onClick={() => openAssignment(record.id)}>Asignar ASIPONAs</Button>} />}
      </Table>
      <Modal title="Asignar ASIPONAs" open={Boolean(assignmentUserId)} onCancel={() => setAssignmentUserId(undefined)} onOk={() => void saveAssignment()} confirmLoading={savingAssignment} okText="Guardar" cancelText="Cancelar">
        <Form layout="vertical">
          <Form.Item label="ASIPONAs asignadas">
            <Select options={asiponaSelectProps.options} loading={asiponaSelectProps.loading} mode="multiple" value={assignmentIds} onChange={setAssignmentIds} placeholder="Selecciona una o más ASIPONAs" />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};