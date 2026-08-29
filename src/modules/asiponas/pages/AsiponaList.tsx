import React, { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useCan, useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../../config/supabaseClient";
import type { UserProfile } from "../../../types/auth";

const { Text } = Typography;

type AsiponaItem = {
  id: string;
  code?: string | null;
  name?: string | null;
  full_name?: string | null;
  region?: string | null;
  coordinating_entity?: string | null;
  director?: string | null;
  website?: string | null;
  concession_area_ha?: number | null;
  concession_area_detail?: string | null;
  cpd_area_ha?: number | null;
  teu_capacity_annual?: number | null;
  max_draft_meters?: number | null;
  berth_positions?: number | null;
  annual_cargo_volume_tons?: number | null;
  is_active?: boolean | null;
};

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
  is_active?: boolean;
};

const emptyAsiponaForm: AsiponaFormValues = {
  code: "",
  name: "",
  full_name: "",
  region: "",
};

export const AsiponaList: React.FC = () => {
  const { data: identity } = useGetIdentity<UserProfile>();
  const { data: canCreate } = useCan({ resource: "asiponas", action: "create" });
  const { data: canEdit } = useCan({ resource: "asiponas", action: "edit" });
  const { data: canDelete } = useCan({ resource: "asiponas", action: "delete" });
  const [items, setItems] = useState<AsiponaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<AsiponaFormValues>();

  const loadAsiponas = async () => {
    setLoading(true);
    const { data, error } = await supabaseClient.from("asiponas").select("*").order("name");
    setLoading(false);
    if (error) {
      message.error(error.message);
      return;
    }
    setItems((data as AsiponaItem[]) || []);
  };

  useEffect(() => {
    void loadAsiponas();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue(emptyAsiponaForm);
    setModalOpen(true);
  };

  const openEdit = (item: AsiponaItem) => {
    setEditingId(item.id);
    form.setFieldsValue({
      code: item.code || "",
      name: item.name || "",
      full_name: item.full_name || "",
      region: item.region || "",
      coordinating_entity: item.coordinating_entity || "",
      director: item.director || "",
      website: item.website || "",
      concession_area_ha: item.concession_area_ha ?? undefined,
      concession_area_detail: item.concession_area_detail || "",
      cpd_area_ha: item.cpd_area_ha ?? undefined,
      teu_capacity_annual: item.teu_capacity_annual ?? undefined,
      max_draft_meters: item.max_draft_meters ?? undefined,
      berth_positions: item.berth_positions ?? undefined,
      annual_cargo_volume_tons: item.annual_cargo_volume_tons ?? undefined,
      is_active: item.is_active ?? true,
    });
    setModalOpen(true);
  };

  const saveAsipona = async (values: AsiponaFormValues) => {
    setSaving(true);
    const payload = {
      ...values,
      is_active: values.is_active ?? true,
    };

    const query = editingId
      ? supabaseClient.from("asiponas").update(payload).eq("id", editingId)
      : supabaseClient.from("asiponas").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      message.error(error.message);
      return;
    }

    message.success(editingId ? "ASIPONA actualizada correctamente" : "ASIPONA registrada correctamente");
    setModalOpen(false);
    form.resetFields();
    void loadAsiponas();
  };

  const deleteAsipona = async (id: string) => {
    const { error } = await supabaseClient.from("asiponas").delete().eq("id", id);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("ASIPONA eliminada");
    void loadAsiponas();
  };

  if (identity?.role !== "admin_general") return null;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text strong style={{ fontSize: 18 }}>Listado de ASIPONAs</Text>
        {canCreate?.can === true && (
          <Button type="primary" onClick={openCreate}>Registrar nueva ASIPONA</Button>
        )}
      </div>

      <Table<AsiponaItem>
        rowKey="id"
        loading={loading}
        dataSource={items}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        columns={[
          { title: "Código", dataIndex: "code", key: "code" },
          { title: "Nombre corto", dataIndex: "name", key: "name" },
          { title: "Nombre oficial", dataIndex: "full_name", key: "full_name" },
          { title: "Región", dataIndex: "region", key: "region" },
          { title: "Entidad coordinadora", dataIndex: "coordinating_entity", key: "coordinating_entity" },
          { title: "Titular", dataIndex: "director", key: "director" },
          { title: "Estado", dataIndex: "is_active", key: "is_active", render: (value) => <Tag color={value === false ? "default" : "green"}>{value === false ? "Inactiva" : "Activa"}</Tag> },
          {
            title: "Acciones",
            key: "actions",
            render: (_, record) => (
              <Space>
                {canEdit?.can === true && <Button size="small" onClick={() => openEdit(record)}>Editar</Button>}
                {canDelete?.can === true && (
                  <Button danger size="small" onClick={() => void deleteAsipona(record.id)}>Eliminar</Button>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingId ? "Editar ASIPONA" : "Registrar ASIPONA"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void form.submit()}
        confirmLoading={saving}
        okText={editingId ? "Guardar cambios" : "Registrar"}
        cancelText="Cancelar"
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={saveAsipona}>
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
    </div>
  );
};
