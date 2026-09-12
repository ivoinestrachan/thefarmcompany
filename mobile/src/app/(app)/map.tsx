import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// react-native-maps is native-only — avoid importing it on web (Expo web).
const isWeb = Platform.OS === "web";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Maps = isWeb ? null : require("react-native-maps");
const MapView = Maps?.default;
const Marker = Maps?.Marker;
const UrlTile = Maps?.UrlTile;
const Polygon = Maps?.Polygon;
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const sevColor = (s: string) => (s === "high" ? "#e5443c" : s === "low" ? "#e0c020" : "#e8863c");
const statusLabel = (s: string) => (s === "resolved" ? "Saved" : s === "assigned" ? "Assigned" : "Needs help");
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export default function MapScreen() {
  const router = useRouter();
  const { activeFarm: farm, farms, setActiveFarmId } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [farmMenu, setFarmMenu] = useState(false);

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

  const region = useMemo(() => {
    // Frame all field outlines if we have them, else fall back to farm center.
    const pts = (farm?.fields ?? []).flatMap((f) => f.coords);
    if (pts.length >= 2) {
      const lats = pts.map((p) => p.latitude);
      const lngs = pts.map((p) => p.longitude);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.4),
        longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.4),
      };
    }
    return {
      latitude: farm?.center.lat ?? 38.38,
      longitude: farm?.center.lng ?? -122.24,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [farm]);

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
      {isWeb ? (
        // Web preview: the native map is native-only, so show a report list.
        <ScrollView className="flex-1 bg-[#eef2ee]" contentContainerStyle={{ padding: 16, paddingTop: 90 }}>
          <Text className="text-[12px] text-neutral-500 mb-3">
            Map is native-only — this is a web preview of the reports.
          </Text>
          {reports.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setSelected(r)}
              className="flex-row items-center gap-3 bg-white rounded-xl p-3 mb-2"
            >
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: sevColor(r.severity) }} />
              <Text className="flex-1 text-[14px] font-medium text-neutral-900">
                {r.issue || r.crop || "Crop issue"}
              </Text>
              <Text className="text-[12px] text-neutral-400">{statusLabel(r.status)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <MapView style={{ flex: 1 }} mapType="standard" initialRegion={region}>
          <UrlTile urlTemplate={ESRI} maximumZ={19} zIndex={-1} />
          {(farm?.fields ?? []).map((fl) =>
            fl.coords.length >= 3 ? (
              <Polygon
                key={fl.id}
                coordinates={fl.coords}
                strokeColor={fl.color}
                strokeWidth={3}
                fillColor={rgba(fl.color, 0.25)}
              />
            ) : null
          )}
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
      )}

      {/* Header — tap to switch farms */}
      <SafeAreaView className="absolute top-0 left-0 right-0" pointerEvents="box-none">
        <Pressable
          onPress={() => setFarmMenu(true)}
          className="mx-4 mt-2 flex-row items-center rounded-xl bg-white/95 px-4 py-2.5 shadow"
          pointerEvents="auto"
        >
          <View className="flex-1">
            <Text className="text-[15px] font-semibold tracking-tight text-neutral-900">{farm?.name ?? "Your farm"}</Text>
            <Text className="text-[11.5px] text-neutral-500">
              {loading ? "Loading…" : `${reports.filter((r) => r.status !== "resolved").length} open · ${reports.length} total`}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#6b7280" />
        </Pressable>
      </SafeAreaView>

      {/* Farm switcher */}
      <Modal visible={farmMenu} transparent animationType="fade" onRequestClose={() => setFarmMenu(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setFarmMenu(false)}>
          <SafeAreaView>
            <Pressable className="mx-4 mt-14 rounded-2xl bg-white p-2" onPress={(e) => e.stopPropagation()}>
              <Text className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                Your farms
              </Text>
              {farms.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => { setActiveFarmId(f.id); setFarmMenu(false); }}
                  className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:bg-neutral-50"
                >
                  <View className="h-8 w-8 rounded-lg bg-farm/10 items-center justify-center">
                    <Ionicons name="leaf" size={16} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-medium text-neutral-900">{f.name}</Text>
                    <Text className="text-[11.5px] text-neutral-400">
                      {f.location ?? ""}{f.location ? " · " : ""}{f.fields.length} fields
                    </Text>
                  </View>
                  {f.id === farm?.id && <Ionicons name="checkmark" size={18} color="#2563eb" />}
                </Pressable>
              ))}
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>

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
                  {selected?.assignedTo?.id === m.id && <Ionicons name="checkmark" size={20} color="#2563eb" />}
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
