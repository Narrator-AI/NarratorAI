"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  FileText, 
  Languages, 
  ChevronDown, 
  Settings, 
  FileUp, 
  Video, 
  Subtitles, 
  FileVideo, 
  Eraser, 
  FilmIcon, 
  Mic,
  ChevronLeft,
  ChevronRight,
  Plus,
  File,
  User,
  Bot,
  Copy,
  Download,
  Edit,
  ArrowUp,
  ChevronUp,
  CloudIcon,
  CloudOff,
  Loader2
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { WorkflowSteps } from "@/components/workflow-steps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import './chat-container.css';
import projectService from '@/services/project-service';
import taskService from '@/services/task-service';
import fileService from '@/services/file-service';
import { setApiKey } from '@/services/env-config';
import { hasApiKey, saveApiKey, isApiKeyError } from '@/utils/api-key-helper';
import apiClient from '@/services/api-client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  description: string;
  created: string;
  createTime: string;
  fileCount: string;
  selected?: boolean;
  files?: any[]; // 添加files字段
}

interface ChatData {
  id: string;
  input: string;
  result: string;
  feature: string;
}

interface FileInfo {
  id: string;
  name: string;
  size: string | number;
  extension?: string;
  createTime?: string;
  updateTime?: string;
  downloadUrl?: string;
}

interface FileListResponse {
  total: number;
  records: FileInfo[];
}

interface BaiduPanTaskInfo {
  file_set_id: number;
  transfer_task_id: string; // 用作唯一ID
  link: string;
  status: number;
  _internalId?: string; // 内部生成的唯一标识，用于React列表渲染
}

// document.addEventListener("visibilitychange", () => {
//   if (document.hidden) {
//     console.log("Home页面已切换到后台");
//     // 在这里可以执行一些操作，比如暂停视频、停止轮询等
//   } else {
//     console.log("Home页面已切换回前台");
//     // 在这里可以执行一些操作，比如恢复视频播放、重新开始轮询等
//   }
// });

