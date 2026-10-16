import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import TipProvider from "@/components/tip";
import { CurrentUserProvider } from "@/hooks/useCurrentUser";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider>
        <TipProvider />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CurrentUserProvider>
    </QueryClientProvider>
  </StrictMode>,
);
