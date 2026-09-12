import { useCallback, useState } from "react";
import { View, Text, Pressable, SectionList, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";

const sevColor = (s: string) => (s === "high" ? "#e5443c" : s === "low" ? "#e0c020" : "#e8863c");

export default function Reports() {
  const { farms, signOut } = useAuth();
  const farm = farms[0] ?? null;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!farm) return;
    try {
      const data = await api<{ reports: Report[] }>(`/api/mobile/reports?farmId=${farm.id}`);
      setReports(data.reports);
    } finally {
      setLoading(false);
    }
  }, [farm]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sections = [
    { title: "Needs help", data: reports.filter((r) => r.status === "open") },
    { title: "Assigned", data: reports.filter((r) => r.status === "assigned") },
    { title: "Saved", data: reports.filter((r) => r.status === "resolved") },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100">
        <View>
          <Text className="text-[18px] font-semibold tracking-tight text-neutral-900">Reports</Text>
          <Text className="text-[12px] text-neutral-400">{farm?.name ?? ""}</Text>
        </View>
        <Pressable onPress={signOut} hitSlop={10}>
          <Text className="text-[13px] text-neutral-400">Sign out</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3f7a3f" />
        </View>
      ) : reports.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="leaf-outline" size={40} color="#c9c4bb" />
          <Text className="mt-3 text-[14px] text-neutral-400 text-center">
            No reports yet. Head to the Map tab and tap “Report a crop” to photograph a problem.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderSectionHeader={({ section }) => (
            <Text className="px-4 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400 bg-white">
              {section.title} · {section.data.length}
            </Text>
          )}
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 px-4 py-3 border-b border-neutral-50">
              {item.photo ? (
                <Image source={{ uri: item.photo }} className="h-12 w-12 rounded-lg" />
              ) : (
                <View className="h-12 w-12 rounded-lg items-center justify-center" style={{ backgroundColor: sevColor(item.severity) + "22" }}>
                  <View className="h-3 w-3 rounded-full" style={{ backgroundColor: sevColor(item.severity) }} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-[14px] font-medium text-neutral-900">
                  {item.issue || item.crop || "Crop issue"}
                </Text>
                <Text className="text-[12px] text-neutral-400">
                  {item.crop ? `${item.crop} · ` : ""}
                  <Text style={{ color: sevColor(item.severity) }}>{item.severity}</Text>
                  {item.assignedTo ? ` · ${item.assignedTo.name}` : ""}
                </Text>
              </View>
              <Text className="text-[11px] text-neutral-300">
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
