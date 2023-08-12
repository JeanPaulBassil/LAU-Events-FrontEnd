import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import AdminHome from './admin/AdminHome';
import Signin from './Signin';
import OnBoarding from './OnBoarding';
import AdminClubs from './admin/Clubs';
import AdminEvents from './admin/Events';
import ClubDetails from './admin/ClubDetails';
import AddEvent from './admin/AddEvent';
import { UserRole } from '../models/user';
import Home from './user/Home';
import EventDetails from './admin/EventDetails';
import Verification from './Verification';
import Signup from './Signup';
import { EventDetails as UserEventDetails } from './user/EventDetails';
import UserHome from './user/UserLayout';
import DeclinedEvent from './user/DeclinedEvent';
import Logout from './user/Logout';

SplashScreen.preventAutoHideAsync();

const RootStack = createNativeStackNavigator();

export default function RootLayout() {
  const [firstLaunch, setFirstLaunch] = useState<boolean | null>(null);
  useEffect(() => {
    async function setData() {
      const appData = await AsyncStorage.getItem('appLaunched');
      if (appData === null) {
        setFirstLaunch(true);
        AsyncStorage.setItem('appLaunched', 'false');
      } else {
        setFirstLaunch(false);
        AsyncStorage.removeItem('appLaunched');
      }
    }
    setData();
  }, []);

  const { authState, signOut } = useAuth();

  const [fontsLoaded] = useFonts({
    'PT Sans': require('../../assets/fonts/PTSans-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  const [initialRouteName, setInitialRouteName] = useState<string>('OnBoarding');

  useEffect(() => {
    if (firstLaunch === null || firstLaunch === false) {
      if (authState.authenticated && authState.user) {
        if (authState.user.role === UserRole.ADMIN) {
          setInitialRouteName('AdminHome');
        } else {
          setInitialRouteName('UserHome');
        }
      } else {
        setInitialRouteName('Signup');
      }
    } else {
      setInitialRouteName('OnBoarding');
    }
  }, [authState.authenticated, authState.user, firstLaunch]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <RootStack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
        }}>
        {authState.authenticated ? (
          authState.user && authState.user.role === UserRole.ADMIN ? (
            <>
              <RootStack.Screen name="AdminHome" component={AdminHome} />
              <RootStack.Screen name="AdminClubs" component={AdminClubs} />
              <RootStack.Screen name="AdminEvents" component={AdminEvents} />
              <RootStack.Screen name="ClubDetails" component={ClubDetails} />
              <RootStack.Screen name="AddEvent" component={AddEvent} />
              <RootStack.Screen name="EventDetails" component={EventDetails} />
              <RootStack.Screen name="Logout" component={Logout} />
            </>
          ) : (
            <>
              <RootStack.Screen name="UserHome" component={UserHome} />
              <RootStack.Screen name="Home" component={Home} />
              <RootStack.Screen name="Logout" component={Logout} />
              <RootStack.Screen name="DeclinedEvents" component={DeclinedEvent} />
              <RootStack.Screen name="EventDetails" component={UserEventDetails} />
            </>
          )
        ) : (
          <>
            <RootStack.Screen name="Signin" component={Signin} />
            <RootStack.Screen name="Signup" component={Signup} />
            <RootStack.Screen name="Verification" component={Verification} />
            <RootStack.Screen name="OnBoarding" component={OnBoarding} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
