#  PetStore Mobile App — Deber 6

Aplicación móvil desarrollada en **React Native (Expo)** con una interfaz neobrutalista/editorial de alto contraste, estilizada con **Uniwind** y enriquecida con múltiples animaciones interactivas de **Lottie**. La aplicación se conecta de forma segura a **Supabase** para gestionar la autenticación mixta, el inicio de sesión social y un CRUD completo.

---

##  Características Principales

1. **Autenticación Mixta (Supabase Auth):**
   - Registro e inicio de sesión con correo y contraseña.
   - Recuperación de contraseña mediante enlaces dinámicos (`resetPasswordForEmail`).
   - Inicio de sesión social con **Google OAuth** configurado mediante Supabase y credenciales de Google Cloud Console.

2. **Gestión de Perfil y Seguridad:**
   - Visualización de datos de sesión en tiempo real.
   - Opción para realizar un **cambio de contraseña** seguro dentro de la aplicación (`supabase.auth.updateUser`).
   - Cierre de sesión (`signOut`).

3. **Módulo CRUD Completo (Parte 2):**
   - Gestión de registros de mascotas (Crear, Leer, Actualizar y Eliminar).
   - Políticas de seguridad a nivel de filas (**RLS**) implementadas en Supabase para proteger los datos de cada usuario.

4. **Diseño de Interfaz Avanzado (Parte 3):**
   - Implementación estricta de **Uniwind** para un diseño responsivo y limpio.
   - Múltiples recursos interactivos de **Lottie**:
     - Gato interactivo en el inicio de sesión que sigue el foco y la longitud del correo, y se cubre los ojos al tipear la contraseña.
     - Animación de fondo fluido/ondas (`dripping.json`).
     - Indicadores de carga personalizados (`pet-loading.json`).
     - Estados vacíos e ilustraciones complementarias (`cat-footer.json`).
   - Transiciones de pantalla fluidas con cortinas líquidas animadas.

---

##  Tecnologías y Librerías Utilizadas

- **Framework:** React Native (Expo SDK)
- **Estilos:** Uniwind (Tailwind CSS para React Native)
- **Backend & Auth:** Supabase (`@supabase/supabase-js`)
- **Animaciones:** `lottie-react-native`
- **Navegación:** `@react-navigation/native` & `@react-navigation/bottom-tabs`
- **Iconos:** `@expo/vector-icons` (Ionicons)

---

##  Estructura del Proyecto

```text
pet-store-app/
├── assets/
│   └── animations/          # Archivos .json de Lottie (gato, ondas, carga)
├── src/
│   ├── components/          # Componentes reutilizables y cortina de transición
│   ├── config/              # Configuración del cliente Supabase
│   ├── navigation/          # Enrutadores (RootNavigator, MainNavigator)
│   └── screens/
│       ├── auth/            # Pantallas de Login y Register
│       └── main/            # Pantallas de Mascotas (CRUD) y Perfil
├── App.tsx                  # Punto de entrada de la aplicación
└── README.md
```

---

## ⚙️ Configuración y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/pet-store-app.git
cd pet-store-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Ejecutar la aplicación
```bash
npx expo start
```
Escanea el código QR con la aplicación **Expo Go** en tu dispositivo móvil.

---

## Esquema de Base de Datos (Supabase SQL)

Ejecuta el siguiente script en el editor SQL de Supabase para habilitar la tabla y sus políticas de seguridad:

```sql
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  age TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pets" ON public.pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pets" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pets" ON public.pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pets" ON public.pets FOR DELETE USING (auth.uid() = user_id);
```

---

## Video Demostrativo
https://youtu.be/HbjLedAVkx4 
