import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { supabase } from '../../config/supabase';
import { signInWithGoogle } from '../../services/auth';
import LiquidTransitionCurtain, { LiquidCurtainRef } from '../../components/common/LiquidTransitionCurtain';
import AnimatedFeedback, { AnimatedFeedbackRef } from '../../components/common/AnimatedFeedback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const curtainRef = useRef<LiquidCurtainRef>(null);
  const feedbackRef = useRef<AnimatedFeedbackRef>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const catRef = useRef<LottieView>(null);

  // Al montar: la mascota se asoma y mueve sus bigotes
  useEffect(() => {
    const timer = setTimeout(() => {
      catRef.current?.play(0, 55);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Seguimiento ocular conforme se escribe el correo
  const handleEmailChange = (text: string) => {
    setEmail(text);
    const progress = Math.min(text.length / 12, 1);
    const targetFrame = Math.floor(65 + progress * 20);
    catRef.current?.play(targetFrame, targetFrame);
  };

  const handleEmailFocus = () => {
    setIsPasswordFocused(false);
    catRef.current?.play(21, 65);
  };

  // El gato se agacha u oculta detrás de la tarjeta al enfocar contraseña
  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
    if (!showPassword) {
      catRef.current?.play(110, 131);
    } else {
      catRef.current?.play(21, 45);
    }
  };

  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
    catRef.current?.play(21, 45);
  };

  // Alternar vista de contraseña (si está visible, el gato se asoma a mirar)
  const toggleShowPassword = () => {
    const willShow = !showPassword;
    setShowPassword(willShow);
    if (isPasswordFocused || password.length > 0) {
      catRef.current?.play(willShow ? 21 : 110, willShow ? 45 : 131);
    }
  };

  // Transición con cortina hacia la pantalla de registro
  const handleGoToRegister = () => {
    curtainRef.current?.startTransition(() => {
      navigation.navigate('Register' as never);
    });
  };

  // Autenticación tradicional con Email / Password
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Faltan tus datos',
        message: 'Ingresa tu correo y contraseña para continuar.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) throw error;
    } catch (err: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No pudimos iniciar sesión',
        message: err.message || 'Revisa tu correo y contraseña e inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Recuperación de clave por correo electrónico
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Correo requerido',
        message: 'Ingresa tu correo para enviarte el enlace de recuperación.',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL('reset-password'),
      });
      if (error) throw error;
      feedbackRef.current?.show({
        type: 'success',
        title: '¡Correo enviado!',
        message: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
      });
    } catch (err: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo enviar el correo',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Social Login con Google OAuth vía Supabase
  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      feedbackRef.current?.show({
        type: 'error',
        title: 'Error con Google',
        message,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      {/* 1. Fondo de ondas líquidas Lottie */}
      <View style={styles.liquidBackgroundWrapper} pointerEvents="none">
        <LottieView
          source={require('../../../assets/animations/dripping.json')}
          autoPlay={true}
          loop={true}
          speed={0.65}
          style={styles.liquidLottie}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Contenedor del Gato Interactivo */}
        <View style={styles.catWrapper}>
          <LottieView
            ref={catRef}
            source={require('../../../assets/animations/cat-movement.json')}
            style={styles.catLottie}
            autoPlay={false}
            loop={false}
          />
        </View>

        {/* Tarjeta del Formulario con clases de Uniwind */}
        <View className="w-full bg-white rounded-3xl p-6 border-2 border-slate-900 shadow-md">
          <Text className="text-2xl font-black text-slate-900 text-center tracking-tight">
            ¡Hola de nuevo!
          </Text>
          <Text className="text-xs text-slate-500 text-center mt-1 mb-5 font-medium leading-4">
            Nos alegra verte. Ingresa tus datos para continuar.
          </Text>

          {/* Input Email */}
          <View className="w-full flex-row items-center bg-white border-2 border-slate-900 rounded-full px-5 py-3 mb-3">
            <TextInput
              value={email}
              onChangeText={handleEmailChange}
              onFocus={handleEmailFocus}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-slate-900 text-sm font-semibold p-0"
            />
          </View>

          {/* Input Contraseña */}
          <View className="w-full flex-row items-center bg-white border-2 border-slate-900 rounded-full px-5 py-3 mb-2">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              className="flex-1 text-slate-900 text-sm font-semibold p-0"
            />
            <TouchableOpacity onPress={toggleShowPassword} className="p-1">
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          {/* Olvidé mi contraseña */}
          <TouchableOpacity onPress={handleForgotPassword} className="self-center mt-1 mb-4">
            <Text className="text-xs text-slate-500 font-medium underline">
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          {/* Botón Salmón Principal */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
            className="w-full bg-[#fca5a5] rounded-full py-3.5 items-center justify-center shadow-sm"
          >
            {loading ? (
              <LottieView
                source={require('../../../assets/animations/pet-loading.json')}
                autoPlay
                loop
                style={{ width: 26, height: 26 }}
              />
            ) : (
              <Text className="text-white text-base font-extrabold tracking-wide">
                Entrar
              </Text>
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View className="w-full flex-row items-center my-4">
            <View className="flex-1 h-[1.5px] bg-slate-200" />
            <Text className="text-slate-400 text-xs font-bold mx-3">o</Text>
            <View className="flex-1 h-[1.5px] bg-slate-200" />
          </View>

          {/* Botón a Registro */}
          <TouchableOpacity
            onPress={handleGoToRegister}
            activeOpacity={0.85}
            className="w-full bg-slate-900 rounded-full py-3.5 items-center justify-center mb-3"
          >
            <Text className="text-white text-sm font-bold">Crear una cuenta</Text>
          </TouchableOpacity>

          {/* Botón Social Login: Google OAuth */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
            className="w-full flex-row bg-white border-2 border-slate-900 rounded-full py-3.5 items-center justify-center"
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <>
                <Ionicons name="logo-google" size={17} color="#0f172a" style={{ marginRight: 8 }} />
                <Text className="text-slate-900 text-sm font-bold">Continuar con Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cortina líquida de transición */}
      <LiquidTransitionCurtain ref={curtainRef} />
      <AnimatedFeedback ref={feedbackRef} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  liquidBackgroundWrapper: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.72,
    zIndex: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  liquidLottie: {
    width: SCREEN_WIDTH * 1.85,
    height: SCREEN_WIDTH * 1.85,
    position: 'absolute',
    top: -SCREEN_WIDTH * 0.18,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 35,
    paddingBottom: 40,
    zIndex: 10,
  },
  catWrapper: {
    height: 135,
    marginBottom: -14,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  catLottie: {
    width: 220,
    height: 170,
  },
});