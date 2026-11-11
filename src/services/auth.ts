import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../config/supabase';

// Permite a WebBrowser cerrar la pestaña al completar el redirect en Android
WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  try {
    // 1. Obtener la redirectUri dinámica (detecta tu IP local en Expo Go)
    const redirectUri = Linking.createURL('auth/callback');
    console.log('>>> REDIRECT URI GENERADA:', redirectUri);

    // 2. Pedir la URL de autorización a Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true, // Crucial para obtener el data.url
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No se pudo generar la URL de autenticación.');

    // 3. Abrir el navegador seguro en el móvil
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (result.type !== 'success' || !result.url) {
      console.log('>>> LOGIN CANCELADO O CERRADO POR EL USUARIO');
      return { data: null, error: null };
    }

    const responseUrl = result.url;
    console.log('>>> RETORNO DE GOOGLE:', responseUrl);

    // 4. Caso A: Flujo Implícito (Tokens en el fragmento #)
    if (responseUrl.includes('#')) {
      const hash = responseUrl.split('#')[1];
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        return { data: sessionData, error: null };
      }
    }

    // 5. Caso B: Flujo PKCE (Código de autorización en query params ?)
    // Esta es la pieza clave que faltaba para que Android no se congele
    const parsedUrl = Linking.parse(responseUrl);
    const code = parsedUrl.queryParams?.code as string | undefined;

    if (code) {
      const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return { data: exchangeData, error: null };
    }

    throw new Error('No se encontraron tokens ni código en la respuesta.');
  } catch (err: any) {
    console.error('>>> ERROR EN SIGN IN:', err.message);
    throw err;
  }
};