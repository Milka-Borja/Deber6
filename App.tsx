import './global.css';
import React, { useState, useEffect } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/config/supabase';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import MainNavigator from './src/navigation/AuthNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let hasReceivedAuthEvent = false;
    const handleRecoveryLink = async (url: string) => {
      if (!active) return;
      const parsed = Linking.parse(url);
      const destination = `${parsed.hostname ?? ''}/${parsed.path ?? ''}`.toLowerCase();
      if (!destination.includes('reset-password')) return;

      const showRecoveryError = (message: string) => {
        if (!active) return;
        setPasswordRecovery(true);
        setRecoveryError(message);
      };

      const queryString = url.split('?')[1]?.split('#')[0] ?? '';
      const hashString = url.split('#')[1] ?? '';
      const queryParams = new URLSearchParams(queryString);
      const hashParams = new URLSearchParams(hashString);
      const getParam = (name: string) => hashParams.get(name) ?? queryParams.get(name);
      const linkError = getParam('error_description') ?? getParam('error');

      if (linkError) {
        showRecoveryError(linkError);
        return;
      }

      const type = getParam('type');
      if (type && type !== 'recovery') {
        showRecoveryError('Este enlace no corresponde a una solicitud de cambio de contraseña.');
        return;
      }

      try {
        const code = getParam('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (active) {
            setPasswordRecovery(true);
            setRecoveryError(null);
          }
          return;
        }

        const accessToken = getParam('access_token');
        const refreshToken = getParam('refresh_token');
        if (!accessToken || !refreshToken) {
          throw new Error('El enlace está incompleto o venció. Solicita uno nuevo desde la pantalla de inicio.');
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        if (active) {
          setPasswordRecovery(true);
          setRecoveryError(null);
        }
      } catch (error: unknown) {
        showRecoveryError(
          error instanceof Error ? error.message : 'No se pudo validar el enlace de recuperación.',
        );
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      hasReceivedAuthEvent = true;
      if (!active) return;
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        setRecoveryError(null);
      } else if (event === 'SIGNED_OUT') {
        setPasswordRecovery(false);
        setRecoveryError(null);
      }
      setInitializing(false);
    });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleRecoveryLink(url);
    });

    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;
        if (!hasReceivedAuthEvent) setSession(session);

        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) await handleRecoveryLink(initialUrl);
      } catch (error: unknown) {
        if (!active) return;
        console.error('No se pudo recuperar la sesión guardada:', error);
        Alert.alert(
          'Error de sesión',
          error instanceof Error ? error.message : 'No se pudo recuperar la sesión guardada.',
        );
      } finally {
        if (active) setInitializing(false);
      }
    };

    void initialize();

    return () => {
      active = false;
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {passwordRecovery ? (
          <Stack.Screen name="ResetPassword">
            {() => (
              <ResetPasswordScreen
                recoveryError={recoveryError}
                onCancel={() => setPasswordRecovery(false)}
                onComplete={() => {
                  setRecoveryError(null);
                  setPasswordRecovery(false);
                }}
              />
            )}
          </Stack.Screen>
        ) : session && session.user ? (
          // Vista autenticada: pestañas de Catálogo y Perfil
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          // Flujo de Autenticación
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}