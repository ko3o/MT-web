import { supabase } from '../db';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  product_id: string;
  selected_option?: any;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  email: string;
  customer_phone: string;
  shipping_address?: string;
  store_name?: string;
  store_address?: string;
  total_amount: number;
  shipping_price: number;
  shipping_fee?: number;
  status: '新單' | '處理中' | '已收款' | '已出貨' | '已取消' | '已回報匯款';
  items: OrderItem[];
  payment_method: string;
  shipping_method: string;
  note?: string;
  bank_last_five?: string;
  created_at: string;
  avatar_url?: string;
  passport_status?: string; 
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  is_gift?: boolean;
}

/**
 * 統一的茶貓護照進度格式化函式
 */
export const getPassportStatusText = (n: number, hasFourSeasons: boolean = false): string => {
  const version = Math.floor((n - 1) / 12) + 1;
  const progress = ((n - 1) % 12) + 1;
  const vSuffix = version > 1 ? ` V${version}` : '';
  
  // 貼紙編號隨每本護照循環 (1-12)
  const stickerNum = progress;
  
  // 基礎格式：茶貓進度：[ N / 12 ] (應附 N 號貼紙)
  let status = `茶貓進度：[ ${progress} / 12 ]${vSuffix} (應附 ${stickerNum} 號貼紙)`;

  if (n === 1) {
    status = `★ 需附實體護照本 ★ ${status}`;
  }

  if (hasFourSeasons) {
    if (n === 1) {
      status = `【四季茶-首季】附護照+1~3號貼紙 | ${status}`;
    } else if (n === 4) {
      status = `【四季茶-末季】附10~12號貼紙 | ${status}`;
    } else {
      // 四季茶進度貼紙 (每季3張)
      const start = (progress - 1) * 3 + 1;
      const end = progress * 3;
      status = `【四季茶進度】附${start}~${end}號貼紙 | ${status}`;
    }
  }

  return status;
};

export const calculatePassportStatus = async (userId: string | null, orderItems: any[], createdAt?: string): Promise<string> => {
  if (!userId) return '非會員 (不適用護照活動)';

  let query = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('status', 'eq', '已取消');

  if (createdAt) {
    query = query.lte('created_at', createdAt);
  }

  const { count, error } = await query;
  if (error) {
    console.error('Error fetching order count:', error);
    return '計算失敗';
  }

  const n = createdAt ? (count || 0) : (count || 0) + 1;
  const hasFourSeasons = orderItems.some(item => 
    (item.name || item.product_name || '').includes('四季茶')
  );

  return getPassportStatusText(n, hasFourSeasons);
};

export const updatePassportStatus = async (id: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ passport_status: status })
    .eq('id', id);

  if (error) throw error;
};

export const createOrder = async (orderData: any): Promise<Order> => {
  console.log('Step 1: 開始處理資料');
  
  // 準備主表資料 (排除 items 欄位，避免資料庫報錯)
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // 增加詳細日誌輸出供調試
  console.log('訂單資料內容(原始):', orderData);

  const mainOrderData = {
    order_number: orderNumber,
    user_id: orderData.user_id || null,
    customer_name: String(orderData.customer_name || '未提供'),
    // 移除 email 寫入，因為主表可能也缺少此欄位或快取異常
    shipping_address: String(orderData.shipping_address || '自取'),
    store_name: orderData.store_name ? String(orderData.store_name) : null,
    store_address: orderData.store_address ? String(orderData.store_address) : null,
    shipping_price: Number(orderData.shipping_price) || 0,
    total_amount: Number(orderData.total_amount),
    payment_method: String(orderData.payment_method || '貨到付款'),
    shipping_method: String(orderData.shipping_method || '宅配'),
    status: '新單',
    note: orderData.note ? String(orderData.note) : null,
    created_at: new Date().toISOString(),
    customer_phone: String(orderData.customer_phone || ''),
    passport_status: await calculatePassportStatus(orderData.user_id, orderData.items),
    
    // New recipient and gift tracking fields
    recipient_name: String(orderData.recipient_name || orderData.customer_name || '未提供'),
    recipient_phone: String(orderData.recipient_phone || orderData.customer_phone || ''),
    recipient_address: orderData.recipient_address 
      ? String(orderData.recipient_address) 
      : (orderData.shipping_method.includes('宅配') ? String(orderData.shipping_address || '自取') : null),
    is_gift: orderData.is_gift !== undefined 
      ? Boolean(orderData.is_gift) 
      : (orderData.recipient_name && orderData.recipient_name !== orderData.customer_name || orderData.recipient_phone && orderData.recipient_phone !== orderData.customer_phone)
  };

  // 第二步 (資料庫操作)
  console.log('Step 2: 準備寫入主表');
  
  // 確保使用者存在於 public.profiles 表中 (解決外鍵約束問題)
  if (orderData.user_id) {
    try {
      // 嘗試完整更新
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: orderData.user_id, 
          full_name: orderData.customer_name 
        }, { onConflict: 'id' });
      
      if (upsertError) {
        console.warn('同步用戶資料失敗 (這通常不影響訂單建立):', upsertError);
      }
    } catch (e) {
      console.warn('使用者同步發生異常:', e);
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([mainOrderData])
    .select()
    .single();

  if (error) {
    console.error('主表寫入失敗:', error);
    throw error;
  }

  // 第三步 (明細操作)
  console.log('Step 3: 準備寫入明細，主表 ID:', data.id);
  
  // 增加防錯過濾，避免無效 ID 進入資料庫
  const validItems = orderData.items.filter((item: any) => {
    const pid = item.product_id || item.id;
    return pid && pid !== 'undefined' && pid !== 'null';
  });

  if (validItems.length === 0) {
    console.error('無有效商品 ID 可下單:', orderData.items);
    throw new Error('商品資料異常，請重新整理頁面');
  }

  const orderItems = validItems.map((item: any) => {
    if (!item) return null;
    
    // Explicitly handle potential empty name and combine with option
    const baseName = (item.name || item.product_name || '未知商品').trim() || '商品遺失名稱';
    
    // Extract label from selectedOption (it could be an object or a string)
    const optLabel = typeof item?.selectedOption === 'object' ? item.selectedOption?.label : item?.selectedOption;
    const finalName = optLabel ? `${baseName} (${optLabel})` : baseName;

    // 確保 JSON 格式乾淨，排除 React Proxy 等物件
    const cleanOption = item?.selectedOption 
      ? JSON.parse(JSON.stringify(typeof item.selectedOption === 'object' ? item.selectedOption : { label: item.selectedOption }))
      : null;

    const pid = item.product_id || item.id;
    console.log(`Processing item ${pid}: name=${item?.name}, finalName=${finalName}`);
    
    return {
      order_id: data.id,
      product_id: String(pid || ''),
      product_name: finalName,
      price: Number(item?.price || 0),
      quantity: Number(item?.quantity || 1)
      // 移除 selected_option 寫入，因為資料庫快取顯示該欄位不存在
    };
  }).filter(Boolean);

  console.log('Inserting into supabase order_items:', orderItems);

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('明細寫入失敗:', itemsError);
    throw itemsError;
  }

  // 第四步 (成功確認)
  // 更新庫存
  for (const item of validItems) {
    const pid = item.product_id || item.id;
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', pid)
      .single();
    
    if (product) {
      await supabase
        .from('products')
        .update({ stock: Math.max(0, product.stock - item.quantity) })
        .eq('id', pid);
    }
  }

  return data as Order;
};

