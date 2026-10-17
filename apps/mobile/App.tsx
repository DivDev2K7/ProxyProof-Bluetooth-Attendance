import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppText } from "./src/components/AppText";
import { StudentHomeScreen } from "./src/screens/StudentHomeScreen";
import { colors } from "./src/theme";

export type StudentTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

function SimpleTabScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.placeholder}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" color={colors.textMuted} style={styles.placeholderSubtitle}>
        {subtitle}
      </AppText>
    </View>
  );
}

function AppNavigation() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface },
      }}
    >
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.orange,
          tabBarInactiveTintColor: colors.textDim,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size, focused }) => {
            const icons: Record<
              keyof StudentTabParamList,
              [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]
            > = {
              Home: ["home", "home-outline"],
              History: ["time", "time-outline"],
              Profile: ["person", "person-outline"],
            };
            const [active, inactive] = icons[route.name];
            return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={StudentHomeScreen} />
        <Tab.Screen name="History">
          {() => <SimpleTabScreen title="Your history" subtitle="Your club attendance timeline will live here." />}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => <SimpleTabScreen title="Your profile" subtitle="Manage your account and registered device." />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigation />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  tabBar: {
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "rgba(10, 10, 13, 0.98)",
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  tabLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: colors.background,
  },
  placeholderSubtitle: {
    marginTop: 10,
    textAlign: "center",
  },
});
