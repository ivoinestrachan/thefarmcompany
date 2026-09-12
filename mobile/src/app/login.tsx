import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(app)/map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-8">
          <View className="h-11 w-11 rounded-xl bg-farm mb-4" />
          <Text className="text-[26px] font-semibold tracking-tight text-neutral-900">
            The Farming Company
          </Text>
          <Text className="mt-1 text-[14px] text-neutral-500">
            Sign in to report and dispatch across your fields.
          </Text>
        </View>

        <Text className="text-[12px] font-medium text-neutral-600 mb-1">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@farm.com"
          placeholderTextColor="#9ca3af"
          className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[15px] text-neutral-900 mb-3"
        />
        <Text className="text-[12px] font-medium text-neutral-600 mb-1">Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          className="h-12 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[15px] text-neutral-900"
        />

        {error && <Text className="mt-3 text-[13px] text-red-600">{error}</Text>}

        <Pressable
          onPress={submit}
          disabled={busy || !email || !password}
          className="mt-5 h-12 rounded-xl bg-farm items-center justify-center active:opacity-90"
          style={{ opacity: busy || !email || !password ? 0.5 : 1 }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-[15px] font-medium">Sign in</Text>}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
