import { ReactNode } from 'react';

export type Subtitle = {
  id: string;
  startTime: string; // 格式 "00:00:00,000"
  endTime: string;   // 格式 "00:00:00,000"
  text: string;
};

export type TranslationResult = {
  id: string;
  startTime: string;
  endTime: string;
  originalText: string;
  translatedText: string;
  language: string;
  episode: number;
};

export type ExecutionLogItem = {
  id: string;
  stepId: string;
  timestamp: Date;
  message: string;
  type: 'command' | 'info' | 'result' | 'warning' | 'error';
  progress?: number;
};

export type StepStatus = "not-started" | "in-progress" | "completed" | "error";

export type WorkflowStep = {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  result?: string;
  substeps?: ProcessSubstep[];
  subtitles?: Subtitle[];
  subtitleSets?: {
    id: string;
    name: string;
    subtitles: Subtitle[];
    originalIndex: number;
    origin_id?: string;
    origin_name?: string;
  }[];
  localizationData?: LocalizationData;
  translationResults?: TranslationResult[];
  icon: ReactNode;
  content?: string;
  executionLogs?: ExecutionLogItem[];
  progress?: number;
};

export type ProcessSubstep = {
  id: string;
  description: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  timeEstimate?: string;
};

export type LocalizationEntity = {
  id: string;
  原文: string;
  本土化: string;
  注释: string;
};

export type LocalizationCharacter = {
  name: string;
  entities: LocalizationEntity[];
};

export type LocalizationData = {
  角色: Record<string, LocalizationEntity[]>;
  地名: LocalizationEntity[];
  组织名: LocalizationEntity[];
  文化相关: LocalizationEntity[];
};

export type ChatMessage = {
  id: string;
  sender: 'system' | 'user';
  content: string;
  timestamp: Date;
  type: 'status' | 'result' | 'info' | 'error';
  relatedStep?: string;
  loading?: boolean;
  hasAction?: boolean;
  showSubtitles?: boolean;
  showLocalizationData?: boolean;
  showTranslationResults?: boolean;
  showVideoProcessing?: boolean;
  showVideoDownload?: boolean;
}; 