import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../config/supabase';
import AnimatedFeedback, { AnimatedFeedbackRef } from '../../components/common/AnimatedFeedback';

interface Product {
  id: string;
  user_id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string | null;
  image_url: string | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectingImage, setSelectingImage] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const feedbackRef = React.useRef<AnimatedFeedbackRef>(null);

  const loadProducts = useCallback(async (): Promise<Product[]> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];

    const { data, error } = await supabase
      .from('products')
      .select('id, user_id, name, category, price, stock, description, image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }, []);

  const refreshProducts = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      setProducts(await loadProducts());
      return true;
    } catch (error: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudieron cargar los productos',
        message: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    loadProducts()
      .then((loaded) => setProducts(loaded))
      .catch((err) => feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudieron cargar los productos',
        message: err.message,
      }))
      .finally(() => setLoading(false));
  }, [loadProducts]);

  const resetForm = () => {
    setEditingProductId(null);
    setName('');
    setCategory('');
    setPrice('');
    setStock('');
    setDescription('');
    setImageUri(null);
    setImageBase64(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setStock(String(product.stock ?? 0));
    setDescription(product.description ?? '');
    setImageUri(product.image_url);
    setImageBase64(null);
    setModalVisible(true);
  };

  const setProductImage = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const image = result.assets[0];
    if (!image?.base64) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo leer la imagen',
        message: 'Elige otra imagen e inténtalo de nuevo.',
      });
      return;
    }

    setImageUri(image.uri);
    setImageBase64(image.base64);
    setImageMimeType(image.mimeType ?? 'image/jpeg');
  };

  const takePhoto = async () => {
    setSelectingImage(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        feedbackRef.current?.show({
          type: 'error',
          title: 'Permiso requerido',
          message: 'Permite el acceso a la cámara para tomar una foto.',
        });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      setProductImage(result);
    } catch (error: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo abrir la cámara',
        message: error.message,
      });
    } finally {
      setSelectingImage(false);
    }
  };

  const chooseFromGallery = async () => {
    setSelectingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        feedbackRef.current?.show({
          type: 'error',
          title: 'Permiso requerido',
          message: 'Permite el acceso a tus fotos para elegir una imagen.',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      setProductImage(result);
    } catch (error: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo abrir la galería',
        message: error.message,
      });
    } finally {
      setSelectingImage(false);
    }
  };

  const uploadImage = async (userId: string) => {
    if (!imageBase64) return imageUri;
    const extension = imageMimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filePath = `${userId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from('products')
      .upload(filePath, decode(imageBase64), { contentType: imageMimeType });
    if (error) throw error;
    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const saveProduct = async () => {
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (!name.trim() || !category.trim() || !price.trim() || !stock.trim()) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'Faltan datos',
        message: 'Ingresa nombre, categoría, precio y stock.',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuario no autenticado.');

      const productData = {
        name: name.trim(),
        category: category.trim(),
        price: parsedPrice,
        stock: parsedStock,
        description: description.trim() || null,
        image_url: await uploadImage(user.id),
      };

      if (editingProductId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProductId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...productData, user_id: user.id });
        if (error) throw error;
      }

      setModalVisible(false);
      resetForm();
      if (await refreshProducts()) {
        feedbackRef.current?.show({
          type: 'success',
          title: editingProductId ? 'Producto actualizado' : 'Producto publicado',
          message: `${productData.name} quedó guardado en tu catálogo.`,
        });
      }
    } catch (error: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo guardar el producto',
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (product: Product) => {
    Alert.alert('Eliminar', `¿Retirar "${product.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteProduct(product) }
    ]);
  };

  const deleteProduct = async (product: Product) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuario no autenticado.');
      const { error } = await supabase.from('products').delete().eq('id', product.id).eq('user_id', user.id);
      if (error) throw error;
      setProducts(current => current.filter(item => item.id !== product.id));
      feedbackRef.current?.show({
        type: 'success',
        title: 'Producto retirado',
        message: `${product.name} se eliminó de tu catálogo.`,
      });
    } catch (error: any) {
      feedbackRef.current?.show({
        type: 'error',
        title: 'No se pudo eliminar el producto',
        message: error.message,
      });
    }
  };

  return (
    <View className="flex-1 bg-white px-5 pt-14">
      {/* Encabezado con fondo negro */}
      <View className="mb-5 flex-row items-center justify-between bg-black px-4 py-4 rounded-2xl">
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">Tienda</Text>
          <Text className="text-2xl font-black tracking-tight text-white">Catálogo </Text>
        </View>
        <TouchableOpacity
          onPress={openCreateModal}
          className="h-11 flex-row items-center justify-center rounded-full bg-white px-4 border border-black"
        >
          <Ionicons name="add" size={18} color="#111827" style={{ marginRight: 4 }} />
          <Text className="text-xs font-bold text-black uppercase">Publicar</Text>
        </TouchableOpacity>
      </View>

      {loading && products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperClassName="justify-between mb-4"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-32 pt-1"
          refreshing={loading}
          onRefresh={refreshProducts}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              activeOpacity={0.9}
              style={{ width: '48%' }}
              className="overflow-hidden rounded-3xl border-[1.5px] border-dark bg-white shadow-sm"
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} className="h-36 w-full bg-gray-100" resizeMode="cover" />
              ) : (
                <View className="h-36 w-full items-center justify-center border-b-[1.5px] border-dark bg-gray-50">
                  <Ionicons name="image-outline" size={30} color="#9ca3af" />
                </View>
              )}
              <View className="p-3">
                <Text className="text-sm font-black text-dark" numberOfLines={1}>{item.name}</Text>
                <Text className="text-[10px] font-bold uppercase text-gray-400 mb-1">{item.category}</Text>
                
                {/* Visualización del Stock */}
                <View className="flex-row items-center mb-2">
                  <View className="bg-gray-100 px-2 py-0.5 rounded-full border border-dark">
                    <Text className="text-[10px] font-bold text-dark">Stock: {item.stock ?? 0}</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-black text-emerald-600">${Number(item.price).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => confirmDelete(item)} className="p-1.5 rounded-full bg-rose-50 border border-rose-200">
                    <Ionicons name="trash-outline" size={14} color="#e11d48" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal Formulario */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/60">
          <View className="h-[85%] rounded-t-[36px] border-t-[2px] border-dark bg-white px-6 pb-8 pt-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-black text-dark">{editingProductId ? 'Editar' : 'Nuevo Producto'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#111827" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-5">
                <TouchableOpacity
                  onPress={chooseFromGallery}
                  disabled={selectingImage}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Elegir foto de la galería"
                  className="mb-3 h-40 w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed border-dark bg-gray-50"
                >
                  {selectingImage ? (
                    <ActivityIndicator color="#111827" />
                  ) : imageUri ? (
                    <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={30} color="#111827" />
                      <Text className="mt-2 text-sm font-bold text-dark">Agregar foto del producto</Text>
                    </>
                  )}
                </TouchableOpacity>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={takePhoto}
                    disabled={selectingImage}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    className="h-11 flex-1 flex-row items-center justify-center rounded-full border border-dark bg-white"
                  >
                    <Ionicons name="camera-outline" size={18} color="#111827" />
                    <Text className="ml-2 text-xs font-bold text-dark">Tomar foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={chooseFromGallery}
                    disabled={selectingImage}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    className="h-11 flex-1 flex-row items-center justify-center rounded-full bg-dark"
                  >
                    <Ionicons name="images-outline" size={18} color="#ffffff" />
                    <Text className="ml-2 text-xs font-bold text-white">Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput value={name} onChangeText={setName} placeholder="Nombre" className="mb-3 h-12 rounded-full border border-dark px-5 font-semibold text-dark" />
              <TextInput value={category} onChangeText={setCategory} placeholder="Categoría" className="mb-3 h-12 rounded-full border border-dark px-5 font-semibold text-dark" />
              <TextInput value={price} onChangeText={setPrice} placeholder="Precio" keyboardType="numeric" className="mb-3 h-12 rounded-full border border-dark px-5 font-semibold text-dark" />
              <TextInput value={stock} onChangeText={setStock} placeholder="Stock (cantidad)" keyboardType="numeric" className="mb-3 h-12 rounded-full border border-dark px-5 font-semibold text-dark" />
              <TextInput value={description} onChangeText={setDescription} placeholder="Descripción" multiline className="mb-5 h-20 rounded-2xl border border-dark px-4 py-3 font-semibold text-dark" />
              <TouchableOpacity onPress={saveProduct} disabled={saving} className="h-12 rounded-full bg-dark items-center justify-center">
                {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Guardar</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: -20,
          right: -20,
          height: 20,
          zIndex: 1,
          elevation: 1,
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
        }}
      >
        <LottieView
          source={require('../../../assets/animations/dripping.json')}
          autoPlay
          loop
          speed={0.65}
          resizeMode="contain"
          style={{
            width: SCREEN_WIDTH * 1.85,
            height: SCREEN_WIDTH * 1.85,
            position: 'absolute',
            top: -SCREEN_WIDTH * 0.18,
            opacity: 0.45,
          }}
        />
      </View>
      <AnimatedFeedback ref={feedbackRef} />
    </View>
  );
}