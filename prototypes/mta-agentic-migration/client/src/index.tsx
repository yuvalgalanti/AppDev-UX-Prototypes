import "@patternfly/react-core/dist/styles/base.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRoot } from "react-dom/client";

import App from "@app/App";
import { AuthProvider } from "@app/auth";

import "@app/dayjs";
import "@app/i18n";
import "@app/yup";
import "@app/code-editor";
import "@app/axios-auth";

const queryClient = new QueryClient();

const renderApp = () => {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AuthProvider>
  );
};

// Mock Service Worker is normally only bundled in development builds (see the
// dead-code-eliminated branch below), but we always attempt to load it here so
// that a demo/local deployment can enable it via the MOCK env var even when
// running the production build (e.g. MOCK=full in a container).
import("./mocks/browser")
  .then((browserMocks) => {
    if (browserMocks.config.enabled) {
      return browserMocks.worker.start({ onUnhandledRequest: "bypass" });
    }
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start mock service worker", err);
  })
  .finally(renderApp);
