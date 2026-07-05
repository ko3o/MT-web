import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, updateProduct, createProduct, deleteProduct, upsertProducts, Product } from '../services/productService';
import { getOrders, updateOrderStatus, deleteOrder, upsertOrders, updatePassportStatus, Order } from '../services/orderService';
import { getMembers, deleteMember, updateMember, upsertMembers, Profile } from '../services/userService';
import { getSupabaseErrorMessage } from '../utils/supabase_errors';
import toast from 'react-hot-toast';

// --- Product Hooks ---

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
};

export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('商品已新增');
    },
    onError: (err) => toast.error(`新增失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('商品已更新');
    },
    onError: (err) => toast.error(`更新失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('商品已刪除');
    },
    onError: (err) => toast.error(`刪除失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const upsertProductsMutation = useMutation({
    mutationFn: upsertProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(`批次處理失敗: ${getSupabaseErrorMessage(err)}`),
  });

  return { createMutation, updateMutation, deleteMutation, upsertProductsMutation };
};

// --- Order Hooks ---

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });
};

export const useOrderMutations = () => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('訂單狀態已更新');
    },
    onError: (err) => toast.error(`更新失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('訂單已刪除');
    },
    onError: (err) => toast.error(`刪除失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const upsertOrdersMutation = useMutation({
    mutationFn: upsertOrders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(`批次處理失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const updatePassportStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updatePassportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('護照進度已更新');
    },
    onError: (err) => toast.error(`更新失敗: ${getSupabaseErrorMessage(err)}`),
  });

  return { updateStatusMutation, deleteOrderMutation, upsertOrdersMutation, updatePassportStatusMutation };
};

// --- Member Hooks ---

export const useMembers = () => {
  return useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });
};

export const useMemberMutations = () => {
  const queryClient = useQueryClient();

  const deleteMemberMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員已刪除');
    },
    onError: (err) => toast.error(`刪除失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) => updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員資料已更新');
    },
    onError: (err) => toast.error(`更新失敗: ${getSupabaseErrorMessage(err)}`),
  });

  const upsertMembersMutation = useMutation({
    mutationFn: upsertMembers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (err) => toast.error(`批次處理失敗: ${getSupabaseErrorMessage(err)}`),
  });

  return { deleteMemberMutation, updateMemberMutation, upsertMembersMutation };
};
