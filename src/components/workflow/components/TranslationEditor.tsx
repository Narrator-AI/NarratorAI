import { useState } from 'react';
import { TranslationResult } from '../types/workflow.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { parseSrtContent } from '../utils/subtitle.utils';

interface TranslationEditorProps {
  translationResults: TranslationResult[];
  onSave: (results: TranslationResult[]) => void;
  taskData?: any;
}

export const TranslationEditor = ({
  translationResults,
  onSave,
  taskData
}: TranslationEditorProps) => {
  const [results, setResults] = useState<TranslationResult[]>(translationResults);

  const updateResult = (id: string, field: keyof TranslationResult, value: any) => {
    setResults(prev => prev.map(result =>
      result.id === id ? { ...result, [field]: value } : result
    ));
  };

  const deleteResult = (id: string) => {
    setResults(prev => prev.filter(result => result.id !== id));
  };

  const addResult = (index = results.length) => {
    const newResult: TranslationResult = {
      id: `translation-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      startTime: "00:00:00,000",
      endTime: "00:00:05,000",
      originalText: "",
      translatedText: "",
      language: "",
      episode: 1
    };
    setResults(prev => [
      ...prev.slice(0, index),
      newResult,
      ...prev.slice(index)
    ]);
  };

  const handleSave = () => {
    onSave(results);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">翻译编辑器</h3>
        <Button onClick={() => addResult()} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          添加翻译
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={result.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="开始时间"
                  value={result.startTime}
                  onChange={(e) => updateResult(result.id, 'startTime', e.target.value)}
                  className="w-32"
                />
                <Input
                  placeholder="结束时间"
                  value={result.endTime}
                  onChange={(e) => updateResult(result.id, 'endTime', e.target.value)}
                  className="w-32"
                />
                <Input
                  placeholder="语言"
                  value={result.language}
                  onChange={(e) => updateResult(result.id, 'language', e.target.value)}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="集数"
                  value={result.episode}
                  onChange={(e) => updateResult(result.id, 'episode', parseInt(e.target.value))}
                  className="w-20"
                />
              </div>
              <Textarea
                placeholder="原文"
                value={result.originalText}
                onChange={(e) => updateResult(result.id, 'originalText', e.target.value)}
                rows={2}
              />
              <Textarea
                placeholder="译文"
                value={result.translatedText}
                onChange={(e) => updateResult(result.id, 'translatedText', e.target.value)}
                rows={2}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteResult(result.id)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>保存翻译</Button>
      </div>
    </div>
  );
}; 