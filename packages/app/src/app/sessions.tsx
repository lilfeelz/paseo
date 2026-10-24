import { HostRouteBootstrapBoundary } from "@/components/host-route-bootstrap-boundary";
import { useLocalSearchParams } from "expo-router";
import { SessionsScreen } from "@/screens/sessions-screen";

export default function SessionsRoute() {
  const params = useLocalSearchParams<{ overlay?: string }>();
  return (
    <HostRouteBootstrapBoundary>
      <SessionsScreen overlay={params.overlay === "1"} />
    </HostRouteBootstrapBoundary>
  );
}
