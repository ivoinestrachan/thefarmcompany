import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const sevColor = (s: string) => (s === "high" ? "#e5443c" : s === "low" ? "#e0c020" : "#e8863c");
const statusLabel = (s: string) => (s === "resolved" ? "Saved" : s === "assigned" ? "Assigned" : "Needs help");

export default function MapScreen() {
  const router = useRouter();
  const { farms } = useAuth();
  const farm = farms[0] ?? null;
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [assigning, setAssigning] = useState(false);
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

  const region = useMemo(
    () => ({
      latitude: farm?.center.lat ?? 38.38,
      longitude: farm?.center.lng ?? -122.24,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }),
    [farm]
  );

  async function assignTo(memberId: string | null) {
    if (!selected) return;
    const data = await api<{ report: Report }>("/api/mobile/reports", {
      method: "PATCH",
      body: JSON.stringify({ id: selected.id, assignedToId: memberId }),
    });
    setReports((rs) => rs.map((r) => (r.id === data.report.id ? data.report : r)));
    setSelected(data.report);
    setAssigning(false);
  }

  async function resolve() {
    if (!selected) return;
    const data = await api<{ report: Report }>("/api/mobile/reports", {
      method: "PATCH",
      body: JSON.stringify({ id: selected.id, status: "resolved" }),
    });
    setReports((rs) => rs.map((r) => (r.id === data.report.id ? data.report : r)));
    setSelected(data.report);
  }

  return (
    <View className="flex-1 bg-black">
      <MapView style={{ flex: 1 }} mapType="standard" initialRegion={region}>
        <UrlTile urlTemplate={ESRI} maximumZ={19} zIndex={-1} />
        {reports.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            pinColor={sevColor(r.severity)}
            opacity={r.status === "resolved" ? 0.5 : 1}
            onPress={() => setSelected(r)}
          />
        ))}
      </MapView>

      {/* Header */}
      <SafeAreaView className="absolute top-0 left-0 right-0" pointerEvents="box-none">
        <View className="mx-4 mt-2 rounded-xl bg-white/95 px-4 py-2.5 shadow" pointerEvents="auto">
          <Text className="text-[15px] font-semibold tracking-tight text-neutral-900">{farm?.name ?? "Your farm"}</Text>
          <Text className="text-[11.5px] text-neutral-500">
            {loading ? "Loading…" : `${reports.filter((r) => r.status !== "resolved").length} open · ${reports.length} total`}
          </Text>
        </View>
      </SafeAreaView>

      {/* Report a problem (camera) */}
      <Pressable
        onPress={() => router.push("/capture")}
        className="absolute bottom-6 right-5 h-14 flex-row items-center gap-2 rounded-full bg-farm px-5 shadow-lg active:opacity-90"
      >
        <Ionicons name="camera" color="#fff" size={22} />
        <Text className="text-white font-semibold text-[15px]">Report a crop</Text>
      </Pressable>

      {/* Selected report card */}
      {selected && (
        <SafeAreaView className="absolute bottom-0 left-0 right-0" pointerEvents="box-none">
          <View className="mx-3 mb-3 rounded-2xl bg-white p-4 shadow-2xl" pointerEvents="auto">
            <View className="flex-row items-start gap-3">
              {selected.photo ? (
                <Image source={{ uri: selected.photo }} className="h-16 w-16 rounded-lg" />
              ) : (
                <View className="h-16 w-16 rounded-lg bg-neutral-100" />
              )}
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-neutral-900">
                  {selected.issue || selected.crop || "Crop issue"}
                </Text>
                <Text className="text-[12px] text-neutral-500">
                  {selected.crop ? `${selected.crop} · ` : ""}
                  <Text style={{ color: sevColor(selected.severity) }}>{selected.severity} severity</Text>
                </Text>
                <Text className="text-[12px] text-neutral-400 mt-0.5">
                  {statusLabel(selected.status)}
                  {selected.assignedTo ? ` · ${selected.assignedTo.name}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#9ca3af" />
              </Pressable>
            </View>

            {selected.note ? <Text className="text-[13px] text-neutral-600 mt-2">{selected.note}</Text> : null}

            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => setAssigning(true)}
                className="flex-1 h-10 rounded-lg bg-farm items-center justify-center active:opacity-90"
              >
                <Text className="text-white font-medium text-[13px]">
                  {selected.assignedTo ? "Reassign" : "Send a laborer"}
                </Text>
              </Pressable>
              {selected.status !== "resolved" && (
                <Pressable
                  onPress={resolve}
                  className="h-10 px-4 rounded-lg border border-neutral-200 items-center justify-center"
                >
                  <Text className="text-neutral-700 font-medium text-[13px]">Mark saved</Text>
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Assign modal */}
      <Modal visible={assigning} transparent animationType="slide" onRequestClose={() => setAssigning(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setAssigning(false)}>
          <Pressable className="bg-white rounded-t-2xl p-4" onPress={(e) => e.stopPropagation()}>
            <Text className="text-[16px] font-semibold text-neutral-900 mb-1">Send a laborer</Text>
            <Text className="text-[12.5px] text-neutral-500 mb-3">Pick who goes to treat this crop.</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {(farm?.team ?? []).map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => assignTo(m.id)}
                  className="flex-row items-center gap-3 py-3 border-b border-neutral-100"
                >
                  <View className="h-9 w-9 rounded-full bg-farm items-center justify-center">
                    <Text className="text-white font-semibold">{m.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-medium text-neutral-900">{m.name}</Text>
                    <Text className="text-[12px] text-neutral-400 capitalize">{m.role}</Text>
                  </View>
                  {selected?.assignedTo?.id === m.id && <Ionicons name="checkmark" size={20} color="#3f7a3f" />}
                </Pressable>
              ))}
              {selected?.assignedTo && (
                <Pressable onPress={() => assignTo(null)} className="py-3">
                  <Text className="text-[13px] text-red-600">Unassign</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
