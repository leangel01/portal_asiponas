import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Form,
  Input,
  Layout,
  Spin,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  LockOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { supabaseClient } from "../../../config/supabaseClient";
import "./login.css";

const { Text, Title } = Typography;

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
  const [saveError, setSaveError] = useState<string>();

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
    setSaveError(undefined);
    const { error } = await supabaseClient.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setSaveError("No fue posible actualizar la contraseña. Inténtalo de nuevo.");
      message.error("No fue posible actualizar la contraseña");
      return;
    }

    await supabaseClient.auth.signOut();
    message.success("Contraseña actualizada correctamente");
    form.resetFields();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <ResetPasswordLayout>
        <div className="login-state-panel" role="status">
          <Spin size="large" />
          <Text type="secondary">Validando el enlace de recuperación…</Text>
        </div>
      </ResetPasswordLayout>
    );
  }

  if (!validRecovery) {
    return (
      <ResetPasswordLayout>
        <div className="login-state-panel">
          <div className="login-state-mark login-state-warning">
            <WarningOutlined />
          </div>
          <Title level={3}>Enlace no válido o expirado</Title>
          <Text type="secondary">
            Solicita un nuevo correo para restablecer tu contraseña.
          </Text>
          <Button
            className="login-submit"
            type="primary"
            onClick={() => navigate("/login", { replace: true })}
            block
          >
            Volver al inicio de sesión
          </Button>
        </div>
      </ResetPasswordLayout>
    );
  }

  return (
    <ResetPasswordLayout>
      <div className="login-user-mark" aria-hidden="true">
        <LockOutlined />
      </div>
      <div className="login-section-title">
        <span />
        <Text>Restablecer contraseña</Text>
        <span />
      </div>
      <Text className="login-form-intro">
        Define una nueva contraseña para acceder al portal.
      </Text>
      <Form
        className="login-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}
      >
        {saveError && (
          <Alert
            className="login-error"
            message={saveError}
            showIcon
            type="error"
          />
        )}
        <Form.Item
          label="Nueva contraseña"
          name="password"
          rules={[
            { required: true, message: "Ingresa tu nueva contraseña" },
            { min: 8, message: "Usa al menos 8 caracteres" },
          ]}
          hasFeedback
        >
          <Input.Password
            autoComplete="new-password"
            prefix={<LockOutlined />}
            placeholder="Mínimo 8 caracteres"
            size="large"
          />
        </Form.Item>
        <Form.Item
          label="Confirmar contraseña"
          name="confirmPassword"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Confirma tu contraseña" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return !value || getFieldValue("password") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("Las contraseñas no coinciden"));
              },
            }),
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            prefix={<CheckCircleOutlined />}
            placeholder="Confirma tu nueva contraseña"
            size="large"
          />
        </Form.Item>
        <Form.Item>
          <Button
            className="login-submit"
            htmlType="submit"
            loading={saving}
            size="large"
            type="primary"
            block
          >
            Guardar contraseña
          </Button>
        </Form.Item>
      </Form>
      <Link className="login-recovery-link" to="/login">
        Volver al inicio de sesión
      </Link>
    </ResetPasswordLayout>
  );
};

const ResetPasswordLayout: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <Layout className="login-page">
    <aside className="login-brand-panel">
      <div className="login-brand-orbit login-brand-orbit-outer" />
      <div className="login-brand-orbit login-brand-orbit-inner" />
      <div className="login-brand-copy">
        <Text className="login-eyebrow">SABG&nbsp; / &nbsp;DGPCMC 2</Text>
        <Title level={1}>Seguimiento<br />portuario</Title>
        <Text className="login-brand-description">
          Sistema integral de seguimiento para las ASIPONAs de México.
        </Text>
      </div>
      <div className="login-palette" aria-label="Paleta institucional">
        {[
          ["#e6d194", "Dorado"],
          ["#a6802d", "Ocre"],
          ["#1e5b4f", "Verde"],
          ["#9b2247", "Vino"],
          ["#611232", "Vino profundo"],
          ["#98989a", "Gris"],
          ["#161a1d", "Carbón"],
        ].map(([color, name]) => (
          <span
            aria-label={name}
            className="login-palette-swatch"
            key={name}
            style={{ backgroundColor: color }}
            title={name}
          />
        ))}
      </div>
    </aside>
    <section className="login-form-panel">
      <div className="login-form-shell">{children}</div>
      <Text className="login-footer">
        Sistema integral de seguimiento portuario&nbsp; · &nbsp;ASIPONAS
      </Text>
    </section>
  </Layout>
);