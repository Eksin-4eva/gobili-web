import { useLocation, useRoutes } from "react-router";
import routes from "~react-pages";
import AppShell from "@/components/layout/AppShell";

export default function App() {
  const location = useLocation();
  const element = useRoutes(routes, location);
  const bare =
    location.pathname === "/login" || location.pathname === "/register";

  if (!element) return null;
  if (bare) return element;
  return <AppShell>{element}</AppShell>;
}
