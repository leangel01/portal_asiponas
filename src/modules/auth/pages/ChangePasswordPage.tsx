import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Layout, Typography, message } from "antd";
import { supabaseClient } from "../../../config/supabaseClient";

const { Title, Paragraph } = Typography;

const authRpc = supabaseClient as unknown as {
  rpc: (name: string) => Promise<{ error?: { message: string } | null }>;
};

type PasswordValues = {
  password: string;
  confirmPassword: string;
};

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<PasswordValues>();
  const [saving, setSaving] = useState(false);

  const onFinish = async ({ password }: PasswordValues) => {
    setSaving(true);
    const { error: updateError } = await supabaseClient.auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      message.error(updateError.message);
      return;
    }

    const { error: rpcError } = await authRpc.rpc("complete_first_login_password_change");
    setSaving(false);
    if (rpcError) {
      message.error(rpcError.message);
      return;
    }

    message.success("Contraseña actualizada correctamente");
    navigate("/");
  };

  return (
    <Layout className="auth-page">
      <Card className="password-card">
        <Title level={3}>Establece tu contraseña</Title>
        <Paragraph>Por seguridad, define una contraseña personal antes de continuar.</Paragraph>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Nueva contraseña" name="password" rules={[{ required: true, min: 8, message: "Usa al menos 8 caracteres" }]} hasFeedback>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Confirmar contraseña" name="confirmPassword" dependencies={["password"]} hasFeedback rules={[{ required: true, message: "Confirma tu contraseña" }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue("password") === value ? Promise.resolve() : Promise.reject(new Error("Las contraseñas no coinciden")); } })]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saving}>Guardar contraseña</Button>
        </Form>
      </Card>
    </Layout>
  );
};
