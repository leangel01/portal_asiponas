import React from "react";
import { Refine, Authenticated } from "@refinedev/core";
import { ThemedLayout, ErrorComponent, useNotificationProvider } from "@refinedev/antd";
import { HashRouter, Navigate, Routes, Route, Outlet, useLocation } from "react-router-dom";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/authProvider";
import { accessControlProvider } from "./providers/accessControl";
import { dataProvider } from "./providers/data";

import { ChangePasswordPage, LoginPage } from "./modules/auth";
import { UserList, UserCreate } from "./modules/users";
import { DashboardPage } from "./modules/dashboard";
import { Header } from "./components";
import { useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "./config/supabaseClient";
import type { UserProfile } from "./types/auth";
import "./theme.css";

export const App: React.FC = () => {
  const notificationProvider = useNotificationProvider();

  return (
    <HashRouter>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        accessControlProvider={accessControlProvider}
        notificationProvider={notificationProvider}
        resources={[
          {
            name: "dashboard",
            list: "/",
            meta: { label: "Dashboard" },
          },
          {
            name: "users",
            list: "/users",
            create: "/users/create",
            meta: { label: "Usuarios" },
          },
          {
            name: "asiponas",
            meta: { label: "ASIPONAs" },
          },
        ]}
      >
        <Routes>
          <Route
            element={
              <Authenticated key="auth-routes" fallback={<LoginPage />}>
                <ThemedLayout Header={Header} Sider={() => null}>
                  <FirstLoginGuard>
                    <Outlet />
                  </FirstLoginGuard>
                </ThemedLayout>
              </Authenticated>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users">
              <Route index element={<AdminGeneralOnly><UserList /></AdminGeneralOnly>} />
              <Route path="create" element={<AdminGeneralOnly><UserCreate /></AdminGeneralOnly>} />
            </Route>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="*" element={<ErrorComponent />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Refine>
    </HashRouter>
  );
};

export default App;

const authRpc = supabaseClient as unknown as {
  rpc: (name: string) => Promise<{ data: boolean | null; error?: { message: string } | null }>;
};

const FirstLoginGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [mustChange, setMustChange] = React.useState<boolean>();

  React.useEffect(() => {
    if (location.pathname === "/change-password") {
      setMustChange(false);
      return;
    }
    void authRpc.rpc("get_must_change_password").then(({ data, error }) => {
      setMustChange(error ? false : data === true);
    });
  }, [location.pathname]);

  if (mustChange === undefined) return null;
  return mustChange ? <Navigate to="/change-password" replace /> : <>{children}</>;
};

const AdminGeneralOnly: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: identity } = useGetIdentity<UserProfile>();
  if (!identity) return null;
  return identity.role === "admin_general" ? <>{children}</> : <Navigate to="/" replace />;
};