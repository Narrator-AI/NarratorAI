import { ChatMessage, WorkflowStep } from '../types/workflow.types';

export const generateFakeResult = (stepTitle: string): string => {
  const results = [
    "任务已完成，结果符合预期。",
    "处理完成，数据已更新。",
    "分析完毕，报告已生成。",
    "操作成功，系统已就绪。"
  ];
  return results[Math.floor(Math.random() * results.length)];
};

export const createSystemMessage = (
  content: string,
  type: ChatMessage['type'] = 'info',
  relatedStep?: string,
  hasAction: boolean = false,
  showSubtitles: boolean = false,
  showLocalizationData: boolean = false,
  showTranslationResults: boolean = false,
  showVideoProcessing: boolean = false,
  showVideoDownload: boolean = false
): ChatMessage => {
  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sender: 'system',
    content,
    timestamp: new Date(),
    type,
    relatedStep,
    hasAction,
    showSubtitles,
    showLocalizationData,
    showTranslationResults,
    showVideoProcessing,
    showVideoDownload
  };
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

export const getBadgeVariant = (status: WorkflowStep['status']): string => {
  switch (status) {
    case 'completed': return 'success';
    case 'error': return 'destructive';
    case 'in-progress': return 'default';
    default: return 'secondary';
  }
};

export const getStatusText = (status: WorkflowStep['status']): string => {
  switch (status) {
    case 'completed': return '已完成';
    case 'error': return '错误';
    case 'in-progress': return '进行中';
    default: return '未开始';
  }
}; 