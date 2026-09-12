import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const { ready, user } = useAuth();
  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#3f7a3f" />
      </View>
    );
  }
  return <Redirect href={user ? "/(app)/map" : "/login"} />;
}