export default function Home() {
  // 通用UI状态
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // 添加聊天内容区域的引用
  const chatContentRef = useRef<HTMLDivElement>(null);
  
  // 任务类型状态 - 保留但不再显示在UI上
  const [testTaskType, setTestTaskType] = useState<any>("video_translation");
  const [testSettings, setTestSettings] = useState<any>({});
  
  // 功能和内容状态  
  const [selectedFeature, setSelectedFeature] = useState("video-translate");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);
  // 添加一个标志变量，用于控制是否应该从设置更新输入框内容
  const [shouldUpdateInputFromSettings, setShouldUpdateInputFromSettings] = useState(true);
  
  // 文件夹状态
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false); // 添加创建中状态
  
  // 功能卡片滚动状态
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false); // 默认不显示右箭头
  
  // 文件和拖拽状态
  const [showFileModal, setShowFileModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingFileName, setEditingFileName] = useState("");
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  
  // 文件数据
  const [files, setFiles] = useState<Record<string, Array<{id: string, name: string, size: string, date: string, editing?: boolean}>>>({});
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // 新增状态
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [workflowType, setWorkflowType] = useState<'video-translation' | 'document-translation' | 'text-translation'>('video-translation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatData, setChatData] = useState<Record<string, any>>({});
  // 费用确认弹窗状态
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [taskFee, setTaskFee] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number>(0);

  // API密钥设置
  const [apiKey, setApiKeyState] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // 功能卡片数据
  const featureCards = [
    {
      id: "video-translate",
      title: "视频翻译",
      description: "将视频内容从一种语言翻译成另一种语言",
      icon: <Video className="h-4 w-4" />,
      placeholder: "输入翻译的要求。比如：翻译自然、流畅、口语化",
      headline: "上传视频文件，即刻获得多语言翻译！",
      taskType: "video_translation"
    },
    {
      id: "subtitle-translate",
      title: "字幕翻译",
      description: "翻译已有的SRT字幕文件",
      icon: <Subtitles className="h-4 w-4" />,
      placeholder: "输入翻译的要求。比如：翻译自然、流畅、口语化",
      headline: "上传SRT字幕文件，轻松实现精准翻译！",
      taskType: "srt_translation"
    },
    {
      id: "subtitle-extract",
      title: "字幕提取",
      description: "从视频中提取字幕内容",
      icon: <FileText className="h-4 w-4" />,
      placeholder: "上传视频文件，我们将使用先进的语音识别技术提取字幕。识别后可编辑修正，也可下载SRT格式字幕文件。",
      headline: "自动提取视频中的对白内容，生成精确字幕！",
      taskType: "video_extraction"
    },
    {
      id: "subtitle-remove",
      title: "视频字幕擦除",
      description: "擦除视频中的硬字幕",
      icon: <Eraser className="h-4 w-4" />,
      placeholder: "上传带有硬字幕的视频，我们将尝试使用AI技术擦除原始字幕。请注意：复杂背景下的字幕可能无法完全擦除。",
      headline: "AI智能擦除视频硬字幕，还原清晰画面！",
      taskType: "video_erasure"
    },
    {
      id: "video-burning",
      title: "视频压制",
      description: "将字幕压制到视频中",
      icon: <FilmIcon className="h-4 w-4" />,
      placeholder: "上传视频文件和对应的SRT字幕文件，我们将为您完成字幕压制。可以自定义字幕样式、位置和显示效果。",
      headline: "一键将字幕压制到视频中，自定义样式与效果！",
      taskType: "video_merging"
    }
  ];

  // 功能卡片区状态管理
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // 将功能卡片分为主要功能和工具类功能
  const mainFeatureIds = ["video-translate", "subtitle-translate"];
  
  // 获取主要功能和工具功能
  const mainFeatures = featureCards.filter(card => mainFeatureIds.includes(card.id));
  const toolFeatures = featureCards.filter(card => !mainFeatureIds.includes(card.id));

  // 根据showAllFeatures状态决定显示哪些卡片
  const visibleFeatureCards = showAllFeatures 
    ? featureCards 
    : mainFeatures;

  // 切换显示所有功能
  const toggleShowAllFeatures = () => {
    setShowAllFeatures(prev => !prev);
  };

  // 获取任务类型对应的费用
  const getTaskFee = async (taskType: string, params = {}): Promise<number> => {
    try {
      const response = await taskService.getTaskFee(taskType as any, params);
      return response.data.fee || 0;
    } catch (error) {
      console.error('获取费用失败:', error);
      // 费用获取失败时的默认值
      const defaultFees: Record<string, number> = {
        'video_translation': 50,
        'srt_translation': 30,
        'video_extraction': 20,
        'video_erasure': 40,
        'video_merging': 35
      };
      return defaultFees[taskType] || 10;
    }
  };

  // 切换设置侧边栏显示状态
  const toggleSettingsSidebar = () => {
    setIsSettingsSidebarOpen(prev => !prev);
  };
  
  // 打开文件夹管理弹窗
  const openProjectModal = () => {
    // 在打开文件夹选择模态框时，标记当前选中的文件夹
    if (selectedProject) {
      setProjects(prev => 
        prev.map(project => ({
          ...project,
          selected: project.id === selectedProject.id
        }))
      );
    }
    setShowProjectModal(true);
    setShowUploadDropdown(false);
    
    // 每次打开文件夹弹窗时刷新文件夹列表
    fetchProjects().catch(error => {
      console.error('刷新文件夹列表失败:', error);
    });
  };
  
  // 打开文件管理弹窗
  const openFileModal = (projectId: string) => {
    setCurrentProjectId(projectId);
    setShowFileModal(true);
    setShowProjectModal(false);
    
    // 获取文件夹信息
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error(`未找到ID为 ${projectId} 的文件夹`);
      return;
    }
    
    const projectName = project.name || '';
    
    // 打印文件夹信息
    console.log('当前文件夹ID1:', projectId);
    console.log('当前文件夹ID:', projects);
    console.log('当前文件夹名称:', projectName);
    console.log('当前文件夹详细信息:', project);
    
    // 每次打开文件管理时都刷新数据
    console.log(`打开文件管理弹窗，刷新文件夹 ${projectId} (${projectName}) 的文件列表`);
    fetchProjectFiles(projectId, projectName);
  };

  // 打开上传文件弹窗
  const openUploadModal = (projectId: string) => {
    return () => {
      setCurrentProjectId(projectId);
      setShowUploadModal(true);
      setShowFileModal(false);
    };
  };
  
  // 打开创建文件夹弹窗
  const openCreateProjectModal = () => {
    setNewProjectName("");
    setShowCreateProjectModal(true);
  };
  
  // API密钥检查函数 - 在执行需要API的操作前调用
  const checkApiKeyBeforeAction = async (action: () => Promise<void>) => {
    if (!hasApiKey()) {
      // 如果没有API密钥，显示API密钥设置对话框
      setShowApiKeyModal(true);
      return;
    }
    
    try {
      // 执行传入的操作
      await action();
    } catch (error) {
      console.error('操作执行失败:', error);
      // 检查是否是API密钥问题
      if (isApiKeyError(error)) {
        // 如果是API密钥问题，显示API密钥设置对话框
        toast.error('API密钥无效或已过期，请重新设置');
        setShowApiKeyModal(true);
      } else {
        // 其他错误，显示通用错误消息
        toast.error('操作失败，请稍后重试');
      }
    }
  };

  // 保存API密钥
  const handleSaveApiKey = async () => {
    console.log('apikey', apiKey)
    if (!apiKey.trim()) {
      toast.error('请输入有效的API密钥');
      return;
    }
    
    try {
      // 验证API密钥是否有效
      const isValid = await apiClient.validateApiKey(apiKey);
      
      if (!isValid) {
        toast.error('API密钥无效，请检查后重试');
        return;
      }
      
      // 保存API密钥到localStorage
      saveApiKey(apiKey);
      setApiKey(apiKey); // 同时设置到env-config
      setShowApiKeyModal(false);
      toast.success('API密钥设置成功');
      
      // 获取任务列表
      try {
        const { items: tasks } = await taskService.getTasks(
          {
            page: 1,
            limit: 100,
          }
        );
        console.log('获取到的任务列表:', tasks);
        
        // 触发任务列表更新事件，通知侧边栏更新
        const updateTasksEvent = new CustomEvent('updateTasksList', {
          detail: { tasks }
        });
        window.dispatchEvent(updateTasksEvent);
      } catch (error) {
        console.error('获取任务列表失败:', error);
      }
      
      // 重新加载文件夹列表
      fetchProjects();
    } catch (error) {
      console.error('验证API密钥失败:', error);
      toast.error('验证API密钥失败，请检查网络连接');
    }
  };

  // 创建新文件夹
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    
    checkApiKeyBeforeAction(async () => {
      try {
        setIsCreatingProject(true); // 添加创建中状态
        const response = await projectService.createProject({
          name: newProjectName
        });
        console.log("创建文件夹响应:", response);
        if (response.data) {
          setNewProjectName("");
          setShowCreateProjectModal(false);
          
          // 创建成功后刷新文件夹列表
          await fetchProjects();
          
          // 找到新创建的文件夹并选中它
          const newProjectId = response.data.id.toString();
          const newProject = projects.find(p => p.id === newProjectId);
          if (newProject) {
            setSelectedProject(newProject);
          }
          
          toast.success("文件夹创建成功");
        } else {
          toast.error(response.error || response.message || "创建文件夹失败，请稍后重试");
        }
      } catch (error) {
        console.error('创建文件夹失败:', error);
        if (!isApiKeyError(error)) {
          toast.error("创建文件夹失败，请稍后重试");
        }
      } finally {
        setIsCreatingProject(false); // 无论成功失败，都结束创建状态
      }
    });
  };

  // 打开文件夹文件
  const openProjectFiles = (projectId: string) => {
    checkApiKeyBeforeAction(async () => {
      setCurrentProjectId(projectId);
      // 加载文件夹文件
      await fetchProjectFiles(projectId);
      setShowFileModal(true);
    });
  };

  // 处理选择文件夹
  const handleSelectProject = (project: Project) => {
    const projectId = project.id;
    checkApiKeyBeforeAction(async () => {
      // 设置当前文件夹信息
      setSelectedProject(project);
      setCurrentProjectId(projectId);
      setShowProjectModal(false);
      
      // 如果文件列表未加载，则加载文件列表
      if (!files[projectId]) {
        await fetchProjectFiles(projectId);
      }
    });
  };

  // 文件上传状态
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [totalUploadSize, setTotalUploadSize] = useState(0);
  const [uploadedSize, setUploadedSize] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<{id: string, name: string, size: number}[]>([]);

  // 百度网盘转存相关状态
  const [baiduLinkInput, setBaiduLinkInput] = useState('');
  const [isSavingBaiduLink, setIsSavingBaiduLink] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'baidu'>('file'); // 上传类型：文件上传或百度网盘转存
  const [baiduTasks, setBaiduTasks] = useState<BaiduPanTaskInfo[]>([]);
  const [showBaiduTasksModal, setShowBaiduTasksModal] = useState(false);

  // 百度网盘转存
  const saveBaiduPanFile = async (projectId: string, inputText: string) => {
    // 从输入文本中提取有效链接
    const shortLink = extractBaiduPanLink(inputText);
    
    checkApiKeyBeforeAction(async () => {
      try {
        setIsSavingBaiduLink(true);
        
        // 先获取最新的转存任务列表
        await fetchBaiduPanTasks();
        
        // 检查当前正在处理中的任务数量
        const processingTasksCount = baiduTasks.filter(task => 
          // 状态为0(未开始)、1(转存中)、4(下载中)的任务视为处理中
          task.status === 0 || task.status === 1 || task.status === 4
        ).length;
        
        console.log(`当前处理中的转存任务数量: ${processingTasksCount}`);
        
        // 如果处理中的任务数量已达到3个，则不允许提交新任务
        if (processingTasksCount >= 3) {
          toast.error("转存任务数量已达上限", {
            description: "当前最多只能同时处理3个转存任务，请等待其他任务完成后再提交"
          });
          return;
        }
        
        console.log(`开始转存百度网盘文件，文件夹ID: ${projectId}, 链接: ${shortLink}`);
        
        const response = await fileService.saveBaiduPanFile({
          file_set_id: projectId,
          short_link: shortLink
        });
        
        if (response.success) {
          toast("百度网盘文件正在转存中，请在转存任务列表中查看进度");
          
          // 清空输入框
          setBaiduLinkInput('');
          
          // 刷新转存任务列表
          await fetchBaiduPanTasks();
        } else {
          toast(response.error || "提交百度网盘转存任务时出错");
        }
      } catch (error: any) {
        console.error('百度网盘转存错误:', error);
        toast(error.message || "提交百度网盘转存任务时发生错误");
      } finally {
        setIsSavingBaiduLink(false);
      }
    });
  };

  // 处理提交
  const handleSubmit = async () => {
    checkApiKeyBeforeAction(async () => {
      // 检查是否已选择文件夹
      if (!selectedProject) {
        toast.error("请先选择文件夹", {
          description: "处理文本前需要选择一个文件夹"
        });
        return;
      }
      
      // 检查翻译设置是否完整
      const settings = testSettings || {};
      const sourceLanguage = settings.originalLanguage || '';
      const targetLanguages = settings.targetLanguages || [];
      
      if (!sourceLanguage) {
        toast.error("请完善翻译设置", {
          description: "源语言为必填项，请在设置中选择"
        });
        if (!isSettingsSidebarOpen) {
          toggleSettingsSidebar(); // 自动打开设置侧边栏
        }
        return;
      }
      
      if (targetLanguages.length === 0 || (targetLanguages.length > 0 && !targetLanguages[0]?.language)) {
        toast.error("请完善翻译设置", {
          description: "目标语言为必填项，请在设置中填写"
        });
        if (!isSettingsSidebarOpen) {
          toggleSettingsSidebar(); // 自动打开设置侧边栏
        }
        return;
      }
      
      if (targetLanguages.length === 0 || (targetLanguages.length > 0 && !targetLanguages[0]?.area)) {
        toast.error("请完善翻译设置", {
          description: "目标语言国家为必填项，请在设置中填写"
        });
        if (!isSettingsSidebarOpen) {
          toggleSettingsSidebar(); // 自动打开设置侧边栏
        }
        return;
      }
      
      // 选择当前选中的功能卡片
      const selectedCard = featureCards.find(c => c.id === selectedFeature);
      if (!selectedCard) return;
      
      // 设置选中的任务类型和费用
      setSelectedTaskType(selectedCard.taskType);
      
      try {
        // 构建任务参数
        const taskParams = {
          task_type: selectedCard.taskType as TaskType,
          original_language: sourceLanguage,
          target_languages: targetLanguages,
          video_erase_mode: settings.videoEraseMode || 'advanced',
          auto_run: settings.autoRun ? 1 : 0,
          style_prompt: inputText.trim(), // 使用输入框的内容作为stylePrompt
          resources: {
            file_set_name: selectedProject.name,
            file_set_id: selectedProject.id
          },
          subtitle_style: settings.subtitleStyle ? {
            font_size: settings.subtitleStyle.fontSize,
            primary_colour: settings.subtitleStyle.primaryColour,
            outline_colour: settings.subtitleStyle.outlineColour,
            back_colour: settings.subtitleStyle.backColour,
            border_style: settings.subtitleStyle.borderStyle,
            outline: settings.subtitleStyle.outline,
            shadow: settings.subtitleStyle.shadow,
            alignment: settings.subtitleStyle.alignment,
            margin_l: settings.subtitleStyle.marginL,
            margin_r: settings.subtitleStyle.marginR,
            margin_v: settings.subtitleStyle.marginV,
            wrap_style: settings.subtitleStyle.wrapStyle
          } : {}
        };
        
        // 调用点数计算接口
        setIsSubmitting(true);
        const loadingToast = toast.loading('正在计算任务所需点数...');
        
        try {
          console.log('开始计算任务点数...');
          const pointsResult = await taskService.calculateTaskPoints(taskParams);
          console.log('点数计算结果:', pointsResult);
          
          if (pointsResult && pointsResult.success) {
            console.log('点数计算成功:', pointsResult.points, '余额:', pointsResult.balance);
            // 设置任务费用
            setTaskFee(pointsResult.points || 0);
            setUserBalance(pointsResult.balance || 0);
            toast.success(`任务将消耗 ${pointsResult.points} 点数，您的剩余点数为 ${pointsResult.balance} 点`);
            
            // 显示费用确认弹窗
            setShowPaymentConfirm(true);
          } else {
            console.log('点数计算失败:', pointsResult?.message);
            toast.error('计算任务点数失败', {
              description: pointsResult?.message || '请稍后重试'
            });
          }
        } catch (error) {
          console.error('计算任务点数出错:', error);
          toast.error('计算任务点数出错', {
            description: '请检查参数设置后重试'
          });
        } finally {
          // 无论成功还是失败，都关闭加载提示并重置提交状态
          toast.dismiss(loadingToast);
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('提交任务出错:', error);
        toast.error('提交任务出错', {
          description: '请检查参数设置后重试'
        });
      }
    });
  };

  // 确认支付，继续工作流
  const confirmPayment = async () => {
    setIsSubmitting(true);
    
    // 关闭费用确认弹窗
    setShowPaymentConfirm(false);
    
    // 显示加载提示
    const loadingToast = toast.loading('正在创建任务...');
    
    try {
      // 选择当前选中的功能卡片
      const selectedCard = featureCards.find(c => c.id === selectedFeature);
      if (!selectedCard) throw new Error('未找到选中的功能');
      
      // 检查翻译设置是否完整
      const settings = testSettings || {};
      const sourceLanguage = settings.originalLanguage || '';
      const targetLanguages = settings.targetLanguages || [];
      
      // 构建任务参数（与calculateTaskPoints使用相同的参数）
      const taskParams = {
        task_type: selectedCard.taskType as TaskType,
        original_language: sourceLanguage,
        target_languages: targetLanguages,
        video_erase_mode: settings.videoEraseMode || 'advanced',
        auto_run: settings.autoRun ? 1 : 0,
        style_prompt: inputText.trim(), // 使用输入框的内容作为stylePrompt
        resources: {
          file_set_name: selectedProject?.name,
          file_set_id: selectedProject?.id
        },
        subtitle_style: settings.subtitleStyle ? {
          font_size: settings.subtitleStyle.fontSize,
          primary_colour: settings.subtitleStyle.primaryColour,
          outline_colour: settings.subtitleStyle.outlineColour,
          back_colour: settings.subtitleStyle.backColour,
          border_style: settings.subtitleStyle.borderStyle,
          outline: settings.subtitleStyle.outline,
          shadow: settings.subtitleStyle.shadow,
          alignment: settings.subtitleStyle.alignment,
          margin_l: settings.subtitleStyle.marginL,
          margin_r: settings.subtitleStyle.marginR,
          margin_v: settings.subtitleStyle.marginV,
          wrap_style: settings.subtitleStyle.wrapStyle
        } : {}
      };
      
      // 调用创建任务接口
      console.log('开始创建视频任务...');
      const result = await taskService.createVideoTask(taskParams);
      console.log('创建任务结果:', result);
      
      if (result && result.success) {
        console.log('创建任务成功, 任务ID:', result.taskId);
        toast.success('任务创建成功', {
          description: `任务ID: ${result.taskId}`
        });
        
        // 确定工作流类型
        let flowType: 'video-translation' | 'document-translation' | 'text-translation' = 'text-translation';
        
        if (selectedFeature === 'translate') {
          flowType = 'text-translation';
        } else if (selectedFeature === 'video-subtitle') {
          flowType = 'video-translation';
        } else if (selectedFeature === 'document') {
          flowType = 'document-translation';
        }
        
        setWorkflowType(flowType);
        setShowWorkflow(true); // 显示工作流界面
        setIsSettingsSidebarOpen(false); // 关闭翻译设置侧边栏
        
        // 保存结果到当前对话
        if (currentChatId) {
          setChatData(prev => ({
            ...prev,
            [currentChatId]: {
              ...prev[currentChatId],
              input: inputText,
              feature: prev[currentChatId]?.feature || selectedFeature,
              taskId: result.taskId // 保存任务ID到对话数据中
            }
          }));
        }
        
        // 触发自定义事件，通知任务已提交
        const taskSubmitEvent = new CustomEvent('taskSubmitted', {
          detail: {
            taskType: selectedTaskType,
            taskId: result.taskId,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(taskSubmitEvent);
        
        // 刷新任务列表，确保新创建的任务显示在左侧任务记录中
        // 内联定义获取任务列表的函数
        const apiKey = localStorage.getItem('narrator_api_key');
        if (apiKey) {
          try {
            // 获取任务列表
            const { items: tasks } = await taskService.getTasks(
              {
                page: 1,
                limit: 100
              }
            );
            console.log('任务创建后获取到的任务列表:', tasks);
            
            // 触发任务列表更新事件，通知侧边栏更新
            const updateTasksEvent = new CustomEvent('updateTasksList', {
              detail: { tasks }
            });
            window.dispatchEvent(updateTasksEvent);
          } catch (error) {
            console.error('创建任务后获取任务列表失败:', error);
          }
        }
      } else {
        console.log('创建任务失败:', result?.message);
        toast.error('创建任务失败', {
          description: result?.message || '请稍后重试'
        });
      }
    } catch (error) {
      console.error('创建任务出错:', error);
      toast.error('创建任务出错', {
        description: error instanceof Error ? error.message : '请检查参数设置后重试'
      });
    } finally {
      // 无论成功还是失败，都关闭加载提示并重置提交状态
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  // 工作流程完成处理函数
  const handleWorkflowComplete = (finalResult: string) => {
    setResult(finalResult);
    setShowWorkflow(false);
    setShowResult(true);
    
    // 保存结果到当前对话
    if (currentChatId) {
      setChatData(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          result: finalResult
        }
      }));
    }
  };

  // 返回编辑模式
  const returnToEdit = () => {
    setShowResult(false);
  };

  // 获取当前选中功能的名称
  const getFeatureName = () => {
    const feature = featureCards.find(card => card.id === selectedFeature);
    return feature ? feature.title : "";
  };

  // 获取基于当前选择功能的预设标签
  const getPresetTags = () => {
    // 获取当前选择的功能卡片
    const currentFeature = featureCards.find(card => card.id === selectedFeature);
    
    // 根据任务类型返回对应的标签组
    if (currentFeature && 
        (currentFeature.taskType === 'video_translation' || currentFeature.taskType === 'srt_translation')) {
      // 视频翻译和字幕翻译共享相同的标签组
      return [
        '基础风格',
        '短剧投流风格',
        '青少年流行语短剧风格',
        '情感类短剧风格',
        '都市职场短剧风格',
        '悬疑烧脑短剧风格',
        '喜剧搞笑短剧风格',
        '古风奇幻短剧风格',
        '青春校园短剧风格',
        '霸道总裁商战爱情短剧风格',
        '豪门权谋短剧风格'
      ];
    } else {
      // 其他功能使用默认标签组
      switch (selectedFeature) {
        case 'grammar':
          return [
            '帮我检查语法错误',
            '改进这段文字的表达',
            '让这段话更加正式',
            '简化这段复杂的表述'
          ];
        case 'summarize':
          return [
            '总结这篇文章的要点',
            '用三句话概括内容',
            '提取文章中的关键信息',
            '为这段内容写个摘要'
          ];
        case 'polishing':
          return [
            '让这段话更加生动',
            '改进这段文字的风格',
            '让表达更加专业',
            '增加一些修辞手法'
          ];
        default:
          return [
            '帮我处理这段文字',
            '分析一下这段内容',
            '优化这段表达',
            '提供一些改进建议'
          ];
      }
    }
  };

  // 获取标签内容
  const getTagContent = (tagName: string) => {
    switch (tagName) {
      case '基础风格':
        return "1.需要在Tiktok、Dramabox、Rerelshort等短剧平台投流播放，主要面向16-32岁的年轻观众";
      case '短剧投流风格':
        return "1. 需要在TikTok、Instagram、YouTube Shorts等全球短视频平台投流，面向16-30岁全球年轻观众\n2. 所有台词必须100%口语化，完全模拟真实对话习惯和节奏\n3. 每句台词不超过8个字为宜，必须简短直接，便于快速阅读\n4. 删除所有书面语和正式表达，改用日常口头表达方式\n5. 保留对话中的重复、停顿和语气词，增加真实感\n6. 使用断句和省略增强节奏感，符合短视频快节奏特性\n7. 确保台词朗读时节奏感强，便于配音和字幕同步\n8. 翻译需保留原文情感强度，但表达方式必须符合目标语言口语习惯";
      case '青少年流行语短剧风格':
        return "1. 需要在Snapchat、TikTok等平台投流，面向13-19岁Z世代观众\n2. 全面采用当下青少年流行语和网络用语，每月更新词库\n3. 句式极简，大量使用缩写和简化表达\n4. 增加强烈的情绪表达词和感叹词，体现青少年强烈情感波动\n5. 模仿社交媒体聊天风格，包括表情符号的文字化表达\n6. 适当使用夸张表达和情感放大，符合青少年表达习惯\n7. 加入当下流行文化引用，如游戏、音乐、网络名人梗\n8. 使用反问、设问等互动性强的句式增加参与感";
      case '情感类短剧风格':
        return "1. 需要在各短剧平台情感频道投流，面向18-35岁寻求情感共鸣的观众\n2. 对白必须接地气，使用日常生活中的情感表达方式\n3. 减少华丽辞藻，增加生活化比喻和形象表达\n4. 情感对白需体现真实的犹豫、停顿和语气变化\n5. 冲突场景台词需简短有力，一句话表达复杂情感\n6. 转场对白需设计悬念和情感钩子，吸引观众看下一集\n7. 保留非标准语法的口语表达，如重复、倒装等\n8. 确保每集结尾台词具有强烈情感冲击力或悬念";
      case '都市职场短剧风格':
        return "1. 需在各短剧平台都市剧频道投流，面向22-40岁职场人士\n2. 对白需兼顾专业性和生活化，避免过于学术化表达\n3. 职场冲突需用简练台词体现，一句话表达复杂职场关系\n4. 办公室对话需真实反映不同职级间的话语权差异\n5. 使用当代职场流行语，如\"996\"、\"内卷\"等概念的国际化表达\n6. 保留角色间的潜台词和弦外之音，但表达方式更直接\n7. 会议场景需压缩对话，保留关键信息点\n8. 职场隐喻需本地化处理，使用目标文化中对应的职场概念";
      case '悬疑烧脑短剧风格':
        return "1. 需要在各悬疑短视频频道投流，面向18-40岁喜欢推理解谜的观众\n2. 对白需埋设线索和误导，但不能过于刻意和明显\n3. 关键信息需通过口语化表达自然呈现，避免刻意强调\n4. 使用断句和停顿制造紧张感和悬念\n5. 推理和解谜台词需简化专业术语，用大众化表达替代\n6. 情节转折处台词需简短震撼，制造\"反转\"效果\n7. 保持台词节奏感，用短句快速推进剧情\n8. 确保翻译不泄露原文中刻意隐藏的信息";
      case '喜剧搞笑短剧风格':
        return "1. 需要在各搞笑短视频平台投流，面向16-35岁追求轻松娱乐的观众\n2. 笑点必须本地化，根据目标文化调整幽默表达方式\n3. 口头禅和笑点台词需朗朗上口，便于传播和模仿\n4. 使用夸张的口语表达和语气词增强喜剧效果\n5. 双关语和文字游戏需根据目标语言特点重新创造\n6. 模仿当地流行的喜剧风格和表达方式\n7. 保留角色间的调侃和打趣元素，但使用目标语言习惯表达\n8. 确保台词有节奏感和\"包袱\"效果，适合短视频快速消费";
      case '古风奇幻短剧风格':
        return "1. 需在各文化类短视频平台投流，面向16-35岁喜爱东方文化的国际观众\n2. 古风元素需转化为目标文化能理解的表达方式，避免直译成难懂的文言\n3. 将传统礼仪用语转化为目标语言中对应的尊敬表达\n4. 简化复杂的文化背景解释，使用简短台词点明关键信息\n5. 奇幻元素和设定需用现代口语表达，确保易于理解\n6. 角色称谓需考虑目标文化习惯，避免生硬翻译\n7. 保留东方美学和哲学概念，但使用现代表达方式\n8. 确保对白节奏符合短视频快速消费特点";
      case '青春校园短剧风格':
        return "1. 需要在各青少年短视频平台投流，面向13-22岁在校学生群体\n2. 必须使用当下学生群体流行语，避免过时表达\n3. 校园场景对话需反映不同国家/地区的教育文化差异\n4. 师生对话需调整为目标文化中的尊师方式\n5. 青春期情感表达需调整为目标语言的含蓄/直接程度\n6. 校园冲突和解决方式需考虑不同文化背景下的处理方式\n7. 使用简短有力的台词表达成长主题和价值观\n8. 确保台词易于目标年龄段理解和接受";
      case '霸道总裁商战爱情短剧风格':
        return "1. 需要在Reelshort、Dramabox等短剧平台投流，面向18-35岁追求浪漫幻想的女性观众\n2. 总裁角色台词必须极度简洁有力，单句5-7字为佳，体现强势魅力\n3. 命令式语句需增强气场，使用不容置疑的口吻和直接表达\n4. 商业对话需快速点明权力和地位，避免冗长铺垫\n5. 爱情表白和关键情感转折处需保持强烈对比，冷酷外表下的温柔反差\n6. 所有专业术语需简化为日常表达，但保留高端商务氛围\n7. 台词需体现鲜明的情感波动，从冷漠到炽热的变化要通过简短对白表现\n8. 确保女主角台词在面对强势时保持自我特色和倔强态度\n9. 冲突对白需火药味十足，一句话表达复杂权力关系\n10. 表达占有欲和独占欲的台词需确保符合现代价值观但保留强烈情感";
      case '豪门权谋短剧风格':
        return "1. 需在各短剧平台豪门剧频道投流，面向25-45岁喜爱权谋剧情的观众\n2. 家族内部权力争夺需通过简短锋利的对话体现，避免冗长铺垫\n3. 商业和婚姻联盟的讨论需简化为核心利益点，直接明了\n4. 表面客套与内心算计的对比需通过微妙语气变化和简短独白呈现\n5. 豪门规则和传统观念需通过自然对话呈现，避免刻意解释\n6. 角色语言的阶层特征需体现出身和教育背景\n7. 保留角色间的潜台词和弦外之音，但表达方式更直接\n8. 确保翻译后的台词既优雅高贵又接地气易懂\n9. 保留角色语言的阶层特征，体现出身和教育背景\n10. 确保台词易于目标年龄段理解和接受";
      default:
        return tagName;
    }
  };

  // 添加预设标签的处理函数
  const handleTagClick = (tagText: string) => {
    const content = getTagContent(tagText);
    setInputText(content);
    
    // 保存到当前对话
    if (currentChatId) {
      setChatData(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          id: currentChatId,
          input: content,
          feature: prev[currentChatId]?.feature || selectedFeature
        }
      }));
    }
  };

  // 处理设置变化，确保不会重置输入框内容
  const handleSettingsChange = (settingsOrUpdater: any) => {
    // 暂时禁用从设置更新输入框内容
    setShouldUpdateInputFromSettings(false);
    
    if (typeof settingsOrUpdater === 'function') {
      // 如果是函数式更新，保留输入框内容
      setTestSettings(prevSettings => {
        const newSettings = settingsOrUpdater(prevSettings);
        // 只有当新设置与旧设置不同时才更新
        if (JSON.stringify(newSettings) !== JSON.stringify(prevSettings)) {
          return newSettings;
        }
        return prevSettings;
      });
    } else {
      // 如果是直接设置对象，也保留输入框内容
      setTestSettings(prevSettings => {
        const newSettings = {
          ...settingsOrUpdater,
          stylePrompt: inputText || settingsOrUpdater.stylePrompt || prevSettings.stylePrompt || ""
        };
        // 只有当新设置与旧设置不同时才更新
        if (JSON.stringify(newSettings) !== JSON.stringify(prevSettings)) {
          return newSettings;
        }
        return prevSettings;
      });
    }
    
    // 在短暂延迟后重新启用从设置更新输入框内容
    setTimeout(() => {
      setShouldUpdateInputFromSettings(true);
    }, 300);
  };

  // 当设置变化时更新输入框文本
  useEffect(() => {
    if (shouldUpdateInputFromSettings && testSettings && hasStylePromptSupport() && testSettings.stylePrompt !== undefined) {
      // 只有当输入框为空，或者stylePrompt有实际内容且与当前输入不同时才更新
      if (inputText === "" || (testSettings.stylePrompt && testSettings.stylePrompt !== inputText)) {
        setInputText(testSettings.stylePrompt);
      }
    }
  }, [testSettings, shouldUpdateInputFromSettings, inputText]);

  // 在选择功能/任务类型变化时，如果新任务类型不支持风格提示，则清空输入框
  useEffect(() => {
    if (!hasStylePromptSupport()) {
      setInputText("");
    }
  }, [testTaskType]);

  // 当消息内容变化时，自动滚动到底部
  useEffect(() => {
    if (chatContentRef.current && showResult) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [result, showResult]);

  // 获取文件夹列表
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      // 先检查是否有API密钥，如果没有则直接返回
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        // 如果没有API密钥，直接设置空文件夹列表并返回
        setProjects([]);
        setIsLoadingProjects(false);
        return;
      }
      
      // 验证API密钥有效性 - 在获取文件夹列表前验证
      try {
        await apiClient.validateApiKey(apiKey);
      } catch (error) {
        // 如果API密钥验证失败，不进行后续请求
        console.log('API密钥验证失败，不加载文件夹列表', error);
        setProjects([]);
        setIsLoadingProjects(false);
        return;
      }
      
      // API密钥验证通过，继续加载文件夹列表
      const response = await projectService.getProjects({
        page: 1,
        limit: 100,
        orderBy: 'createTime',
        order: 'desc'
      });
      
      if (response.data && Array.isArray(response.data)) {
        // 根据实际API响应格式调整
        console.log("文件夹API响应数据:", response.data);
        
        // 格式化文件夹数据
        const formattedProjects = response.data.map((project: any) => {
          // 根据files数组计算文件数量
          const filesCount = project.files && Array.isArray(project.files) ? project.files.length : 0;
          
          return {
            id: project.id.toString(),
            name: project.name || '未命名文件夹',
            description: project.description || '',
            created: project.created_at ? new Date(project.created_at).toLocaleDateString() : '-',
            createTime: project.created_at ? new Date(project.created_at).toLocaleString() : '-',
            fileCount: `共${filesCount}个`,
            files: project.files || [] // 保留原始files字段
          };
        });
        console.log("格式化后的文件夹列表:", formattedProjects);
        setProjects(formattedProjects);
      } else if (response.data && Array.isArray(response.data.items)) {
        // 兼容旧格式
        console.log("文件夹API响应数据(旧格式):", response.data.items);
        
        // 格式化文件夹数据
        const formattedProjects = response.data.items.map((project: any) => {
          // 根据files数组计算文件数量（如果存在）
          const filesCount = project.files && Array.isArray(project.files) ? project.files.length : 
                            (project.fileCount || 0);
          
          return {
            id: project.id.toString(),
            name: project.name || '未命名文件夹',
            description: project.description || '',
            created: project.created_at ? new Date(project.created_at).toLocaleDateString() : 
                    (project.createTime ? new Date(project.createTime).toLocaleDateString() : '-'),
            createTime: project.created_at ? new Date(project.created_at).toLocaleString() : 
                       (project.createTime ? new Date(project.createTime).toLocaleString() : '-'),
            fileCount: `共${filesCount}个`,
            files: project.files || [] // 保留原始files字段
          };
        });
        console.log("格式化后的文件夹列表(旧格式):", formattedProjects);
        setProjects(formattedProjects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      // 检查是否是API密钥问题
      if ((error as Error).message === 'API_KEY_NOT_SET') {
        // 当没有API密钥时，不显示错误提示，只设置空文件夹列表
        setProjects([]);
      } else if ((error as Error).message.includes('API密钥未设置') || (error as Error).message.includes('API密钥无效')) {
        toast.error('API密钥无效或未设置，请重新设置API密钥');
        setShowApiKeyModal(true);
      } else {
        // 其他错误，显示通用错误消息
        toast.error('获取文件夹列表失败，请稍后重试');
      }
      // 设置文件夹列表为空
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // 获取文件夹文件
  const fetchProjectFiles = async (projectId: string, projectName?: string) => {
    if (!projectId) return;
    
    setIsLoadingFiles(true);
    try {
      console.log(`获取文件夹 ${projectId} 的文件列表`);
      
      // 如果未提供文件夹名称，从文件夹列表获取
      let name = projectName;
      if (!name) {
        const project = projects.find(p => p.id === projectId);
        if (!project) {
          console.error(`未找到ID为 ${projectId} 的文件夹`);
          setFiles(prev => ({
            ...prev,
            [projectId]: []
          }));
          setIsLoadingFiles(false);
          return;
        }
        name = project.name;
      }
      
      console.log(`文件夹名称: ${name}`);
      
      // 使用文件服务获取文件夹文件列表，传递文件夹名称
      const response = await fileService.getProjectFiles(projectId, {
        page: 1,
        pageSize: 100,
        name: name, // 添加文件夹名称参数
        id: projectId // 添加文件夹名称参数
      });
      
      console.log("文件列表响应:", response);
      
      if (response.success && response.data) {
        // 直接打印files信息
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log("文件夹原始数据:", response.data[0]);
          console.log("文件夹的files字段:", response.data[0].files || []);
        }
        
        // 根据API返回结构提取文件列表
        let fileList: any[] = [];
        
        // 处理API响应结构：data是数组，第一个元素包含files属性
        if (Array.isArray(response.data) && response.data.length > 0) {
          const projectData = response.data[0];
          if (projectData && Array.isArray(projectData.files)) {
            fileList = projectData.files;
            console.log("从数组中提取到文件列表:", fileList);
          }
        } 
        // 其他可能的返回格式
        else if (response.data.files && Array.isArray(response.data.files)) {
          fileList = response.data.files;
          console.log("从对象中提取到文件列表:", fileList);
        }
        
        console.log("最终提取的文件列表:", fileList);
        
        // 格式化文件数据
        const formattedFiles = fileList.map((file: any) => {
          // 调试日志
          console.log("处理单个文件数据:", file);
          
          return {
            id: file.file_id ? file.file_id.toString() : '0',
            name: file.filename || '',
            size: file.size ? formatFileSize(file.size) : '未知大小',
            date: file.created_at ? new Date(file.created_at).toLocaleString() : '未知时间',
            extension: (file.file_name || '').split('.').pop() || '',
            downloadUrl: file.url || ''
          };
        });
        
        console.log("格式化后的文件列表:", formattedFiles);
        
        // 更新文件列表
        setFiles(prev => ({
          ...prev,
          [projectId]: formattedFiles
        }));
      } else {
        console.error("获取文件夹文件失败:", response.error);
        setFiles(prev => ({
          ...prev,
          [projectId]: []
        }));
      }
    } catch (error) {
      console.error("获取文件夹文件发生错误:", error);
      setFiles(prev => ({
        ...prev,
        [projectId]: []
      }));
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 获取百度网盘转存任务列表
  const fetchBaiduPanTasks = async () => {
    try {
      const response = await fileService.getBaiduPanTasks();
      
      if (response.success && response.data) {
        // 确保任务有唯一标识，生成UUID
        const tasksWithIds = response.data.map((task, index) => ({
          ...task,
          // 添加一个完全唯一的内部id属性用于列表渲染
          _internalId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
        }));
        setBaiduTasks(tasksWithIds);
      } else {
        console.error('获取百度网盘转存任务失败:', response.error);
      }
    } catch (error) {
      console.error('获取百度网盘转存任务错误:', error);
    }
  };

  // 获取百度网盘转存任务状态文本
  const getBaiduTaskStatusText = (status: number): string => {
    switch (status) {
      case 0: return '未开始';
      case 1: return '转存中';
      case 2: return '转存成功';
      case 3: return '转存失败';
      case 4: return '下载中';
      case 5: return '下载成功';
      case 6: return '下载失败';
      default: return '未知状态';
    }
  };
  
  // 获取转存任务状态颜色
  const getBaiduTaskStatusColor = (status: number): string => {
    switch (status) {
      case 0: return 'bg-gray-500';
      case 1: return 'bg-blue-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-red-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      case 6: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // 获取转存任务进度
  const getBaiduTaskProgress = (status: number): number => {
    switch (status) {
      case 0: return 5;
      case 1: return 30;
      case 2: return 100;
      case 3: return 0;
      case 4: return 65;
      case 5: return 100;
      case 6: return 0;
      default: return 0;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 计算总体上传进度百分比
  const getTotalUploadProgress = () => {
    if (totalUploadSize === 0) return 0;
    return Math.min(Math.round((uploadedSize / totalUploadSize) * 100), 100);
  };

  // 在组件挂载时检查API密钥并获取任务列表
  useEffect(() => {
    const checkApiKeyAndFetchTasks = async () => {
      // 检查是否有API密钥
      const apiKey = localStorage.getItem('narrator_api_key');
      if (apiKey) {
        try {
          // 获取任务列表
          const { items: tasks } = await taskService.getTasks(
            {
              page: 1,
              limit: 100,
            }
          );
          console.log('页面加载时获取到的任务列表:', tasks);
          
          // 触发任务列表更新事件，通知侧边栏更新
          const updateTasksEvent = new CustomEvent('updateTasksList', {
            detail: { tasks }
          });
          window.dispatchEvent(updateTasksEvent);
        } catch (error) {
          console.error('自动获取任务列表失败:', error);
        }
      }
    };
    
    // 执行检查和获取任务
    checkApiKeyAndFetchTasks();
  }, []);

  // 初始化时加载文件夹列表
  useEffect(() => {
    // 避免任何可能的未捕获错误
    try {
      // 检查是否存在API密钥
      const apiKey = localStorage.getItem('narrator_api_key');
      
      // 如果存在API密钥，则先验证它的有效性，然后再加载文件夹列表
      if (apiKey) {
        // 验证API密钥
        apiClient.validateApiKey(apiKey)
          .then(() => {
            // API密钥验证成功，加载文件夹列表
            fetchProjects().catch(e => {
              console.log('加载文件夹失败，但不显示错误:', e);
              setProjects([]);
            });
          })
          .catch((error) => {
            console.log('API密钥验证失败，不加载文件夹列表', error);
            // API密钥验证失败，将文件夹列表设置为空
            setProjects([]);
          });
      } else {
        // 没有API密钥，将文件夹列表设置为空
        setProjects([]);
        console.log('初始化：未设置API密钥，不加载文件夹列表');
      }
    } catch (error) {
      // 捕获任何其他可能的错误
      console.log('初始化过程中出现错误，但不显示给用户:', error);
      setProjects([]);
    }
  }, []);

  // 切换文件夹选择状态
  const toggleProjectSelection = (id: string) => {
    setProjects(prev => 
      prev.map(project => {
        // 单选逻辑：取消其他文件夹的选择
        if (project.id === id) {
          return { ...project, selected: !project.selected };
        } else {
          return { ...project, selected: false };
        }
      })
    );
  };

  // 确认文件夹选择
  const confirmProjectSelection = () => {
    const selected = projects.find(p => p.selected);
    if (selected) {
      // 检查选中的文件夹是否有文件
      if (selected.fileCount === '0个' || selected.fileCount === '共0个') {
        toast.warning("选择的文件夹内没有文件，需要上传文件");
        return;
      }
      setSelectedProject(selected);
      setShowProjectModal(false);
    }
  };

  // 开始重命名文件
  const startRenameFile = (projectId: string, fileId: string, currentName: string) => {
    setEditingFileName(currentName);
    setFiles(prev => {
      const projectFiles = [...(prev[projectId] || [])];
      return {
        ...prev,
        [projectId]: projectFiles.map(file => 
          file.id === fileId 
            ? { ...file, editing: true } 
            : { ...file, editing: false }
        )
      };
    });
  };

  // 完成重命名文件
  const finishRenameFile = async (projectId: string, fileId: string) => {
    if (!editingFileName.trim()) return;
    
    try {
      // 调用API重命名文件
      const response = await fileService.renameFile(fileId, editingFileName);
      
      if (response.success) {
        toast.success('文件重命名成功');
        
        // 更新前端状态
        setFiles(prev => {
          const projectFiles = [...(prev[projectId] || [])];
          return {
            ...prev,
            [projectId]: projectFiles.map(file => 
              file.id === fileId 
                ? { ...file, name: editingFileName, editing: false } 
                : file
            )
          };
        });
      } else {
        toast.error(`重命名文件失败: ${response.error || '未知错误'}`);
        // 重置编辑状态但不更改文件名
        setFiles(prev => {
          const projectFiles = [...(prev[projectId] || [])];
          return {
            ...prev,
            [projectId]: projectFiles.map(file => 
              file.id === fileId ? { ...file, editing: false } : file
            )
          };
        });
      }
    } catch (error) {
      console.error('重命名文件时发生错误:', error);
      toast.error('重命名文件失败，请稍后重试');
      
      // 重置编辑状态
      setFiles(prev => {
        const projectFiles = [...(prev[projectId] || [])];
        return {
          ...prev,
          [projectId]: projectFiles.map(file => 
            file.id === fileId ? { ...file, editing: false } : file
          )
        };
      });
    }
  };

  // 删除文件
  const handleDeleteFile = async (projectId: string, fileId: string) => {
    try {
      // 显示确认对话框
      if (!confirm('确定要删除这个文件吗？此操作不可恢复。')) {
        return;
      }
      
      // 调用API删除文件
      const response = await fileService.deleteFile(fileId);
      
      if (response.success) {
        toast.success('文件删除成功');
        
        // 更新文件列表，过滤掉被删除的文件
        const projectFiles = files[projectId] || [];
        const updatedFiles = projectFiles.filter(file => file.id !== fileId);
        
        setFiles(prev => ({
          ...prev,
          [projectId]: updatedFiles
        }));
        
        // 更新文件夹的文件计数
        setProjects(prev => 
          prev.map(project => 
            project.id === projectId 
              ? { 
                  ...project, 
                  fileCount: `共${updatedFiles.length}个`,
                  files: project.files?.filter(f => f.file_id !== projectId) || [] // 更新文件夹的files字段
                } 
              : project
          )
        );
      } else {
        toast.error(`删除文件失败: ${response.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除文件时发生错误:', error);
      toast.error('删除文件失败，请稍后重试');
    }
  };

  // 处理文件拖拽
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, projectId: string) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // 处理拖拽的文件
      uploadFiles(projectId, Array.from(e.dataTransfer.files));
    }
  };

  // 选择功能时，保存到当前对话
  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    
    // 根据选择的功能设置对应的任务类型
    const selectedFeature = featureCards.find(card => card.id === featureId);
    if (selectedFeature && selectedFeature.taskType) {
      setTestTaskType(selectedFeature.taskType);
    }
    
    // 重置其他状态
    setShowResult(false);
    setShowWorkflow(false);
    
    // 如果有当前对话，保存选中的功能
    if (currentChatId) {
      setChatData(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          id: currentChatId,
          feature: featureId
        }
      }));
    }
  };

  // 获取当前任务类型是否支持风格提示
  const hasStylePromptSupport = () => {
    // 只有视频翻译和SRT翻译支持风格提示
    return testTaskType === 'video_translation' || testTaskType === 'srt_translation';
  };

  // 用于自动调整文本域高度的ref和函数
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 重置高度，以便正确计算新高度
      textarea.style.height = 'auto';
      // 设置新高度
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // 在组件挂载和inputText变化时调整文本框高度
  // useEffect(() => {
  //   adjustTextareaHeight();
  // }, [inputText]);

  // 处理输入变化，保存到当前对话并更新风格提示
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    setInputText(newInput);
    
    // 调整文本域高度，暂时不需要，固定高度，滑动
    // adjustTextareaHeight();
    
    // 如果当前任务类型支持风格提示，更新设置
    if (hasStylePromptSupport() && testSettings) {
      const updatedSettings = {
        ...testSettings,
        stylePrompt: newInput
      };
      setTestSettings(updatedSettings);
    }
    
    // 如果有当前对话，保存输入内容
    if (currentChatId) {
      setChatData(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          id: currentChatId,
          input: newInput,
          feature: prev[currentChatId]?.feature || selectedFeature
        }
      }));
    }
  };

  // 处理对话选择，加载对话数据
  const handleChatSelect = async (id: string, isNew: boolean = false) => {
    // 先保存当前对话的状态
    if (currentChatId) {
      setChatData(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId] || {},
          id: currentChatId,
          feature: selectedFeature,
          input: inputText,
          result: result || ""
        }
      }));
    }
    
    // 然后设置新的对话ID
    setCurrentChatId(id);
    
    // 如果是新创建的对话，重置所有状态
    if (isNew) {
      // 重置功能选择为视频翻译
      setSelectedFeature("video-translate");
      // 清空输入和结果
      setInputText("");
      setResult("");
      setShowResult(false);
      setShowWorkflow(false);
      
      // 创建新的空白对话数据
      setChatData(prev => ({
        ...prev,
        [id]: {
          id,
          feature: "video-translate",
          input: "",
          result: ""
        }
      }));
      
      // 为sidebar组件添加新会话信息
      const newSessionEvent = new CustomEvent('newSession', { 
        detail: { 
          id: id, 
          title: `新对话 ${new Date().toLocaleString('zh-CN', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`, 
          date: new Date().toISOString().split('T')[0], 
          language: "中译英" 
        } 
      });
      window.dispatchEvent(newSessionEvent);
      
      return;
    }
    
    // 如果不是新创建的对话，尝试获取任务信息
    try {
      // 尝试从任务服务获取任务详情
      const response = await taskService.getTasks({ page: 1, limit: 100 });
      console.log('获取到的任务列表:', response);
      
      // 找到当前选中的任务
      const selectedTask = response.items.find((task: any) => task.id.toString() === id);
      console.log('选中的任务:', selectedTask);
      
      if (selectedTask) {
        // 根据任务类型设置工作流类型
        const taskType = selectedTask.task_type || selectedTask.taskType || selectedTask.cardType;
        console.log('任务类型:', taskType);
        
        // 设置工作流类型并显示工作流界面
        if (taskType === 'video_translation') {
          setWorkflowType('video-translation');
        } else if (taskType === 'srt_translation') {
          setWorkflowType('document-translation');
        } else if (taskType === 'text_translation') {
          setWorkflowType('text-translation');
        } else {
          // 默认视频翻译
          setWorkflowType('video-translation');
        }
        
        // 显示工作流界面
        setShowWorkflow(true);
        setShowResult(false);
        setIsSettingsSidebarOpen(false); // 关闭翻译设置侧边栏
        
        // 更新工作流组件中的任务信息
        const updateTaskEvent = new CustomEvent('updateActiveTask', {
          detail: {
            taskId: selectedTask.id,
            projectId: selectedTask.projectId || null,
            fileIds: selectedTask.fileIds || [],
            taskType: taskType
          }
        });
        window.dispatchEvent(updateTaskEvent);
      } else {
        // 如果在任务列表中找不到，则尝试加载聊天数据
        loadChatData(id);
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
      // 出错时回退到默认行为，加载聊天数据
      loadChatData(id);
    }
  };
  
  // 加载聊天数据的辅助函数
  const loadChatData = (id: string) => {
    // 检查是否已有该对话的数据
    if (chatData[id]) {
      // 如果有，加载该对话的数据
      const data = chatData[id];
      setSelectedFeature(data.feature);
      setInputText(data.input);
      setResult(data.result);
      setShowResult(!!data.result);
      setShowWorkflow(false);
    } else {
      // 如果是未保存的对话，创建新的空白数据
      setSelectedFeature("video-translate");
      setInputText("");
      setResult("");
      setShowWorkflow(false);
      
      setChatData(prev => ({
        ...prev,
        [id]: {
          id,
          feature: "video-translate",
          input: "",
          result: ""
        }
      }));
    }
  };

  // 监听滚动事件和检查溢出
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      // 如果滚动位置大于0，显示左箭头，否则隐藏
      setShowLeftArrow(scrollContainerRef.current.scrollLeft > 10);
      
      // 检查是否有右侧溢出内容
      const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current;
      
      // 只有在内容宽度大于容器宽度，且未滚动到最右侧时才显示右箭头
      setShowRightArrow(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth);
    }
  };

  // 滚动到左侧
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  // 滚动到右侧
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // 获取当前选中功能的占位符文本
  const getPlaceholder = () => {
    const feature = featureCards.find(card => card.id === selectedFeature);
    return feature ? feature.placeholder : "请输入内容...";
  };

  // 获取当前选中功能的标题
  const getHeadline = () => {
    const feature = featureCards.find(card => card.id === selectedFeature);
    return feature ? feature.headline : "上传文件即可一键翻译！";
  };

  // 当选择文件夹时，加载文件夹文件
  useEffect(() => {
    if (currentProjectId) {
      const project = projects.find(p => p.id === currentProjectId);
      const projectName = project?.name || '';
      fetchProjectFiles(currentProjectId, projectName);
    }
  }, [currentProjectId]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 用于文本输入的状态和事件处理
  const [tagGroupIndex, setTagGroupIndex] = useState<number>(0); // 添加标签组索引状态

  // 处理标签刷新点击事件
  const handleRefreshTags = () => {
    const allTags = getPresetTags();
    const totalGroups = Math.ceil(allTags.length / 4);
    setTagGroupIndex((prevIndex) => (prevIndex + 1) % totalGroups);
  };

  // 获取当前显示的标签组
  const getCurrentTagGroup = () => {
    const allTags = getPresetTags();
    const startIndex = tagGroupIndex * 4;
    return allTags.slice(startIndex, startIndex + 4);
  };

  // 检查卡片是否溢出容器
  const checkOverflow = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current;
      
      // 检查是否有左侧滚动
      setShowLeftArrow(scrollLeft > 10);
      
      // 检查是否有右侧溢出内容
      const isScrollEnd = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 10;
      
      // 只有在内容宽度大于容器宽度，且未滚动到最右侧时才显示右箭头
      setShowRightArrow(scrollWidth > clientWidth && !isScrollEnd);
    }
  }, []);

  // 组件挂载和窗口尺寸变化时检查溢出
  useEffect(() => {
    // 初始检查
    checkOverflow();
    
    // 添加窗口尺寸变化监听，以便在窗口调整大小时重新检查
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [checkOverflow]);

  // 文件上传
  const uploadFiles = async (projectId: string, uploadedFiles: File[]) => {
    checkApiKeyBeforeAction(async () => {
      try {
        // 清空之前的进度
        setUploadProgress({});
        setIsUploading(true);
        
        // 计算总上传大小
        const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
        setTotalUploadSize(totalSize);
        setUploadedSize(0);
        
        // 准备上传文件信息以在UI中显示
        const filesInfo = uploadedFiles.map((file, index) => ({
          id: `${projectId}-${index}-${file.name}`,
          name: file.name,
          size: file.size
        }));
        setUploadingFiles(filesInfo);
        
        // 跟踪已上传的文件ID，用于更新UI
        const fileIdentifiers = filesInfo.map(file => file.id);
        const initialProgress: {[key: string]: number} = {};
        fileIdentifiers.forEach(id => {
          initialProgress[id] = 0;
        });
        setUploadProgress(initialProgress);
        
        // 调用上传服务，传递进度回调
        const response = await fileService.uploadFiles({
          file_set_id: projectId,
          files: uploadedFiles
        }, {
          onProgress: (percentage, loaded, total) => {
            // 更新总体进度
            setUploadedSize(loaded);
            
            // 由于后端可能不会为每个文件单独报告进度，我们在这里更新整体进度
            const updatedProgress: {[key: string]: number} = { ...initialProgress };
            fileIdentifiers.forEach(id => {
              updatedProgress[id] = percentage;
            });
            setUploadProgress(updatedProgress);
            
            console.log(`上传进度: ${percentage}%, 已上传: ${formatFileSize(loaded)}, 总大小: ${formatFileSize(total)}`);
          },
          onComplete: async (resp) => {
            if (resp.success) {
              toast("文件上传成功");
              
              // 上传成功后刷新数据
              if (projectId) {
                console.log('上传成功，刷新文件夹和文件列表');
                
                // 先刷新整个文件夹列表
                await fetchProjects().catch(error => {
                  console.error('刷新文件夹列表失败:', error);
                });
                
                // 获取文件夹名称
                const projectInfo = projects.find(p => p.id === projectId);
                const projectName = projectInfo?.name || '';
                
                // 再刷新当前文件夹的文件列表
                await fetchProjectFiles(projectId, projectName);
                
                // 关闭上传弹窗，打开文件管理弹窗
                setShowUploadModal(false);
                setShowFileModal(true);
              }
            }
            setIsUploading(false);
          },
          onError: (error) => {
            toast(`上传失败: ${error}`);
            setIsUploading(false);
          }
        });
        
        if (response.data) {
          const newFiles = Array.isArray(response.data) 
            ? response.data.map((file: any) => ({
                id: file.id ? file.id.toString() : '0',
                name: file.name || '未命名文件',
                size: formatFileSize(file.size || 0),
                date: file.createTime ? new Date(file.createTime).toLocaleString() : new Date().toLocaleString()
              }))
            : [{
                id: response.data.id ? response.data.id.toString() : '0',
                name: response.data.name || '未命名文件',
                size: formatFileSize(response.data.size || 0),
                date: response.data.createTime ? new Date(response.data.createTime).toLocaleString() : new Date().toLocaleString()
              }];
        }
      } catch (error) {
        console.error('上传文件失败:', error);
        toast(`上传文件失败，请稍后重试`);
        setIsUploading(false);
      }
    });
  };

  // 从文本中提取百度网盘链接和提取码
  const extractBaiduPanLink = (text: string): string => {
    // 首先检查是否是一个完整的链接（包含提取码）
    const fullLinkRegex = /(https?:\/\/pan\.baidu\.com\/s\/[a-zA-Z0-9_-]+\?pwd=[a-zA-Z0-9]+)/;
    const fullLinkMatch = text.match(fullLinkRegex);
    
    if (fullLinkMatch) {
      console.log('检测到完整链接:', fullLinkMatch[1]);
      return fullLinkMatch[1]; // 如果是完整链接，直接返回
    }
    
    // 提取链接部分
    const linkRegex = /(https?:\/\/pan\.baidu\.com\/s\/[a-zA-Z0-9_-]+)/;
    const linkMatch = text.match(linkRegex);
    
    if (!linkMatch) {
      console.log('未检测到百度网盘链接，返回原文本');
      return text; // 如果没有匹配到链接，返回原文本
    }
    
    const link = linkMatch[1];
    console.log('提取到的链接:', link);
    
    // 提取提取码
    // 尝试匹配几种常见的提取码格式：
    // 1. ?pwd=xxxx 已经在链接中的格式
    // 2. 提取码: xxxx 中文冒号格式
    // 3. 提取码：xxxx 中文冒号格式（全角）
    // 4. 密码: xxxx 可能的替代表述
    // 5. 密码：xxxx 可能的替代表述（全角）
    // 6. 提取码xxxx 无分隔符格式
    
    // 首先检查链接是否已包含提取码
    if (link.includes('?pwd=')) {
      console.log('链接已包含提取码');
      return link;
    }
    
    // 尝试匹配提取码
    const pwdRegex = /(?:提取码|密码)[：:]\s*([a-zA-Z0-9]{4})/;
    const pwdMatch = text.match(pwdRegex);
    
    if (pwdMatch) {
      // 找到提取码，添加到链接
      console.log('找到提取码:', pwdMatch[1]);
      return `${link}?pwd=${pwdMatch[1]}`;
    }
    
    // 尝试匹配没有冒号的格式
    const simplePwdRegex = /(?:提取码|密码)\s*([a-zA-Z0-9]{4})/;
    const simplePwdMatch = text.match(simplePwdRegex);
    
    if (simplePwdMatch) {
      console.log('找到无冒号格式提取码:', simplePwdMatch[1]);
      return `${link}?pwd=${simplePwdMatch[1]}`;
    }
    
    // 如果没有找到提取码，返回原始链接
    console.log('未找到提取码，返回原始链接');
    return link;
  };

  return (
    <div className="flex min-h-screen">
      {/* 原有的侧边栏 */}
      <Sidebar 
        onCollapsedChange={setIsSidebarCollapsed} 
        onSelectChat={handleChatSelect}
        currentChatId={currentChatId}
      />
      
      {/* 主内容区域 */}
      <div className={`flex-1 chat-container transition-all duration-300 h-screen ${isSidebarCollapsed ? 'ml-16' : 'ml-0'}`}>
        {(showResult) ? (
          // 结果显示界面
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 chat-container">
            <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
              {/* 标题栏 */}
              <div className="py-4 px-6 border-b flex items-center sticky top-0 bg-white dark:bg-gray-950 z-10 chat-header">
                <h2 className="text-xl font-semibold flex items-center">
                  {selectedFeature === 'translate' && <FileVideo className="h-5 w-5 mr-2 text-blue-500" />}
                  {selectedFeature === 'grammar' && <FileUp className="h-5 w-5 mr-2 text-green-500" />}
                  {getFeatureName()}
                </h2>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-full h-8">
                    <Copy className="h-4 w-4 mr-1" /> 复制
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full h-8">
                    <Download className="h-4 w-4 mr-1" /> 导出
                  </Button>
                </div>
              </div>
              
              {/* 对话内容区 */}
              <div 
                ref={chatContentRef}
                className="flex-1 overflow-y-auto px-4 py-6" 
                style={{ height: 'calc(100vh - 70px)' }}
              >
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* 用户消息 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 ml-14">
                      <span className="text-sm font-medium text-gray-500">用户</span>
                      <span className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg rounded-tl-none p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{inputText}</p>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-400">文件夹: {selectedProject?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 系统响应 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 ml-14">
                      <span className="text-sm font-medium text-primary">NarratorAI</span>
                      <span className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 bg-primary/5 dark:bg-gray-800 border border-primary/10 dark:border-primary/20 rounded-lg rounded-tl-none p-4 shadow-sm">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-md">
                            <Copy className="h-3.5 w-3.5 mr-1" /> 复制
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs rounded-md">
                            <Download className="h-3.5 w-3.5 mr-1" /> 保存
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : showWorkflow ? (
          // 工作流界面
          <div className="content-area">
            <WorkflowSteps />
          </div>
        ) : (
          // 编辑模式界面
          <div className="flex flex-col chat-container">
            {/* 功能卡片区域 - 固定在顶部，与侧边栏开启新对话按钮的上方边框对齐 */}
            <div className="w-full border-b feature-cards" style={{ 
              paddingTop: '1rem',  
              paddingBottom: '1rem', 
              paddingLeft: '0.5rem', 
              paddingRight: '0.5rem',
              borderTop: '1px solid transparent' 
            }}>
              <div className="relative px-1 max-w-[calc(100%-1rem)] mx-auto">
                {/* 左箭头 - 只有当showLeftArrow为true时才显示 */}
                {showLeftArrow && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background rounded-full shadow-md"
                    onClick={scrollLeft}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                
                {/* 卡片容器 - 主要功能 */}
                <div 
                  ref={scrollContainerRef} 
                  className="flex overflow-x-hidden gap-4 py-2 px-1 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onScroll={handleScroll}
                >
                  {mainFeatures.map((card) => (
                    <div 
                      key={card.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex-shrink-0 w-[250px] ${
                        selectedFeature === card.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-card hover:bg-muted/50 border border-border'
                      }`}
                      onClick={() => handleFeatureSelect(card.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-full ${
                          selectedFeature === card.id 
                            ? 'bg-primary/20' 
                            : 'bg-muted'
                        }`}>
                          {card.icon}
                        </div>
                        <h3 className="font-medium text-sm">{card.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                    </div>
                  ))}
                </div>
                
                {/* 工具箱按钮 */}
                <div className="absolute -right-2 -bottom-10 transform z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="bg-background rounded-md shadow-md text-xs flex items-center gap-1 h-8 px-3"
                      >
                        <span>工具箱</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-[320px] p-3"
                    >
                      <div className="space-y-2">
                        {toolFeatures.map((card) => (
                          <DropdownMenuItem 
                            key={card.id}
                            className="flex flex-col items-start p-3 cursor-pointer hover:bg-muted rounded-lg"
                            onClick={() => handleFeatureSelect(card.id)}
                          >
                            <div className="flex items-center gap-2 mb-1 w-full">
                              <div className="p-1.5 rounded-full bg-muted/80">
                                {card.icon}
                              </div>
                              <h3 className="font-medium text-sm">{card.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground pl-7">{card.description}</p>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* 右箭头 - 只有当有右侧溢出内容时才显示 */}
                {showRightArrow && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute -right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background rounded-full shadow-md"
                    onClick={scrollRight}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* 对话框区域 */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-3xl mx-auto">
                {/* 标题区域 */}
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold">{getHeadline()}</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    选择不同功能，体验智能翻译的无限可能
                  </p>
                </div>
                
                <Card className="w-full border-0 shadow-none">
                  <CardContent className="p-0">
                    <div className="border rounded-lg p-8 shadow-sm bg-card">
                      <div className="relative">
                        {selectedFeature && (
                          <div className="absolute top-3 left-3 z-10">
                            <div className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {mainFeatures.find(card => card.id === selectedFeature)?.icon}
                              <span className="ml-1.5">{mainFeatures.find(card => card.id === selectedFeature)?.title}</span>
                            </div>
                          </div>
                        )}
                        <textarea 
                          ref={textareaRef}
                          className={`w-full min-h-[196px] p-4 pt-10 mb-6 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none resize-none overflow-y-auto ${!hasStylePromptSupport() ? 'bg-gray-100' : ''}`} 
                          placeholder={hasStylePromptSupport() ? getPlaceholder() : "此任务类型不需要风格提示"}
                          value={inputText}
                          onChange={handleInputChange}
                          disabled={!hasStylePromptSupport()}
                        />
                      </div>
                      
                      {/* 预设标签区域 - 只在支持风格提示的任务类型下显示 */}
                      {hasStylePromptSupport() && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500">快速输入：</p>
                            <button
                              onClick={handleRefreshTags}
                              className="flex items-center text-xs text-gray-500 hover:text-primary transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                <path d="M8 16H3v5" />
                              </svg>
                              换一批
                            </button>
                          </div>
                          <div className="flex overflow-x-auto pb-2 hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <div className="flex gap-2 flex-nowrap">
                              {getCurrentTagGroup().map((tag, index) => (
                                <button
                                  key={index}
                                  className="px-3 py-1.5 text-xs whitespace-nowrap rounded-full bg-transparent hover:bg-primary/20 transition-colors border border-gray-200 text-gray-700 hover:border-primary/30"
                                  onClick={() => handleTagClick(tag)}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-6">
                        {/* 按钮行 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* 上传文件按钮和下拉菜单 */}
                            <div className="relative">
                              <Button 
                                variant={selectedProject ? "default" : "outline"} 
                                size="sm"
                                className={selectedProject ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" : ""}
                                onClick={() => {
                                  if (selectedProject) {
                                    // 如果已选择文件夹，直接打开文件夹选择模态框
                                    openProjectModal();
                                  } else {
                                    // 未选择文件夹，显示下拉菜单
                                    setShowUploadDropdown(prev => !prev);
                                  }
                                }}
                              >
                                <FileUp className="h-4 w-4 mr-1" /> 
                                {selectedProject ? `已选择: ${selectedProject.name.length > 10 ? selectedProject.name.substring(0, 10) + '...' : selectedProject.name}` : '上传文件'}
                              </Button>
                              
                              {!selectedProject && showUploadDropdown && (
                                <div className="absolute bottom-full left-0 mb-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border overflow-hidden z-20">
                                  <button 
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={openProjectModal}
                                  >
                                    选择文件夹
                                  </button>
                                  <button 
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={openProjectModal}
                                  >
                                    上传文件
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={toggleSettingsSidebar}
                              className="shadow-sm hover:shadow"
                            >
                              <Settings className="h-4 w-4 mr-1" /> 翻译设置
                            </Button>
                          </div>
                          <Button 
                            disabled={!inputText.trim() || isSubmitting || !selectedProject}
                            onClick={handleSubmit}
                            size="icon"
                            className="rounded-full"
                          >
                            {isSubmitting ? (
                              <span className="animate-spin h-5 w-5 border-t-2 border-primary rounded-full" />
                            ) : (
                              <ArrowUp className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                        
                        {/* 未选择文件夹提示 */}
                        {!selectedProject && (
                          <div className="p-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 rounded-md flex items-center space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <div className="text-sm">
                              <span className="font-medium text-orange-800 dark:text-orange-300">需要选择文件夹</span>
                              <span className="ml-1 text-orange-700 dark:text-orange-400">
                                请
                                <button 
                                  className="underline px-1 font-medium hover:text-orange-900" 
                                  onClick={openProjectModal}
                                >
                                  选择一个文件夹
                                </button>
                                后再开始处理                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 右侧设置侧边栏 */}
      <SettingsSidebar 
        isOpen={isSettingsSidebarOpen} 
        onToggle={toggleSettingsSidebar}
        taskType={testTaskType}
        onSettingsChange={handleSettingsChange}
      />
      
      {/* 文件夹管理弹窗 */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>我的文件夹</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {/* {projects.find(p => p.id === currentProjectId)?.name || ""} */}
            </p>
          </DialogHeader>
          
          <div className="px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500">选择一个文件夹进行操作</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={openCreateProjectModal}
              className="shadow-sm hover:shadow"
            >
              <Plus className="h-4 w-4 mr-1" /> 创建文件夹
            </Button>
          </div>
          
          <div className="px-6 py-2 overflow-auto max-h-[50vh]">
            <Table className="border rounded-md">
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-[40px] text-center"></TableHead>
                  <TableHead>文件夹名称</TableHead>
                  <TableHead>文件数量</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow 
                    key={project.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors h-[52px] ${project.selected || project.id === selectedProject?.id ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  >
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={!!project.selected}
                        onChange={() => toggleProjectSelection(project.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </TableCell>
                    <TableCell className={`font-medium ${project.selected ? 'text-primary' : ''}`}>
                      <div 
                        className="max-w-[200px] truncate" 
                        title={project.name}
                      >
                        {project.name.length > 15 
                          ? `${project.name.substring(0, 15)}...` 
                          : project.name
                        }
                      </div>
                      {project.id === selectedProject?.id && !project.selected && (
                        <span className="ml-2 text-xs text-primary font-normal">(当前已选)</span>
                      )}
                    </TableCell>
                    <TableCell>{project.fileCount}</TableCell>
                    <TableCell className="text-sm text-gray-500">{project.createTime}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        {!project.selected && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-500 h-8"
                              onClick={openUploadModal(project.id)}
                            >
                              <FileUp className="h-3.5 w-3.5 mr-1" /> 上传
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-500 h-8"
                              onClick={() => openFileModal(project.id)}
                            >
                              <File className="h-3.5 w-3.5 mr-1" /> 管理
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="px-6 py-4 border-t flex justify-end">
            <Button 
              variant="default" 
              onClick={confirmProjectSelection}
              disabled={!projects.some(p => p.selected)}
              className="shadow-sm hover:shadow"
            >
              确认选择
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 创建文件夹弹窗 */}
      <Dialog open={showCreateProjectModal} onOpenChange={setShowCreateProjectModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>创建新文件夹</DialogTitle>
            <DialogDescription>
              输入新文件夹名称。创建后可以上传视频、字幕等文件。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                文件夹名称
              </Label>
              <Input
                id="project-name"
                placeholder="输入文件夹名称"
                className="col-span-3"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProjectModal(false)} disabled={isCreatingProject}>
              取消
            </Button>
            <Button 
              type="submit" 
              onClick={createProject}
              disabled={!newProjectName.trim() || isCreatingProject}
            >
              {isCreatingProject ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  创建中...
                </>
              ) : "创建文件夹"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 上传文件弹窗 */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>
              {currentProjectId && projects.find(p => p.id === currentProjectId)?.name 
                ? `上传文件到 ${projects.find(p => p.id === currentProjectId)?.name}` 
                : '上传文件'}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              支持多种文件格式，推荐大小不超过500MB
            </p>
          </DialogHeader>
          
          {/* 上传类型选择器 */}
          <div className="px-6 pt-4 mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex w-full">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${uploadType === 'file' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                onClick={() => setUploadType('file')}
              >
                文件上传
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${uploadType === 'baidu' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                onClick={() => setUploadType('baidu')}
              >
                百度网盘转存
              </button>
            </div>
          </div>
          
          {/* 文件上传区域 */}
          {uploadType === 'file' && (
          <div
            className={`px-6 py-10 border-2 border-dashed rounded-lg text-center mx-6 my-4 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => currentProjectId && handleDrop(e, currentProjectId)}
          >
            <div className={`transition-transform ${isDragging ? 'scale-110' : ''}`}>
              <div className="h-14 w-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileUp className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">拖放文件到此处上传</h3>
              <p className="text-sm text-gray-500 mb-6">支持MP4竖屏视频、SRT字幕上传，单个大小≤400M</p>
              <p className="text-sm text-gray-500 mb-6">文件按顺序命名，如短剧名1.mp4、短剧名2.mp4、短剧名1.srt、短剧名2.srt；同文件夹内序号不能重复</p>              
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0 && currentProjectId) {
                    uploadFiles(currentProjectId, Array.from(e.target.files));
                  }
                }}
              />
              <Button 
                variant="default" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="shadow-sm hover:shadow"
              >
                <File className="h-4 w-4 mr-1" /> 选择文件
              </Button>
            </div>
          </div>
          )}
          
          {/* 百度网盘转存区域 */}
          {uploadType === 'baidu' && (
          <div className="px-6 py-10 border-2 border-dashed rounded-lg mx-6 my-4 transition-colors border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="h-14 w-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CloudIcon className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">百度网盘转存</h3>
              <p className="text-sm text-gray-500 mb-6">
                输入百度网盘的分享链接，系统将自动转存并下载文件
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baiduLink">百度网盘链接</Label>
                <div className="flex gap-2">
                  <Input
                    id="baiduLink"
                    placeholder="粘贴百度网盘分享的完整文本，如: 链接: https://pan.baidu.com/s/xxx 提取码: xxxx"
                    value={baiduLinkInput}
                    onChange={(e) => setBaiduLinkInput(e.target.value)}
                    disabled={isSavingBaiduLink}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  可直接粘贴完整分享文本，系统会自动提取链接和提取码
                </p>
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBaiduTasksModal(true);
                    fetchBaiduPanTasks(); // 刷新任务列表
                  }}
                  disabled={isSavingBaiduLink}
                >
                  查看转存任务
                </Button>
                <Button
                  disabled={!baiduLinkInput || isSavingBaiduLink}
                  onClick={() => currentProjectId && saveBaiduPanFile(currentProjectId, baiduLinkInput)}
                >
                  {isSavingBaiduLink ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : "提交转存"}
                </Button>
              </div>
            </div>
          </div>
          )}
          
          {/* 上传进度区域 */}
          {isUploading && (
            <div className="px-6 mb-6">
              <div className="space-y-3">
                {/* 单个文件进度 */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  <h4 className="text-sm font-medium">上传进度</h4>
                  {uploadingFiles.map((file) => (
                    <div key={file.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate" style={{maxWidth: "70%"}} title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-gray-500">{uploadProgress[file.id] || 0}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300 ease-in-out" 
                          style={{ width: `${uploadProgress[file.id] || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t flex justify-between bg-gray-50 dark:bg-gray-800/50 mt-auto">
            <Button 
              variant="outline" 
              onClick={() => {
                if (!isUploading) {
                  setShowUploadModal(false);
                  setShowProjectModal(true);
                }
              }}
              className="shadow-sm hover:shadow"
              disabled={isUploading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> 返回文件夹列表
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                if (!isUploading) {
                  setShowUploadModal(false);
                  setShowFileModal(true);
                }
              }}
              className="shadow-sm hover:shadow"
              disabled={isUploading}
            >
              查看已上传文件 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 百度网盘转存弹窗 */}
      <Dialog open={showBaiduTasksModal} onOpenChange={setShowBaiduTasksModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>百度网盘转存任务</DialogTitle>
            <DialogDescription>
              显示最近二十条转存任务及其状态
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 overflow-y-auto">
            {baiduTasks.length > 0 ? (
              <div className="space-y-3">
                {baiduTasks.map((task, index) => (
                  <div key={task._internalId} className="space-y-1 p-3 border rounded-md">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-700 truncate" style={{maxWidth: "70%"}} title={task.link}>
                        {task.link}
                      </span>
                      <span className={`font-medium ${task.status === 2 || task.status === 5 ? 'text-green-500' : task.status === 3 || task.status === 6 ? 'text-red-500' : 'text-blue-500'}`}>
                        {getBaiduTaskStatusText(task.status)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full ${getBaiduTaskStatusColor(task.status)} transition-all duration-300 ease-in-out`} 
                        style={{ width: `${getBaiduTaskProgress(task.status)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      文件夹ID: {task.file_set_id}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CloudOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>暂无转存任务</p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 mt-auto">
            <div className="text-xs text-gray-500">
              转存任务完成后，文件将自动添加到文件夹中
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBaiduTasksModal(false)}
              >
                关闭
              </Button>
              <Button 
                variant="default" 
                onClick={async () => {
                  await fetchBaiduPanTasks();
                  toast("转存任务列表已刷新");
                }}
              >
                刷新任务列表
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 文件管理弹窗 */}
      <Dialog open={showFileModal} onOpenChange={setShowFileModal}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>文件管理</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {projects.find(p => p.id === currentProjectId)?.name || ""}
            </p>
          </DialogHeader>
          
          <div 
            className="px-6 py-4 overflow-auto max-h-[50vh]"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => currentProjectId && handleDrop(e, currentProjectId)}
          >
            {currentProjectId && files[currentProjectId]?.length > 0 ? (
              <Table className="border rounded-md">
                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files[currentProjectId]?.map((file) => (
                    <TableRow key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell>
                        {file.editing ? (
                          <input 
                            type="text" 
                            value={editingFileName} 
                            onChange={(e) => setEditingFileName(e.target.value)}
                            onBlur={() => finishRenameFile(currentProjectId, file.id)}
                            onKeyDown={(e) => e.key === 'Enter' && finishRenameFile(currentProjectId, file.id)}
                            autoFocus
                            className="p-2 border rounded-md w-full focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="w-6 h-6 mr-2 flex-shrink-0">
                              {file.name.endsWith('.pdf') ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                              ) : file.name.endsWith('.mp4') || file.name.endsWith('.mov') ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 11 5 3-5 3v-6Z"/></svg>
                              ) : file.name.endsWith('.docx') ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                              )}
                            </span>
                            {file.name || file.fileName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          {!file.editing && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-500 h-8"
                                onClick={() => startRenameFile(currentProjectId, file.id, file.name)}
                              >
                                重命名
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 h-8"
                                onClick={() => handleDeleteFile(currentProjectId, file.id)}
                              >
                                删除
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed">
                <div className="h-14 w-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileUp className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">当前文件夹没有文件</h3>
                <p className="text-sm text-gray-500 mb-4">拖放文件到此区域或点击下方按钮上传</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowFileModal(false);
                    setShowUploadModal(true);
                  }}
                  className="shadow-sm hover:shadow"
                >
                  <FileUp className="h-4 w-4 mr-1" /> 上传文件
                </Button>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t flex justify-between bg-gray-50 dark:bg-gray-800/50">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFileModal(false);
                setShowProjectModal(true);
              }}
              className="shadow-sm hover:shadow"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> 返回文件夹列表
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                setShowFileModal(false);
                setShowUploadModal(true);
              }}
              className="shadow-sm hover:shadow"
            >
              上传更多文件 <FileUp className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 费用确认弹窗 */}
      <Dialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认任务</DialogTitle>
            <DialogDescription>
              请确认以下任务信息和点数消耗
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-medium">任务类型</span>
                <span>
                  {featureCards.find(card => card.taskType === selectedTaskType)?.title || "未知任务"}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">需消耗点数</span>
                <span className="text-lg font-semibold text-primary">{taskFee} 点</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">当前点数余额</span>
                <span className="text-lg font-semibold">{userBalance} 点</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400">
                  确认后将立即开始处理任务，处理过程中可能需要等待
                </p>
              </div>
              
              {/* 余额不足提示 */}
              {taskFee > userBalance && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">点数余额不足</p>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        您的当前点数余额不足以支付此任务，请充值后再试
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentConfirm(false)}>取消</Button>
            <Button 
              onClick={confirmPayment} 
              disabled={isSubmitting || taskFee > userBalance}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  处理中...
                </>
              ) : "确认支付"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* API密钥设置对话框 */}
      <Dialog open={showApiKeyModal} onOpenChange={(open) => {
        if (!open) {
          setShowApiKeyModal(false);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>设置API密钥</DialogTitle>
            <DialogDescription>
              请输入您的NarratorAI API密钥以继续使用应用功能
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right">
                API密钥
              </Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeyState(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveApiKey();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>取消</Button>
            <Button type="submit" onClick={handleSaveApiKey}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