export const getOrders = async (): Promise<Order[]> => {
  // Fetch orders with items
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false });

  if (ordersError) throw ordersError;
  if (!orders || orders.length === 0) return [];

  // Get unique user IDs and product IDs for batch fetching
  const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))] as string[];
  const productIds = [...new Set(orders.flatMap(o => o.items.map((i: any) => i.product_id).filter(Boolean)))] as string[];

  // Fetch profiles for avatars
  let profilesMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url, full_name')
      .in('id', userIds);
    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    }
  }

  // Fetch products for images
  let productsMap: Record<string, any> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, image_url')
      .in('id', productIds);
    if (products) {
      productsMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    }
  }

  // Map everything together
  const results = [];
  for (const order of orders) {
    const profile = order.user_id ? profilesMap[order.user_id] : null;
    let passportStatus = order.passport_status;
    
    // 如果為會員，進行進度顯示優化
    if (order.user_id) {
      // 如果欄位為空，或者包含「(第 N 次購買)」的舊格式，則重新計算顯示
      if (!passportStatus || passportStatus.includes('次購買')) {
        passportStatus = await calculatePassportStatus(order.user_id, order.items, order.created_at);
      }
    }

    results.push({
      ...order,
      avatar_url: profile?.avatar_url,
      customer_name: profile?.full_name || order.customer_name,
      passport_status: passportStatus,
      items: (order.items || []).map((item: any) => ({
        ...item,
        image_url: productsMap[item.product_id]?.image_url || item.image_url || ''
      }))
    });
  }

  return results as Order[];
};

export const getOrderById = async (id: string): Promise<Order> => {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Fetch profile for avatar
  let avatar_url = '';
  let profileName = order.customer_name;
  if (order.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('id', order.user_id)
      .single();
    if (profile) {
      avatar_url = profile.avatar_url || '';
      profileName = profile.full_name || order.customer_name;
    }
  }

  // Fetch product images for items
  const productIds = order.items.map((i: any) => i.product_id).filter(Boolean);
  let productsMap: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, image_url')
      .in('id', productIds);
    if (products) {
      productsMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p.image_url }), {});
    }
  }

  return {
    ...order,
    avatar_url,
    customer_name: profileName,
    items: (order.items || []).map((item: any) => ({
      ...item,
      image_url: productsMap[item.product_id] || item.image_url || ''
    }))
  } as Order;
};

export const updateOrderStatus = async (id: string, status: Order['status']): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
};

export const deleteOrder = async (id: string): Promise<void> => {
  // First delete order items due to foreign key constraint
  const { error: itemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', id);

  if (itemsError) throw itemsError;

  // Then delete the order
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getUserOrders = async (userId: string, email?: string): Promise<Order[]> => {
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)');
    
  if (email && userId) {
    query = query.or(`user_id.eq.${userId},email.eq.${email}`);
  } else if (userId) {
    query = query.eq('user_id', userId);
  } else if (email) {
    query = query.eq('email', email);
  }

  const { data: orders, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  if (!orders || orders.length === 0) return [];

  // Fetch product images for these orders
  const productIds = [...new Set(orders.flatMap(o => o.items.map((i: any) => i.product_id).filter(Boolean)))] as string[];
  let productsMap: Record<string, string> = {};
  
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, image_url')
      .in('id', productIds);
    if (products) {
      productsMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p.image_url }), {});
    }
  }

  return orders.map(order => ({
    ...order,
    items: (order.items || []).map((item: any) => ({
      ...item,
      image_url: productsMap[item.product_id] || item.image_url || ''
    }))
  })) as Order[];
};

export const reportRemittance = async (orderId: string, lastFive: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({
      bank_last_five: lastFive,
      status: '已回報匯款'
    })
    .eq('id', orderId);

  if (error) throw error;
};

export const upsertOrders = async (orders: Order[]) => {
  const response = await fetch('/api/orders/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orders),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};
