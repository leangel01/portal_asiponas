import React, { useEffect, useState } from "react";
import { List, useSelect, useTable, CreateButton } from "@refinedev/antd";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from "antd";
import { useCan, useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../../config/supabaseClient";
import type { UserProfile } from "../../../types/auth";

type AsiponaAssignment = { profile_id: string; asipona_id: string };
type AsiponaName = { id: string; name: string };
type AsiponaFormValues = {
  code: string;
  name: string;
  full_name: string;
  region: string;
  coordinating_entity?: string;
  director?: string;
  website?: string;
  concession_area_ha?: number;
  concession_area_detail?: string;
  cpd_area_ha?: number;
  teu_capacity_annual?: number;
  max_draft_meters?: number;
  berth_positions?: number;
  annual_cargo_volume_tons?: number;
};
const relationClient = supabaseClient as unknown as {
  from: (table: string) => {
    select: (columns: string) => Promise<{ data: AsiponaAssignment[] | AsiponaName[] | null }>;
  };
  rpc: (name: string, args: { target_profile_id: string; target_asipona_ids: string[] }) => Promise<{ error: { message: string } | null }>;
};

export const UserList: React.FC = () => {
  const { tableProps } = useTable({ resource: "profiles", syncWithLocation: true });
  const { data: canCreate } = useCan({ resource: "users", action: "create" });
  const { data: identity } = useGetIdentity<UserProfile>();
  const { data: canAssign } = useCan({ resource: "users", action: "edit" });
  const [asiponaNames, setAsiponaNames] = useState<Record<string, string>>({});
  const [asiponaIdsByProfile, setAsiponaIdsByProfile] = useState<Record<string, string[]>>({});
  const [assignmentUserId, setAssignmentUserId] = useState<string>();
  const [assignmentIds, setAssignmentIds] = useState<string[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [asiponaModalOpen, setAsiponaModalOpen] = useState(false);
  const [savingAsipona, setSavingAsipona] = useState(false);
  const [asiponaForm] = Form.useForm<AsiponaFormValues>();
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

  const saveAsipona = async (values: AsiponaFormValues) => {
    setSavingAsipona(true);
    const { error } = await supabaseClient.from("asiponas").insert(values);
    setSavingAsipona(false);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("ASIPONA registrada correctamente");
    setAsiponaModalOpen(false);
    asiponaForm.resetFields();
    window.location.reload();
  };

  return (
    <List headerButtons={() => identity?.role === "admin_general" ? <Button type="primary" onClick={() => setAsiponaModalOpen(true)}>Registrar nueva ASIPONA</Button> : canCreate?.can === true ? <CreateButton resource="users">Nuevo Usuario</CreateButton> : null}>
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
      <Modal title="Registrar nueva ASIPONA" open={asiponaModalOpen} onCancel={() => setAsiponaModalOpen(false)} onOk={() => void asiponaForm.submit()} confirmLoading={savingAsipona} okText="Registrar" cancelText="Cancelar" width={720}>
        <Form form={asiponaForm} layout="vertical" onFinish={saveAsipona}>
          <Space wrap style={{ width: "100%" }}>
            <Form.Item label="Código" name="code" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Nombre corto" name="name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Nombre oficial" name="full_name" rules={[{ required: true }]}><Input style={{ width: 430 }} /></Form.Item>
            <Form.Item label="Región" name="region" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Entidad coordinadora" name="coordinating_entity"><Input /></Form.Item>
            <Form.Item label="Titular" name="director"><Input /></Form.Item>
            <Form.Item label="Sitio web" name="website"><Input /></Form.Item>
          </Space>
          <Form.Item label="Detalle del área concesionada" name="concession_area_detail"><Input.TextArea rows={2} /></Form.Item>
          <Space wrap style={{ width: "100%" }}>
            <Form.Item label="Área concesionada (Ha)" name="concession_area_ha"><InputNumber min={0} /></Form.Item>
            <Form.Item label="Superficie CPD (Ha)" name="cpd_area_ha"><InputNumber min={0} /></Form.Item>
            <Form.Item label="Capacidad TEUs anual" name="teu_capacity_annual"><InputNumber min={0} /></Form.Item>
            <Form.Item label="Calado máximo (m)" name="max_draft_meters"><InputNumber min={0} /></Form.Item>
            <Form.Item label="Posiciones de atraque" name="berth_positions"><InputNumber min={0} /></Form.Item>
            <Form.Item label="Carga anual (toneladas)" name="annual_cargo_volume_tons"><InputNumber min={0} /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </List>
  );
};