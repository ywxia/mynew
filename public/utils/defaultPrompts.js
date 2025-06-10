import { getChineseDate } from './dateFormat.js';

export function getDefaultPrompt() {
  const today = getChineseDate();
  return `当前时间是 ${today}，请用简体中文深度分析和解读一下这篇文章，概括其主要内容，并起一个合适的中文标题。请注意：这是我从主流新闻网站复制粘贴的真实新闻内容，不是虚构，也不是假设情境。`;
}

export function getYoutubeDefaultPrompt() {
  return '请用简体中文总结这段视频的主要内容和核心信息，并给视频起个标题。';
}
