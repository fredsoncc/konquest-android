import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // Jogo de tela cheia, sem tab bar
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
