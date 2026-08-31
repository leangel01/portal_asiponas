import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Layout, Result, Spin, Typography, message } from "antd";
import { supabaseClient } from "../../../config/supabaseClient";

const { Title, Paragraph } = Typography;

type PasswordValues = {
  password: string;
  confirmPassword: string;
};

const getRecoveryTokens = () => {
  const hash = window.location.hash;
  const tokenStart = hash.indexOf("access_token=");
  if (tokenStart === -1) return null;

  const tokens = new URLSearchParams(hash.slice(tokenStart));
  const accessToken = tokens.get("access_token");
  const refreshToken = tokens.get("refresh_token");
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
};

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<PasswordValues>();
  const [loading, setLoading] = useState(true);
  const [validRecovery, setValidRecovery] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    let recoveryEventReceived = false;
    const recoveryTokens = getRecoveryTokens();

    const checkRecoverySession = async () => {
      if (recoveryTokens) {
        const { error } = await supabaseClient.auth.setSession({
          access_token: recoveryTokens.accessToken,
          refresh_token: recoveryTokens.refreshToken,
        });
        if (error) {
          if (mounted) setLoading(false);
          return;
        }

        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#/reset-password`,
        );
      }

      const { data } = await supabaseClient.auth.getSession();
      if (mounted) {
        setValidRecovery(Boolean(data.session && (recoveryTokens || recoveryEventReceived)));
        setLoading(false);
      }
    };

    const { data: listener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && mounted) {
        recoveryEventReceived = true;
        setValidRecovery(Boolean(session));
        setLoading(false);
      }
    });

    void checkRecoverySession();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const onFinish = async ({ password }: PasswordValues) => {
    setSaving(true);
    const { error } = await supabaseClient.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      message.error("No fue posible actualizar la contraseña");
      return;
    }

    await supabaseClient.auth.signOut();
    message.success("Contraseña actualizada correctamente");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <Layout className="auth-page">
        <Spin size="large" />
      </Layout>
    );
  }

  if (!validRecovery) {
    return (
      <Layout className="auth-page">
        <Card className="password-card">
          <Result
            status="warning"
            title="Enlace no válido o expirado"
            subTitle="Solicita un nuevo correo de restablecimiento de contraseña."
            extra={<Button type="primary" onClick={() => navigate("/login", { replace: true })}>Volver al inicio de sesión</Button>}
          />
        </Card>
      </Layout>
    );
  }

  return (
    <Layout className="auth-page">
      <Card className="password-card">
        <Title level={3}>Restablece tu contraseña</Title>
        <Paragraph>Define una nueva contraseña para acceder al portal.</Paragraph>
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