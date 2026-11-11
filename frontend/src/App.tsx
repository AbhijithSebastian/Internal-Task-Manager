import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AppRoutes } from "@/routes";

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
