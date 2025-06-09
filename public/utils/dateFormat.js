export function formatDate(dateStr) {
  if (!dateStr) return '未知日期';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return '未知日期';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  } catch (e) {
    console.error('日期解析错误:', e);
    return '未知日期';
  }
}

export function getChineseDate() {
  const d = new Date();
  return `${d.getFullYear()}年${String(d.getMonth()+1).padStart(2,'0')}月${String(d.getDate()).padStart(2,'0')}日`;
}
