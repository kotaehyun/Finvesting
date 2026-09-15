import { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc, API_URL } from "./src/trpc";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

function Dashboard() {
  const { data, isLoading, error } = trpc.dashboard.overview.useQuery();
  if (isLoading) return <Text>불러오는 중…</Text>;
  if (error) return <Text>오류: {error.message}</Text>;
  if (!data) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>{data.month}</Text>
      <View style={{ borderWidth: 1, borderColor: "#8884", borderRadius: 10, padding: 14 }}>
        <Text style={{ opacity: 0.7 }}>현재 순자산</Text>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>{won(data.assets.net)}</Text>
      </View>
      <View style={{ borderWidth: 1, borderColor: "#8884", borderRadius: 10, padding: 14 }}>
        <Text style={{ opacity: 0.7 }}>이번 달 소비율 / 저축·투자율</Text>
        <Text style={{ fontSize: 20 }}>{(data.cashflow.spendingRate * 100).toFixed(1)}% / {(data.cashflow.savingRate * 100).toFixed(1)}%</Text>
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [client] = useState(() => trpc.createClient({ links: [httpBatchLink({ url: `${API_URL}/api/trpc`, transformer: superjson })] }));
  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <Dashboard />
        </SafeAreaView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
