"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { TaskType } from "@/services/task-service";

export default function TestSettingsPage() {
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(true);
  const [taskType, setTaskType] = useState<TaskType>("video_translation");
  const [settings, setSettings] = useState<any>({});

  const toggleSettingsSidebar = () => {
    setIsSettingsSidebarOpen(!isSettingsSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">翻译设置测试页面</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">选择任务类型</h2>
          <Select 
            value={taskType} 
            onValueChange={(value: TaskType) => setTaskType(value)}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="选择任务类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video_translation">视频翻译任务</SelectItem>
              <SelectItem value="srt_translation">纯SRT翻译任务</SelectItem>
              <SelectItem value="video_erasure">视频擦除任务</SelectItem>
              <SelectItem value="video_extraction">创建字幕提取任务</SelectItem>
              <SelectItem value="video_merging">创建视频压制任务</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">当前设置</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[400px]">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
        
        <Button 
          onClick={() => alert('设置已保存：' + JSON.stringify(settings))}
          className="mt-4"
        >
          保存设置
        </Button>
      </div>
      
      <SettingsSidebar 
        isOpen={isSettingsSidebarOpen}
        onToggle={toggleSettingsSidebar}
        taskType={taskType}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
