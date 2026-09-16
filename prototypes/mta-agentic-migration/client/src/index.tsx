import "@patternfly/react-core/dist/styles/base.css";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRoot } from "react-dom/client";
import ArrowLeftIcon from "@patternfly/react-icons/dist/esm/icons/arrow-left-icon";

import App from "@app/App";
import { AuthProvider } from "@app/auth";
import { PUBLIC_PATH } from "@app/publicPath";

import "@app/dayjs";
import "@app/i18n";
import "@app/yup";
import "@app/code-editor";
import "@app/axios-auth";

const queryClient = new QueryClient();

// Points back at the launcher root, e.g. "/AppDev-UX-Prototypes/". Only shown
// when this prototype is actually hosted under a subpath (not local dev).
const launcherUrl = PUBLIC_PATH.replace(/mta-agentic-migration\/$/, "");
const isHostedUnderLauncher = launcherUrl !== PUBLIC_PATH;

const Root: React.FC = () => (
  <>
    {isHostedUnderLauncher && (
      <div
        style={{
          backgroundColor: "#151515",
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <a
          href={launcherUrl}
          style={{
            color: "white",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "14px",
          }}
        >
          <ArrowLeftIcon /> Back to all prototypes
        </a>
      </div>
    )}
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AuthProvider>
  </>
);

const renderApp = () => {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(<Root />);
};

// Mock Service Worker is normally only bundled in development builds (see the
// dead-code-eliminated branch below), but we always attempt to load it here so
// that a demo/local deployment can enable it via the MOCK env var even when
// running the production build (e.g. MOCK=full in a container).
import("./mocks/browser")
  .then((browserMocks) => {
    if (browserMocks.config.enabled) {
      return browserMocks.worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: `${PUBLIC_PATH}mockServiceWorker.js` },
      });
    }
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start mock service worker", err);
  })
  .finally(renderApp);
