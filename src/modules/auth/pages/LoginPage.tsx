import React from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, Layout } from "antd";

const { Title } = Typography;

export const LoginPage: React.FC = () => {
  const { mutate: login, isPending } = useLogin();

  return (
    <Layout style={{ minHeight: "100vh", justifyContent: "center", alignItems: "center" }}>
      <Card style={{ width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          Sistema de Gestión ASIPONA
        </Title>
        <Form layout="vertical" onFinish={(values) => login(values)}>
          <Form.Item label="Correo Electrónico" name="email" rules={[{ required: true }]}>
            <Input type="email" placeholder="usuario@asipona.gob.mx" />
          </Form.Item>
          <Form.Item label="Contraseña" name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isPending}>
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};