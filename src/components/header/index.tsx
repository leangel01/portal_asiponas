import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  Avatar,
  Button,
  Layout as AntdLayout,
  Menu,
  Space,
  Switch,
  Typography,
} from "antd";
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ColorModeContext } from "../../contexts/color-mode";

const { Text } = Typography;
type IUser = {
  id: string;
  full_name?: string;
  email?: string;
};

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { data: user } = useGetIdentity<IUser>();
  const { mutate: logout } = useLogout();
  const location = useLocation();
  const { mode, setMode } = useContext(ColorModeContext);

  const headerStyles: React.CSSProperties = {
    backgroundColor: "var(--asipona-green)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0 22px",
    height: "56px",
    gap: "18px",
    boxShadow: "0 1px 0 var(--asipona-border)",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <div className="asipona-brand">ASIPONA <span>SEMAR</span></div>
      <Menu mode="horizontal" selectedKeys={[location.pathname === "/users" ? "users" : "dashboard"]} className="asipona-menu" selectable theme="dark" items={[{ key: "dashboard", label: <Link to="/">Dashboard</Link> }, { key: "users", label: <Link to="/users">Usuarios</Link> }]} />
      <Space className="asipona-user-tools">
        <Switch
          checkedChildren="☾"
          unCheckedChildren="☀"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          checked={mode === "dark"}
        />
        <Space style={{ marginLeft: "8px" }} size="middle">
          {user?.full_name && <Text strong>{user.full_name}</Text>}
          <Avatar size="small">{(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}</Avatar>
          <Button type="text" size="small" className="logout-button" onClick={() => logout()}>Salir</Button>
        </Space>
      </Space>
    </AntdLayout.Header>
  );
};
