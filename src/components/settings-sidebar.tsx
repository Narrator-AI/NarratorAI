"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bookmark, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Languages, 
  Globe, 
  Play,
  Sliders,
  Sparkles,
  X, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Minus
} from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskType } from "@/services/task-service";
import { ColorPicker } from "./ui/color-picker";

interface SettingsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  taskType?: TaskType;
  onSettingsChange?: (settings: any) => void;
}

// 字幕样式接口
interface SubtitleStyle {
  fontSize: number;
  primaryColour: string;
  outlineColour: string;
  backColour: string;
  borderStyle: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
  marginV: number;
  wrapStyle: number;
}

// 目标语言接口
interface TargetLanguage {
  language: string;
  area: string;
}

export function SettingsSidebar({ isOpen, onToggle, taskType = 'video_translation', onSettingsChange }: SettingsSidebarProps) {
  const [temperature, setTemperature] = useState(0.7);
  
  // 翻译设置状态
  const [originalLanguage, setOriginalLanguage] = useState("");
  const [targetLanguages, setTargetLanguages] = useState<TargetLanguage[]>([{ language: "", area: "" }]);
  // 初始化自动运行设置为false，稍后在useEffect中从localStorage读取
  const [autoRun, setAutoRun] = useState(false);
  const [stylePrompt, setStylePrompt] = useState("");
  
  // 字幕样式状态
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: 48,
    primaryColour: "&H00FFFFFF",
    outlineColour: "&H00000000",
    backColour: "&H00000000",
    borderStyle: 1,
    outline: 2,
    shadow: 2,
    alignment: 2,
    marginL: 10,
    marginR: 10,
    marginV: 10,
    wrapStyle: 0
  });

  // 处理风格提示变化
  const handleStylePromptChange = (value: string) => {
    setStylePrompt(value);
  };

  // 自定义源语言设置函数，避免影响页面其他内容
  const handleOriginalLanguageChange = (value: string) => {
    // 只有当值发生变化时才更新
    if (value !== originalLanguage) {
      setOriginalLanguage(value);
      
      // 当切换源语言时，清空风格提示内容
      if (value) {
        setStylePrompt("");
      }
      
      // 如果有设置变更回调函数，则调用
      if (onSettingsChange) {
        // 使用函数式更新，保留之前的状态
        onSettingsChange((prevSettings: any) => {
          const newSettings = {
            ...prevSettings,
            originalLanguage: value,
            targetLanguages,
            autoRun,
            stylePrompt: "",
            subtitleStyle
          };
          
          // 只有当设置确实发生变化时才返回新设置
          if (JSON.stringify(newSettings) !== JSON.stringify(prevSettings)) {
            return newSettings;
          }
          return prevSettings;
        });
      }
    }
  };

  // 在客户端渲染时从localStorage读取自动运行设置
  useEffect(() => {
    // 确保代码在客户端执行
    if (typeof window !== 'undefined') {
      const savedAutoRun = localStorage.getItem('settings_autoRun');
      setAutoRun(savedAutoRun === 'true');
    }
  }, []);

  // 根据任务类型收集设置并调用onSettingsChange
  useEffect(() => {
    if (!onSettingsChange) return;
    
    // 使用函数式更新，保留之前的状态
    onSettingsChange((prevSettings: any) => {
      const settings: any = { ...prevSettings };
      
      // 基于任务类型添加相应的设置
      if (taskType === 'video_translation' || taskType === 'srt_translation') {
        settings.originalLanguage = originalLanguage;
        settings.targetLanguages = targetLanguages;
        settings.autoRun = autoRun ? "true" : "false";
        settings.stylePrompt = stylePrompt || "";
      }
      
      // 视频翻译或视频压制任务需要字幕样式
      if (taskType === 'video_translation' || taskType === 'video_merging') {
        settings.subtitleStyle = subtitleStyle;
      }
      
      // 字幕提取任务只需要原始语言
      if (taskType === 'video_extraction') {
        settings.originalLanguage = originalLanguage;
      }
      
      // 只有当设置确实发生变化时才返回新设置
      if (JSON.stringify(settings) !== JSON.stringify(prevSettings)) {
        return settings;
      }
      return prevSettings;
    });
  // 依赖数组中移除onSettingsChange，避免循环依赖
  }, [taskType, originalLanguage, targetLanguages, autoRun, stylePrompt, subtitleStyle]);

  // 获取可选的原始语言选项
  const getOriginalLanguageOptions = () => {
    // 对于视频翻译，只支持中文和英语
    if (taskType === 'video_translation') {
      return (
        <>
          <SelectItem value="中文">中文</SelectItem>
          <SelectItem value="英语">英语</SelectItem>
        </>
      );
    }
    
    // 对于其他类型，支持更多语言
    return (
      <>
        <SelectItem value="中文">中文</SelectItem>
        <SelectItem value="英语">英语</SelectItem>
        <SelectItem value="日语">日语</SelectItem>
        <SelectItem value="韩语">韩语</SelectItem>
        <SelectItem value="法语">法语</SelectItem>
        <SelectItem value="德语">德语</SelectItem>
        <SelectItem value="西班牙语">西班牙语</SelectItem>
        <SelectItem value="俄语">俄语</SelectItem>
      </>
    );
  };

  const handleSubtitleStyleChange = (property: keyof SubtitleStyle, value: string | number) => {
    setSubtitleStyle({ ...subtitleStyle, [property]: value });
  };

  // 支持风格提示的任务类型
  const hasStylePromptSupport = taskType === 'video_translation' || taskType === 'srt_translation';

  return (
    <div className={`border-l ${isOpen ? 'w-80' : 'w-0'} transition-all duration-300 h-screen relative shadow-[-4px_0px_10px_rgba(0,0,0,0.05)]`}>
      {/* 显示/隐藏按钮 */}
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute -left-10 top-4 rounded-full opacity-0 invisible" 
        onClick={onToggle}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
      </Button>

      {/* 设置面板内容 */}
      {isOpen && (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">翻译设置</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <Accordion type="multiple" className="w-full" defaultValue={["translator"]}>
              {/* 只有翻译相关任务和提取任务才显示语言设置 */}
              {(taskType === 'video_translation' || taskType === 'srt_translation' || taskType === 'video_extraction' || taskType === 'video_merging') && (
                <AccordionItem value="translator">
                  <AccordionTrigger className="py-2">翻译语言</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>源语言 <span className="text-red-500">*</span></Label>
                        {taskType === 'srt_translation' ? (
                          <Input
                            placeholder="请输入源语言（必填）"
                            value={originalLanguage}
                            onChange={(e) => handleOriginalLanguageChange(e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <Select 
                            value={originalLanguage} 
                            onValueChange={handleOriginalLanguageChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择语言（必填）" />
                            </SelectTrigger>
                            <SelectContent>
                              {getOriginalLanguageOptions()}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {/* 只有翻译任务才需要目标语言 */}
                      {(taskType === 'video_translation' || taskType === 'srt_translation') && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>目标语言 <span className="text-red-500">*</span></Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setTargetLanguages([...targetLanguages, { language: "", area: "" }])}
                            >
                              <Plus className="h-3 w-3 mr-1" /> 添加
                            </Button>
                          </div>
                          
                          {targetLanguages.map((target, index) => (
                            <div key={index} className="flex gap-2 items-end mb-2">
                              <div className="flex-1">
                                <Label className="text-xs mb-1 block">语言</Label>
                                <Input 
                                  value={target.language} 
                                  onChange={(e) => {
                                    const newTargets = [...targetLanguages];
                                    newTargets[index].language = e.target.value;
                                    setTargetLanguages(newTargets);
                                  }}
                                  placeholder="输入目标语言"
                                  className="h-9"
                                />
                              </div>
                              
                              <div className="flex-1">
                                <Label className="text-xs mb-1 block">国家</Label>
                                <Input 
                                  value={target.area} 
                                  onChange={(e) => {
                                    const newTargets = [...targetLanguages];
                                    newTargets[index].area = e.target.value;
                                    setTargetLanguages(newTargets);
                                  }}
                                  placeholder="输入国家"
                                  className="h-9"
                                />
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="mb-px"
                                onClick={() => {
                                  if (targetLanguages.length > 1) {
                                    setTargetLanguages(targetLanguages.filter((_, i) => i !== index));
                                  }
                                }}
                                disabled={targetLanguages.length <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          
                          <div className="text-xs text-muted-foreground mt-1">
                            支持自定义输入任意语言和国家，当任务类型为视频翻译/字幕翻译时，国家必填
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {/* 运行设置移到最后 */}
              <AccordionItem value="run-settings">
                <AccordionTrigger className="py-2">运行设置</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-run">全流程自动执行</Label>
                      <Switch 
                        id="auto-run" 
                        checked={autoRun}
                        onCheckedChange={(value) => {
                          setAutoRun(value);
                          // 将自动运行开关状态保存到 localStorage
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('settings_autoRun', value ? 'true' : 'false');
                          }
                        }}
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      全流程自动执行：无需确认，自动完成全部任务<br />
                      关闭后：系统将在关键节点暂停等待确认
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
}
