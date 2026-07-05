import { supabase, supabaseUrl } from '../db';

export interface ProductOption {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  original_price?: number;
  stock: number;
  image_url: string;
  description: string;
  options?: (string | ProductOption)[];
  created_at: string;
  sort_order?: number;
}

export const getImageUrl = (path: string) => {
  if (!path) return '/placeholder-tea.jpg';
  if (path.startsWith('http')) return path;
  
  const rootUrl = supabaseUrl || 'https://ftqyzxrvghfdspgjampd.supabase.co';
  const baseUrl = `${rootUrl.replace(/\/$/, '')}/storage/v1/object/public/products/`;
  
  // 檢查是否已經包含子目錄（包含 / 符號），若無則補上 items/
  let finalPath = path;
  if (!path.includes('/')) {
    finalPath = `items/${path}`;
  }
  
  // 確保檔名被正確編碼，處理特殊字元問題
  const encodedFilename = encodeURIComponent(decodeURIComponent(finalPath)).replace(/%2F/g, '/');
  
  return `${baseUrl}${encodedFilename}`;
};

export const getThumbnailUrl = (path: string, width: number = 100, height: number = 100) => {
  // 暫時回退到原始圖片，因為 Supabase 縮圖服務 (Image Transformation) 需要付費方案才能使用
  // 如果您的 Supabase 專案是免費版，使用 /render/image/public/ 會導致破圖
  return getImageUrl(path);
};

export const getAvatarUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const rootUrl = supabaseUrl || 'https://ftqyzxrvghfdspgjampd.supabase.co';
  const baseUrl = `${rootUrl.replace(/\/$/, '')}/storage/v1/object/public/products/`;
  
  // 檢查是否已經包含子目錄（包含 / 符號），若無則補上 avatars/
  let finalPath = path;
  if (!path.includes('/')) {
    finalPath = `avatars/${path}`;
  }
  
  // 確保檔名被正確編碼，處理特殊字元問題
  const encodedFilename = encodeURIComponent(decodeURIComponent(finalPath)).replace(/%2F/g, '/');
  
  return `${baseUrl}${encodedFilename}`;
};

export const getStorageUrl = (path: string, fallback: string = '/placeholder-tea.jpg') => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  
  const rootUrl = supabaseUrl || 'https://ftqyzxrvghfdspgjampd.supabase.co';
  const baseUrl = `${rootUrl.replace(/\/$/, '')}/storage/v1/object/public/products/`;
  
  // 確保路徑中所有的 % 和特殊字元被正確處理，但不重複編碼
  const encodedPath = encodeURIComponent(decodeURIComponent(path)).replace(/%2F/g, '/');
  
  return `${baseUrl}${encodedPath}`;
};

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Product[];
};

export const getProductBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) throw error;
  if (!data) {
    // Try case-insensitive
    const { data: retryData, error: retryError } = await supabase
      .from('products')
      .select('*')
      .ilike('slug', slug)
      .maybeSingle();
    
    if (retryError) throw retryError;
    return retryData as Product;
  }
  return data as Product;
};

export const createProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json() as Product;
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json() as Product;
};

export const deleteProduct = async (id: string) => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
};

export const upsertProducts = async (products: Product[]) => {
  const response = await fetch('/api/products/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(products),
  });
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Not JSON or other error
    }
    throw new Error(errorMessage);
  }
  
  return await response.json() as Product[];
};
