import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2 } from 'lucide-react';

interface VideoDownloadProps {
  stepId: string;
}

export const VideoDownload = ({ stepId }: VideoDownloadProps) => {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = () => {
    setDownloadStatus('downloading');
    
    // 模拟下载进度
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadStatus('completed');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">视频下载</h3>
        <Button
          onClick={handleDownload}
          disabled={downloadStatus === 'downloading'}
        >
          {downloadStatus === 'downloading' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {downloadStatus === 'idle' ? '下载视频' :
           downloadStatus === 'downloading' ? '下载中...' :
           '下载完成'}
        </Button>
      </div>

      {downloadStatus !== 'idle' && (
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-sm text-gray-500">
            <span>进度: {Math.round(progress)}%</span>
            <span>
              {downloadStatus === 'downloading' ? '正在下载...' : '下载完成'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 