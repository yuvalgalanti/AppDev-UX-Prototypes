import * as React from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./Routes";
import { NotificationsProvider } from "./components/NotificationsContext";
import { TaskManagerProvider } from "./components/task-manager/TaskManagerContext";
import { DefaultLayout } from "./layout";

import "./app.css";

const App: React.FC = () => {
  const basename = "/AppDev-UX-Prototypes/mta-agentic-migration";
  const hosted = window.location.pathname.startsWith(basename);

  return (
    <BrowserRouter basename={hosted ? basename : undefined}>
      {hosted && (
        <div style={{ background: "#151515", padding: "6px 16px" }}>
          <a href="/AppDev-UX-Prototypes/" style={{ color: "white" }}>
            ← Back to all prototypes
          </a>
        </div>
      )}
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
