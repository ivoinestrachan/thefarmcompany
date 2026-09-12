import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Image, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const SEVERITIES = ["low", "medium", "high"] as const;

export default function Capture() {
  const router = useRouter();
  const { farms } = useAuth();
  const farm = farms[0] ?? null;

  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [crop, setCrop] = useState("");
  const [issue, setIssue] = useState("");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("medium");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Grab GPS as soon as the screen opens so the pin lands where you stand.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera needed", "Allow camera access to photograph the crop.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5, exif: false });
    if (res.canceled || !res.assets[0]?.base64) return;
    setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
  }

  async function submit() {
    if (!farm) return;
    if (!coords) {
      Alert.alert("No location yet", "Waiting for GPS — try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/mobile/reports", {
        method: "POST",
        body: JSON.stringify({
          farmId: farm.id,
          lat: coords.lat,
          lng: coords.lng,
          crop,
          issue,
          severity,
          note,
          photo,
        }),
      });
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Try again.");
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100">
        <Text className="text-[17px] font-semibold tracking-tight text-neutral-900">Report a crop</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color="#9ca3af" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 16 }}>
        {photo ? (
          <View className="relative">
            <Image source={{ uri: photo }} className="w-full h-56 rounded-xl" />
            <Pressable
              onPress={takePhoto}
              className="absolute bottom-2 right-2 bg-black/60 px-3 py-1.5 rounded-lg"
            >
              <Text className="text-white text-[12px]">Retake</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={takePhoto}
            className="h-56 rounded-xl border-2 border-dashed border-neutral-200 items-center justify-center"
          >
            <Ionicons name="camera" size={34} color="#2563eb" />
            <Text className="mt-2 text-[14px] font-medium text-farm">Take a photo of the crop</Text>
            <Text className="text-[12px] text-neutral-400 mt-0.5">Get in close on the affected leaves</Text>
          </Pressable>
        )}

        <View className="flex-row items-center gap-1.5 mt-3">
          <Ionicons name="location" size={14} color={coords ? "#2563eb" : "#9ca3af"} />
          <Text className="text-[12px] text-neutral-500">
            {coords ? `Pinned at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Getting your location…"}
          </Text>
        </View>

        <Text className="text-[12px] font-medium text-neutral-600 mt-5 mb-1">Crop</Text>
        <TextInput
          value={crop}
          onChangeText={setCrop}
          placeholder="e.g. Grapes"
          placeholderTextColor="#9ca3af"
          className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[15px] text-neutral-900"
        />

        <Text className="text-[12px] font-medium text-neutral-600 mt-4 mb-1">What's wrong?</Text>
        <TextInput
          value={issue}
          onChangeText={setIssue}
          placeholder="e.g. Powdery mildew"
          placeholderTextColor="#9ca3af"
          className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[15px] text-neutral-900"
        />

        <Text className="text-[12px] font-medium text-neutral-600 mt-4 mb-1">How bad is it?</Text>
        <View className="flex-row gap-2">
          {SEVERITIES.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSeverity(s)}
              className="flex-1 h-11 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: severity === s ? "#2563eb" : "#fff",
                borderColor: severity === s ? "#2563eb" : "#e5e5e5",
              }}
            >
              <Text
                className="text-[13px] font-medium capitalize"
                style={{ color: severity === s ? "#fff" : "#525252" }}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-[12px] font-medium text-neutral-600 mt-4 mb-1">Notes</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Anything the laborer should know…"
          placeholderTextColor="#9ca3af"
          multiline
          className="min-h-[80px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[15px] text-neutral-900"
          style={{ textAlignVertical: "top" }}
        />

        <Pressable
          onPress={submit}
          disabled={busy}
          className="mt-6 h-12 rounded-xl bg-farm items-center justify-center active:opacity-90"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-[15px] font-medium">Add to map</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
