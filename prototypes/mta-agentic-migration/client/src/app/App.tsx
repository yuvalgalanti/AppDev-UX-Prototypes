import * as React from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./Routes";
import { NotificationsProvider } from "./components/NotificationsContext";
import { TaskManagerProvider } from "./components/task-manager/TaskManagerContext";
import { DefaultLayout } from "./layout";
import { PUBLIC_PATH } from "./publicPath";

import "./app.css";

// Strip the trailing slash: react-router-dom v5's `basename` should not end
// with one (e.g. "/AppDev-UX-Prototypes/mta-agentic-migration", not ".../").
const ROUTER_BASENAME = PUBLIC_PATH.replace(/\/$/, "") || "/";

const App: React.FC = () => {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <NotificationsProvider>
        <TaskManagerProvider>
          <DefaultLayout>
            <AppRoutes />
          </DefaultLayout>
        </TaskManagerProvider>
      </NotificationsProvider>
    </BrowserRouter>
  );
};

export default App;
