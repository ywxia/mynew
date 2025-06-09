import { getChineseDate } from './dateFormat.js';

export function getDefaultPrompt() {
  const today = getChineseDate();
  return `请帮我清理和整理以上网页爬取的内容，仅保留主要内容，并用简体中文分段输出。\n\n当前时间是 ${today}，请用简体中文深度分析和解读一下这篇文章。`;
}

export function getYoutubeDefaultPrompt() {
  return '请用简体中文总结这段视频的主要内容和核心信息，并给视频起个标题。';
}
