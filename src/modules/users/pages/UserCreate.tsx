import React from "react";
import { Create, useSelect } from "@refinedev/antd";
import { Form, Input, Select, message } from "antd";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../../../config/supabaseClient";

type UserCreateFormValues = {
  email: string;
  password: string;
  full_name: string;
  department?: string;
  role: string;
  asipona_ids?: string[];
};

export const UserCreate: React.FC = () => {
  const navigate = useNavigate();

  const { selectProps: asiponaSelectProps } = useSelect({
    resource: "asiponas",
    optionLabel: "name",
    optionValue: "id",
  });

  const onFinish = async (values: UserCreateFormValues) => {
    try {
      const { data, error } = await supabaseClient.functions.invoke("create-user", {
        body: values,
      });

      if (error || data?.error) {
        message.error(`Error: ${error?.message || data?.error}`);
      } else {
        message.success("Usuario creado exitosamente");
        navigate("/users");
      }
    } catch {
      message.error("Error al procesar la solicitud.");
    }
  };

  return (
    <Create saveButtonProps={{ onClick: () => (document.getElementById("user-create-form") as HTMLFormElement | null)?.requestSubmit() }}>
      <Form id="user-create-form" layout="vertical" onFinish={onFinish}>
        <Form.Item label="Correo Electrónico" name="email" rules={[{ required: true, type: "email" }]}>
          <Input placeholder="correo@ejemplo.gob.mx" />
        </Form.Item>
        <Form.Item label="Contraseña Inicial" name="password" rules={[{ required: true, min: 6 }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item label="Nombre Completo" name="full_name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Departamento" name="department">
          <Input />
        </Form.Item>
        <Form.Item label="Rol" name="role" rules={[{ required: true }]}>
          <Select placeholder="Selecciona un rol">
            <Select.Option value="viewer">Viewer (Solo Lectura)</Select.Option>
            <Select.Option value="admin_asipona">Admin de ASIPONA</Select.Option>
            <Select.Option value="admin_general">Admin General</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="ASIPONAs asignadas" name="asipona_ids">
          <Select {...asiponaSelectProps} mode="multiple" allowClear placeholder="Selecciona una o más ASIPONAs" />
        </Form.Item>
      </Form>
    </Create>
  );
};