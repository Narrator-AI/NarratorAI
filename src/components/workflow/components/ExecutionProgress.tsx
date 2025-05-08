import { WorkflowStep } from '../types/workflow.types';
import { formatTime, getBadgeVariant, getStatusText } from '../utils/message.utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface ExecutionProgressProps {
  steps: WorkflowStep[];
  title?: string;
}

export const ExecutionProgress = ({ 
  steps, 
  title = "执行链路与进度" 
}: ExecutionProgressProps) => {
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Progress value={calculateOverallProgress()} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {calculateOverallProgress()}%
          </span>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className="pt-0.5">
                {getProgressIcon(step)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  <Badge variant={getBadgeVariant(step.status) as BadgeVariant} className="text-xs">
                    {getStatusText(step.status)}
                  </Badge>
                </div>
                
                {step.progress !== undefined && step.progress > 0 && (
                  <Progress value={step.progress} className="mt-1.5 mb-1 h-1" />
                )}
                
                {step.executionLogs?.map((log) => (
                  <div key={log.id} className="mt-1 text-xs text-muted-foreground">
                    <span className="text-muted-foreground/70">{formatTime(log.timestamp)}</span>
                    <span className="ml-2">{log.message}</span>
                    {log.progress !== undefined && log.progress > 0 && (
                      <Progress value={log.progress} className="mt-1 h-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionProgress;
