import type { Metadata } from "next";
import SensorDashboard from "@/components/SensorDashboard";

export const metadata: Metadata = {
  title: "Soil Telemetry · The Farming Company",
  description:
    "Soil monitoring dashboard — moisture, temperature, pH, salinity and nutrients across your fields in real time.",
};

export default function DashboardPage() {
  return <SensorDashboard />;
}
