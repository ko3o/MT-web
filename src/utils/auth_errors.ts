console.log('auth_errors.ts loaded - 2026-05-15 01:27');
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return '發生了未知的錯誤，請稍後再試。';
  
  const message = (error.message || '').toLowerCase();
  const status = error.status;

  // 根據錯誤訊息關鍵字進行判斷
  if (message.includes('email rate limit exceeded') || message.includes('rate limit') || status === 429) {
    return '系統忙碌中，請稍候 30 秒再試一次喔。';
  }

  if (message.includes('user not found') || message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return '您還未註冊，請點擊註冊，或檢查帳號密碼是否正確。';
  }

  if (message.includes('invalid password') || message.includes('password is incorrect')) {
    return '密碼輸入錯誤，請再確認一下喔。';
  }

  if (message.includes('for security purposes, you can only request this after')) {
    return '為了安全起見，請稍等幾秒後再試一次喔。';
  }
  
  if (message.includes('user already registered')) {
    return '這個電子郵件已經被註冊過囉！要不要直接登入試試？';
  }
  
  if (message.includes('password should be at least 6 characters')) {
    return '密碼長度至少需要 6 個字喔！';
  }

  if (message.includes('email not confirmed')) {
    return '您的電子郵件尚未驗證，請先到信箱確認喔。';
  }

  return error.message || '發生了未知的驗證錯誤。';
};
