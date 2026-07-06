import { useState, useEffect } from 'react';
import { WorkflowStep, ChatMessage, ExecutionLogItem } from './types/workflow.types';
import { generateFakeSubtitles } from './utils/subtitle.utils';
import { generateSampleLocalizationData } from './utils/localization.utils';
import { generateFakeResult, createSystemMessage } from './utils/message.utils';
import { ExecutionLogs } from './components/ExecutionLogs';
import { SubtitleEditor } from './components/SubtitleEditor';
import { LocalizationEditor } from './components/LocalizationEditor';
import { TranslationEditor } from './components/TranslationEditor';
import { VideoProcessing } from './components/VideoProcessing';
import { VideoDownload } from './components/VideoDownload';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Globe, 
  Languages, 
  Video, 
  Download 
} from 'lucide-react';

export function WorkflowSteps() {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: "ocr-extract",
      title: "字幕提取",
      description: "从视频中提取字幕文本",
      status: "not-started",
      icon: <FileText className="w-5 h-5" />,
      executionLogs: []
    },
    {
      id: "localization",
      title: "本土化处理",
      description: "处理文本中的本土化元素",
      status: "not-started",
      icon: <Globe className="w-5 h-5" />,
      executionLogs: []
    },
    {
      id: "translation",
      title: "翻译处理",
      description: "翻译字幕内容",
      status: "not-started",
      icon: <Languages className="w-5 h-5" />,
      executionLogs: []
    },
    {
      id: "video-processing",
      title: "视频压制",
      description: "将字幕嵌入视频",
      status: "not-started",
      icon: <Video className="w-5 h-5" />,
      executionLogs: []
    },
    {
      id: "video-download",
      title: "视频下载",
      description: "下载处理完成的视频",
      status: "not-started",
      icon: <Download className="w-5 h-5" />,
      executionLogs: []
    }
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [editorData, setEditorData] = useState<{
    isOpen: boolean;
    subtitles: any[];
    relatedStep: string;
  }>({
    isOpen: false,
    subtitles: [],
    relatedStep: ""
  });

  const addExecutionLog = (stepId: string, message: string, type: ExecutionLogItem['type'], progress?: number) => {
    const log: ExecutionLogItem = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stepId,
      timestamp: new Date(),
      message,
      type,
      progress
    };

    setSteps(prev => prev.map(step =>
      step.id === stepId ? {
        ...step,
        executionLogs: [...(step.executionLogs || []), log]
      } : step
    ));
  };

  const updateStepProgress = (stepId: string, progress: number) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, progress } : step
    ));
  };

  const processStep = async (stepId: string) => {
    const currentStep = steps.find(step => step.id === stepId);
    if (!currentStep) return;

    // 更新步骤状态
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status: 'in-progress' } : step
    ));

    // 根据不同步骤执行不同的操作
    switch (stepId) {
      case 'ocr-extract':
        // 模拟字幕提取过程
        addExecutionLog(stepId, '开始提取字幕...', 'info');
        const subtitles = generateFakeSubtitles(10, 'set1');
        currentStep.subtitles = subtitles;
        setMessages(prev => [
          ...prev,
          createSystemMessage(
            '字幕提取完成，请检查结果',
            'result',
            stepId,
            true,
            true
          )
        ]);
        break;

      case 'localization':
        // 模拟本土化处理
        addExecutionLog(stepId, '开始本土化处理...', 'info');
        currentStep.localizationData = generateSampleLocalizationData();
        setMessages(prev => [
          ...prev,
          createSystemMessage(
            '本土化处理完成，请检查结果',
            'result',
            stepId,
            true,
            false,
            true
          )
        ]);
        break;

      case 'translation':
        // 模拟翻译处理
        addExecutionLog(stepId, '开始翻译处理...', 'info');
        setMessages(prev => [
          ...prev,
          createSystemMessage(
            '翻译处理完成，请检查结果',
            'result',
            stepId,
            true,
            false,
            false,
            true
          )
        ]);
        break;

      case 'video-processing':
        // 视频压制步骤会在组件内部处理
        setMessages(prev => [
          ...prev,
          createSystemMessage(
            '请开始视频压制',
            'info',
            stepId,
            true,
            false,
            false,
            false,
            true
          )
        ]);
        break;

      case 'video-download':
        // 视频下载步骤会在组件内部处理
        setMessages(prev => [
          ...prev,
          createSystemMessage(
            '视频处理完成，可以下载了',
            'info',
            stepId,
            true,
            false,
            false,
            false,
            false,
            true
          )
        ]);
        break;
    }
  };

  const handleStepComplete = (stepId: string) => {
    // 更新步骤状态为完成
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status: 'completed' } : step
    ));

    // 移动到下一步
    setCurrentStepIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex < steps.length) {
        processStep(steps[nextIndex].id);
      }
      return nextIndex;
    });
  };

  const handleEditorSave = (data: any) => {
    const currentStep = steps.find(step => step.id === editorData.relatedStep);
    if (!currentStep) return;

    switch (editorData.relatedStep) {
      case 'ocr-extract':
        currentStep.subtitles = data;
        break;
      case 'localization':
        currentStep.localizationData = data;
        break;
      case 'translation':
        currentStep.translationResults = data;
        break;
    }

    setEditorData(prev => ({ ...prev, isOpen: false }));
    handleStepComplete(editorData.relatedStep);
  };

  useEffect(() => {
    // 启动第一个步骤
    if (steps.length > 0 && steps[0].status === 'not-started') {
      processStep(steps[0].id);
    }
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <ExecutionLogs steps={steps} />

      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={message.id} className="p-4 bg-white rounded-lg shadow">
            <div className="mb-2">{message.content}</div>
            
            {message.showSubtitles && (
              <SubtitleEditor
                subtitles={steps.find(s => s.id === message.relatedStep)?.subtitles || []}
                onSave={handleEditorSave}
              />
            )}

            {message.showLocalizationData && (
              <LocalizationEditor
                data={steps.find(s => s.id === message.relatedStep)?.localizationData || generateSampleLocalizationData()}
                onSave={handleEditorSave}
                taskId={message.relatedStep || ''}
              />
            )}

            {message.showTranslationResults && (
              <TranslationEditor
                translationResults={steps.find(s => s.id === message.relatedStep)?.translationResults || []}
                onSave={handleEditorSave}
                taskData={{}}
              />
            )}

            {message.showVideoProcessing && (
              <VideoProcessing
                stepId={message.relatedStep || ''}
                onComplete={() => message.relatedStep && handleStepComplete(message.relatedStep)}
              />
            )}

            {message.showVideoDownload && (
              <VideoDownload stepId={message.relatedStep || ''} />
            )}

            {message.hasAction && !message.showSubtitles && 
             !message.showLocalizationData && !message.showTranslationResults && 
             !message.showVideoProcessing && !message.showVideoDownload && (
              <div className="mt-4">
                <Button
                  onClick={() => message.relatedStep && handleStepComplete(message.relatedStep)}
                >
                  确认并继续
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 