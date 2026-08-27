import React from "react";
import { Card, Typography, Row, Col } from "antd";

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Panel Principal</Title>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Estado del Sistema">
            <Text type="success">● Operativo</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};