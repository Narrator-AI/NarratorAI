import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface VideoProcessingProps {
  stepId: string;
  onComplete: () => void;
}

export const VideoProcessing = ({ stepId, onComplete }: VideoProcessingProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'processing' | 'completed'>('waiting');

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus('completed');
            onComplete();
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, onComplete]);

  const startProcessing = () => {
    setStatus('processing');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">视频压制</h3>
        <Button
          onClick={startProcessing}
          disabled={status !== 'waiting'}
        >
          {status === 'processing' && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {status === 'waiting' ? '开始压制' : status === 'processing' ? '压制中...' : '压制完成'}
        </Button>
      </div>

      <div className="space-y-2">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-gray-500">
          <span>进度: {Math.round(progress)}%</span>
          <span>
            {status === 'waiting' ? '等待开始' :
             status === 'processing' ? '正在压制视频...' :
             '压制完成'}
          </span>
        </div>
      </div>
    </div>
  );
}; 