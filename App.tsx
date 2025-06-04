import { Inter_400Regular } from "@expo-google-fonts/inter";
import {
  Poppins_400Regular,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-gesture-handler";

import AddScreen from "./screens/AddScreen";
import HistoryScreen from "./screens/HistoryScreen";
import MeasurementsScreen from "./screens/MeasurementsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ProgressScreen from "./screens/ProgressScreen";
import WeightInputScreen from "./screens/WeightInputScreen";
import { colors } from "./styles/colors";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para as telas de input
function AddStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          fontFamily: "Poppins_700Bold",
          fontSize: 18,
          color: colors.dark,
        },
        headerTintColor: colors.primary,
        headerBackTitle: "",
      }}
    >
      <Stack.Screen
        name="AddMain"
        component={AddScreen}
        options={{
          title: "Adicionar",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WeightInput"
        component={WeightInputScreen}
        options={{
          title: "Registrar Peso",
        }}
      />
      <Stack.Screen
        name="MeasurementsInput"
        component={MeasurementsScreen}
        options={{
          title: "Registrar Medidas",
        }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator para Progresso (incluindo Profile)
function ProgressStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          fontFamily: "Poppins_700Bold",
          fontSize: 18,
          color: colors.dark,
        },
        headerTintColor: colors.primary,
        headerBackTitle: "",
      }}
    >
      <Stack.Screen
        name="ProgressMain"
        component={ProgressScreen}
        options={{
          title: "Progresso",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Meu Perfil",
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Inter_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "Progresso") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Adicionar") {
              iconName = focused ? "add-circle" : "add-circle-outline";
            } else if (route.name === "Historico") {
              iconName = focused ? "list" : "list-outline";
            }

            return <Ionicons name={iconName!} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.lightGray,
            paddingBottom: 8,
            height: 60,
          },
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            fontFamily: "Poppins_700Bold",
            fontSize: 18,
            color: colors.dark,
          },
        })}
      >
        <Tab.Screen
          name="Progresso"
          component={ProgressStackNavigator}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Adicionar"
          component={AddStackNavigator}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Historico" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
