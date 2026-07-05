export const getSupabaseErrorMessage = (error: any): string => {
  if (!error) return '發生了未知的錯誤，請稍後再試。';
  
  const message = (error.message || '').toLowerCase();
  
  if (message.includes('row-level security') || error.code === '42501') {
    return '權限不足：您沒有執行此操作的權限，請聯絡管理員確認 RLS 設定。';
  }
  
  if (message.includes('violates foreign key constraint')) {
    return '資料關聯錯誤：所引用的資料不存在。';
  }
  
  if (message.includes('violates unique constraint')) {
    return '資料已存在：請檢查是否有重複的欄位內容。';
  }

  if (message.includes('not found')) {
    return '找不到請求的資料。';
  }

  return error.message || '發生了資料庫錯誤。';
};
