import { Subtitle } from '../types/workflow.types';

export const generateFakeSubtitles = (count: number, setId: string): Subtitle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${setId}-${i + 1}`,
    startTime: "00:00:10,000",
    endTime: "00:00:15,000",
    text: `这是第 ${i + 1} 条示例字幕`
  }));
};

export const convertSubtitlesToSrt = (subtitles: Subtitle[]): string => {
  return subtitles.map((subtitle, index) => {
    return `${index + 1}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}\n\n`;
  }).join('');
};

export const parseSrtContent = (srtString: string): Array<{
  startTime: string;
  endTime: string;
  originalText?: string;
  translatedText?: string;
  text?: string;
}> => {
  const blocks = srtString.trim().split('\n\n');
  return blocks.map(block => {
    const lines = block.split('\n');
    const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    return {
      startTime: timeMatch?.[1] || "00:00:00,000",
      endTime: timeMatch?.[2] || "00:00:00,000",
      text: lines.slice(2).join('\n') || ""
    };
  });
}; 