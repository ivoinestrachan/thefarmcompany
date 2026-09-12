import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function AppLayout() {
  const { ready, user } = useAuth();
  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#374151",
        tabBarLabelStyle: { fontWeight: "600" },
        // Float the tab bar over the map: frosted glass, still readable.
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "rgba(0,0,0,0.08)",
          elevation: 0,
          backgroundColor: "transparent",
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
            {/* white scrim so icons/labels stay legible over the map */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.6)" }]} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
