import { Navigate, useLocation } from "react-router";
import { isLoggedIn } from "@/lib/session";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return children;
}
