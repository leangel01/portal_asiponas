import React, { useEffect, useState } from "react";
import { List, useSelect, useTable } from "@refinedev/antd";
import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import { useCan, useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../../config/supabaseClient";
import type { UserProfile } from "../../../types/auth";

type AsiponaAssignment = { profile_id: string; asipona_id: string };
type AsiponaName = { id: string; name: string };
type UserEditFormValues = {
  full_name: string;
  department?: string;
  role: string;
};
const relationClient = supabaseClient as unknown as {
  from: (table: string) => {
    select: (columns: string) => Promise<{ data: AsiponaAssignment[] | AsiponaName[] | null }>;
  };
  rpc: (name: string, args: { target_profile_id: string; target_asipona_ids: string[] }) => Promise<{ error: { message: string } | null }>;
};

export const UserList: React.FC = () => {
  const { tableProps } = useTable({ resource: "profiles", syncWithLocation: true });
  const { data: identity } = useGetIdentity<UserProfile>();
  const { data: canAssign } = useCan({ resource: "users", action: "edit" });
  const isAdminGeneral = identity?.role === "admin_general";
  const [asiponaNames, setAsiponaNames] = useState<Record<string, string>>({});
  const [asiponaIdsByProfile, setAsiponaIdsByProfile] = useState<Record<string, string[]>>({});
  const [assignmentUserId, setAssignmentUserId] = useState<string>();
  const [assignmentIds, setAssignmentIds] = useState<string[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [userEditUserId, setUserEditUserId] = useState<string>();
  const [savingUser, setSavingUser] = useState(false);
  const [userEditForm] = Form.useForm<UserEditFormValues>();
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

  const openUserEditor = (record: Record<string, any>) => {
    if (!isAdminGeneral) {
      message.error("Solo el administrador general puede editar datos de usuarios.");
      return;
    }

    const userId = record.id as string | undefined;
    if (!userId) return;
    setUserEditUserId(userId);
    userEditForm.setFieldsValue({
      full_name: record.full_name || "",
      department: record.department || "",
      role: record.role || "viewer",
    });
  };

  const saveUser = async (values: UserEditFormValues) => {
    if (!userEditUserId) return;
    if (!isAdminGeneral) {
      message.error("No tienes permisos para modificar perfiles de usuarios.");
      return;
    }

    setSavingUser(true);
    const { data, error } = await (supabaseClient as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    }).rpc("update_user_profile_admin", {
      target_user_id: userEditUserId,
      new_full_name: values.full_name,
      new_department: values.department || null,
      new_role: values.role,
    });
    setSavingUser(false);

    if (error) {
      message.error(error.message || "No se pudo actualizar el perfil del usuario.");
      return;
    }

    message.success(data ? "Datos del usuario actualizados" : "Usuario actualizado");
    setUserEditUserId(undefined);
    userEditForm.resetFields();
    window.location.reload();
  };

  return (
    <List>
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
        {isAdminGeneral && <Table.Column title="Acciones" render={(_, record) => <Space><Button size="small" onClick={() => openUserEditor(record)}>Editar</Button><Button size="small" onClick={() => openAssignment(record.id)}>Asignar ASIPONAs</Button></Space>} />}
      </Table>
      <Modal title="Asignar ASIPONAs" open={Boolean(assignmentUserId)} onCancel={() => setAssignmentUserId(undefined)} onOk={() => void saveAssignment()} confirmLoading={savingAssignment} okText="Guardar" cancelText="Cancelar">
        <Form layout="vertical">
          <Form.Item label="ASIPONAs asignadas">
            <Select options={asiponaSelectProps.options} loading={asiponaSelectProps.loading} mode="multiple" value={assignmentIds} onChange={setAssignmentIds} placeholder="Selecciona una o más ASIPONAs" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="Editar usuario" open={Boolean(userEditUserId)} onCancel={() => setUserEditUserId(undefined)} onOk={() => void userEditForm.submit()} confirmLoading={savingUser} okText="Guardar" cancelText="Cancelar">
        <Form form={userEditForm} layout="vertical" onFinish={saveUser}>
          <Form.Item label="Nombre completo" name="full_name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Departamento" name="department"><Input /></Form.Item>
          <Form.Item label="Rol" name="role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="viewer">Viewer</Select.Option>
              <Select.Option value="admin_asipona">Admin de ASIPONA</Select.Option>
              <Select.Option value="admin_general">Admin General</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};