import { useState } from 'react';
import { Subtitle } from '../types/workflow.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface SubtitleEditorProps {
  subtitles: Subtitle[];
  onSave: (subtitles: Subtitle[]) => void;
}

export const SubtitleEditor = ({ subtitles: initialSubtitles, onSave }: SubtitleEditorProps) => {
  const [subtitles, setSubtitles] = useState<Subtitle[]>(initialSubtitles);

  const updateSubtitle = (id: string, field: keyof Subtitle, value: string) => {
    setSubtitles(prev => prev.map(sub => 
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const deleteSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(sub => sub.id !== id));
  };

  const addSubtitle = (index = subtitles.length) => {
    const newSubtitle: Subtitle = {
      id: `subtitle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      startTime: "00:00:00,000",
      endTime: "00:00:05,000",
      text: ""
    };
    setSubtitles(prev => [
      ...prev.slice(0, index),
      newSubtitle,
      ...prev.slice(index)
    ]);
  };

  const handleSave = () => {
    onSave(subtitles);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">字幕编辑器</h3>
        <Button onClick={() => addSubtitle()} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          添加字幕
        </Button>
      </div>

      <div className="space-y-4">
        {subtitles.map((subtitle, index) => (
          <div key={subtitle.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="开始时间"
                  value={subtitle.startTime}
                  onChange={(e) => updateSubtitle(subtitle.id, 'startTime', e.target.value)}
                  className="w-32"
                />
                <Input
                  placeholder="结束时间"
                  value={subtitle.endTime}
                  onChange={(e) => updateSubtitle(subtitle.id, 'endTime', e.target.value)}
                  className="w-32"
                />
              </div>
              <Textarea
                placeholder="字幕文本"
                value={subtitle.text}
                onChange={(e) => updateSubtitle(subtitle.id, 'text', e.target.value)}
                rows={2}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteSubtitle(subtitle.id)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>保存字幕</Button>
      </div>
    </div>
  );
}; 