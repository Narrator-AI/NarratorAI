import { WorkflowStep } from '../types/workflow.types';
import { formatTime, getBadgeVariant, getStatusText } from '../utils/message.utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const ExecutionLogs = ({ steps }: { steps: WorkflowStep[] }) => {
  const calculateOverallProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getProgressIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Progress value={calculateOverallProgress()} className="flex-1" />
        <span className="text-sm text-gray-500">
          {calculateOverallProgress()}%
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
            {getProgressIcon(step)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{step.title}</h4>
                <Badge variant={getBadgeVariant(step.status) as BadgeVariant}>
                  {getStatusText(step.status)}
                </Badge>
              </div>
              {step.executionLogs?.map((log) => (
                <div key={log.id} className="mt-1 text-sm text-gray-600">
                  <span className="text-gray-400">{formatTime(log.timestamp)}</span>
                  <span className="ml-2">{log.message}</span>
                  {log.progress !== undefined && (
                    <Progress value={log.progress} className="mt-1 h-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 