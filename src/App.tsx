import React from "react";
import { Refine, Authenticated } from "@refinedev/core";
import { ThemedLayout, ErrorComponent, useNotificationProvider } from "@refinedev/antd";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/authProvider";
import { accessControlProvider } from "./providers/accessControl";
import { dataProvider } from "./providers/data";

import { LoginPage } from "./modules/auth";
import { UserList, UserCreate } from "./modules/users";
import { DashboardPage } from "./modules/dashboard";
import { Header } from "./components";
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
                  <Outlet />
                </ThemedLayout>
              </Authenticated>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users">
              <Route index element={<UserList />} />
              <Route path="create" element={<UserCreate />} />
            </Route>
            <Route path="*" element={<ErrorComponent />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Refine>
    </HashRouter>
  );
};

export default App;