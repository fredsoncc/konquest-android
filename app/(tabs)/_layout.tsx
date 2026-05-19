import { Tabs } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Jogo de tela cheia, sem tab bar
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Konquest",
        }}
      />
    </Tabs>
  );
}
