import React from "react";
import { useLogin } from "@refinedev/core";
import {
  Alert,
  Button,
  Form,
  Input,
  Layout,
  message,
  Typography,
} from "antd";
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

const { Text, Title } = Typography;

type LoginValues = {
  email: string;
  password: string;
};

export const LoginPage: React.FC = () => {
  const { mutateAsync: login, isPending } = useLogin<LoginValues>();
  const navigate = useNavigate();
  const [loginError, setLoginError] = React.useState<string>();

  const showLoginError = (error: string) => {
    setLoginError(error);
    message.error(error);
  };

  const submitLogin = async (values: LoginValues) => {
    setLoginError(undefined);
    try {
      const result = await login({
        ...values,
        email: values.email.trim().toLowerCase(),
      });
      if (result?.success) {
        navigate(result.redirectTo || "/", { replace: true });
      } else {
        showLoginError("Correo o contraseña incorrectos.");
      }
    } catch {
      showLoginError("No fue posible iniciar sesión. Inténtalo de nuevo.");
    }
  };

  return (
    <Layout className="login-page">
      <aside className="login-brand-panel">
        <div className="login-brand-orbit login-brand-orbit-outer" />
        <div className="login-brand-orbit login-brand-orbit-inner" />
        <div className="login-brand-copy">
          <Text className="login-eyebrow">SABG&nbsp; / &nbsp;DGPCMC 2</Text>
          <Title level={1}>Seguimiento<br />ASIPONAS</Title>
          <Text className="login-brand-description">
            Sitio con informacion historica / presupuestaria.
          </Text>
        </div>
        <div className="login-palette" aria-label="Paleta institucional">
          {[
            ["#e6d194", "Dorado"],
            ["#a57f2c", "Ocre"],
            ["#1e5b4f", "Verde"],
            ["#9b2247", "Vino"],
            ["#611232", "Vino profundo"],
            ["#92999b", "Gris"],
            ["#15191d", "Carbón"],
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
        <div className="login-form-shell">
          <div className="login-user-mark" aria-hidden="true">
            <UserOutlined />
          </div>
          <div className="login-section-title">
            <span />
            <Text>Iniciar sesión</Text>
            <span />
          </div>
          <Form<LoginValues>
            className="login-form"
            layout="vertical"
            requiredMark={false}
            onFinish={submitLogin}
            onFinishFailed={() =>
              showLoginError("Revisa el correo y la contraseña ingresados.")
            }
          >
            {loginError && (
              <Alert
                className="login-error"
                message={loginError}
                showIcon
                type="error"
                role="alert"
              />
            )}
            <Form.Item
              label="Correo institucional"
              name="email"
              rules={[
                { required: true, message: "Ingresa tu correo institucional" },
                { type: "email", message: "Ingresa un correo válido" },
              ]}
            >
              <Input
                autoComplete="username"
                prefix={<MailOutlined />}
                placeholder="nombre@institucion.gob.mx"
                size="large"
                type="email"
              />
            </Form.Item>
            <Form.Item
              label="Contraseña"
              name="password"
              rules={[{ required: true, message: "Ingresa tu contraseña" }]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder="Ingresa tu contraseña"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                className="login-submit"
                htmlType="submit"
                loading={isPending}
                size="large"
                type="primary"
                block
              >
                Iniciar sesión
              </Button>
            </Form.Item>
          </Form>
          <Link className="login-recovery-link" to="/reset-password">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Text className="login-footer">
          Sistema integral de seguimiento portuario&nbsp; · &nbsp;ASIPONAS
        </Text>
      </section>
    </Layout>
  );
};
