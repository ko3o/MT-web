/**
 * 將日期字串轉換為台灣時區 (Asia/Taipei) 並格式化為 YYYY-MM-DD HH:mm:ss
 * @param dateInput 日期字串或 Date 物件
 * @returns 格式化後的本地時間字串
 */
export const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '---';
  
  try {
    // 確保輸入是 Date 物件
    let date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // 如果日期字串不含時區資訊且不是 ISO 格式，JS 可能會誤判
    // 如果是從 Supabase 來的 UTC 字串，通常是 '2026-05-01 08:54:57' 這種形式，
    // 我們需要確保它被視為 UTC。
    if (typeof dateInput === 'string' && !dateInput.includes('Z') && !dateInput.includes('+')) {
      // 嘗試將其補上 Z 尾碼以確保視為 UTC
      const utcDate = new Date(`${dateInput.replace(' ', 'T')}Z`);
      if (!isNaN(utcDate.getTime())) {
        date = utcDate;
      }
    }

    if (isNaN(date.getTime())) return '無效日期';

    // 強制轉換為台北時間 (UTC+8)
    // 使用 toLocaleString 並指定時區，這是最保險的做法
    const taipeiString = date.toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // 格式化輸出 YYYY-MM-DD HH:mm:ss
    // toLocaleString 在 zh-TW 下通常輸出 2026/05/01 17:08:58
    // 我們將斜線換成橫線
    return taipeiString.replace(/\//g, '-');
  } catch (error) {
    console.error('Date formatting error:', error);
    return '格式錯誤';
  }
};
