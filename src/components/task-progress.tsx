"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, FileText, Globe, Languages, Video, Loader2 } from 'lucide-react';

const taskTypes = {
  SUBTITLE: 'subtitle',
  LOCALIZATION: 'localization',
  TRANSLATION: 'translation',
  EDITING: 'editing'
};

// 为每种任务类型定义子任务
const taskSubtasks = {
  [taskTypes.SUBTITLE]: [
    { id: 's1', text: '正在加载视频文件...' },
    { id: 's2', text: '初始化OCR引擎，加载模型...' },
    { id: 's3', text: '分析视频帧率和时长...' },
    { id: 's4', text: '提取关键帧进行OCR处理...' },
    { id: 's5', text: '应用文本识别算法...' },
    { id: 's6', text: '整合时间码信息...' },
    { id: 's7', text: '生成SRT格式字幕...' },
    { id: 's8', text: '执行字幕时间校准...' },
    { id: 's9', text: '清理识别结果中的噪声...' },
    { id: 's10', text: '保存字幕文件...' },
  ],
  [taskTypes.LOCALIZATION]: [
    { id: 'l1', text: '载入字幕文件...' },
    { id: 'l2', text: '分析文本语言特性...' },
    { id: 'l3', text: '识别固有名词和专有名词...' },
    { id: 'l4', text: '提取文化特定元素...' },
    { id: 'l5', text: '建立本土化清单...' },
    { id: 'l6', text: '关联文化背景知识...' },
    { id: 'l7', text: '生成本土化指南...' },
    { id: 'l8', text: '标记需要特殊处理的字符...' },
    { id: 'l9', text: '检查本土化冲突...' },
    { id: 'l10', text: '保存本土化清单...' },
  ],
  [taskTypes.TRANSLATION]: [
    { id: 't1', text: '载入本土化清单和原始字幕...' },
    { id: 't2', text: '应用多语言翻译模型...' },
    { id: 't3', text: '处理专有名词和特殊术语...' },
    { id: 't4', text: '维持原文格式和结构...' },
    { id: 't5', text: '调整翻译后文本长度...' },
    { id: 't6', text: '优化译文表达流畅度...' },
    { id: 't7', text: '应用语境相关的语气调整...' },
    { id: 't8', text: '添加必要的翻译注释...' },
    { id: 't9', text: '执行双语对照检查...' },
    { id: 't10', text: '生成最终翻译结果...' },
  ],
  [taskTypes.EDITING]: [
    { id: 'e1', text: '载入原始视频文件...' },
    { id: 'e2', text: '加载字幕和翻译文件...' },
    { id: 'e3', text: '计算字幕显示位置...' },
    { id: 'e4', text: '调整字幕样式和大小...' },
    { id: 'e5', text: '处理特效字幕...' },
    { id: 'e6', text: '同步音频和字幕时间...' },
    { id: 'e7', text: '渲染字幕到视频帧...' },
    { id: 'e8', text: '应用视频压缩算法...' },
    { id: 'e9', text: '输出多格式视频文件...' },
    { id: 'e10', text: '执行质量控制检查...' },
  ],
};

// 获取任务类型名称
function getTaskTypeName(type) {
  switch (type) {
    case taskTypes.SUBTITLE: return '字幕君';
    case taskTypes.LOCALIZATION: return '本土文化君';
    case taskTypes.TRANSLATION: return '翻译君';
    case taskTypes.EDITING: return '剪辑师';
    default: return '未知任务';
  }
}

// 获取任务类型图标
function TaskTypeIcon({ type }) {
  switch (type) {
    case taskTypes.SUBTITLE: 
      return <FileText className="h-5 w-5 text-blue-500" />;
    case taskTypes.LOCALIZATION: 
      return <Globe className="h-5 w-5 text-purple-500" />;
    case taskTypes.TRANSLATION: 
      return <Languages className="h-5 w-5 text-green-500" />;
    case taskTypes.EDITING: 
      return <Video className="h-5 w-5 text-orange-500" />;
    default:
      return null;
  }
}

// 加载动画组件
function LoadingIndicator() {
  return (
    <span className="ml-1.5 inline-flex items-center">
      <span className="animate-pulse h-1 w-1 rounded-full bg-blue-500 mx-0.5"></span>
      <span className="animate-pulse delay-150 h-1 w-1 rounded-full bg-blue-500 mx-0.5"></span>
      <span className="animate-pulse delay-300 h-1 w-1 rounded-full bg-blue-500 mx-0.5"></span>
    </span>
  );
}

// 进行中状态的子任务组件 - 方案B：周期性轮换显示
function CyclicSubtasks({ taskType }) {
  const subtasks = taskSubtasks[taskType];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleTasks, setVisibleTasks] = useState([]);
  
  // 设置定时器轮换显示子任务
  useEffect(() => {
    // 初始显示第一个任务
    setVisibleTasks([subtasks[0]]);
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        // 计算新索引
        const newIndex = (prev + 1) % subtasks.length;
        
        // 如果显示的任务少于3个，添加新任务
        // 否则，替换最后一个任务
        setVisibleTasks((prevTasks) => {
          if (prevTasks.length < 3) {
            return [...prevTasks, subtasks[newIndex]];
          } else {
            const newTasks = [...prevTasks];
            newTasks[newTasks.length - 1] = subtasks[newIndex];
            return newTasks;
          }
        });
        
        return newIndex;
      });
    }, 3000); // 每3秒切换一次
    
    return () => clearInterval(timer);
  }, [subtasks]);
  
  return (
    <div className="space-y-0.5">
      {visibleTasks.map((task, index) => (
        <div key={task.id} className="text-xs flex items-start">
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {task.text}
            {index === visibleTasks.length - 1 && <LoadingIndicator />}
          </span>
        </div>
      ))}
    </div>
  );
}

// 已完成状态的子任务组件
function CompletedSubtasks({ taskType }) {
  const subtasks = taskSubtasks[taskType];
  const [visibleCount, setVisibleCount] = useState(0);
  
  // 创建完成动画
  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      if (count < subtasks.length) {
        setVisibleCount(count + 1);
        count++;
      } else {
        clearInterval(interval);
      }
    }, 100); // 每100ms显示一个新任务
    
    return () => clearInterval(interval);
  }, [subtasks.length]);
  
  return (
    <div className="space-y-0.5">
      {subtasks.slice(0, visibleCount).map((task, index) => (
        <div key={task.id} className="text-xs flex items-start">
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {task.text}
            <span className="ml-1 text-[10px] text-gray-500">
              ({Math.round((index + 1) / subtasks.length * 100)}%)
            </span>
          </span>
        </div>
      ))}
      
      {visibleCount === subtasks.length && (
        <div className="text-xs flex items-start">
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            处理完成！
          </span>
        </div>
      )}
    </div>
  );
}

// 任务进度项组件
function TaskProgressItem({ taskType, status }) {
  // 根据状态选择不同的子任务显示方式
  const renderSubtasks = () => {
    if (status === 'completed') {
      return <CompletedSubtasks taskType={taskType} />;
    } else if (status === 'processing') {
      return <CyclicSubtasks taskType={taskType} />;
    }
    return null;
  };
  
  return (
    <div className="relative">
      <div className="absolute left-0 top-0 flex flex-col items-center">
        <div className="mb-1">
          {status === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          )}
        </div>
      </div>
      
      <div className="ml-6 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span className="scale-75">
              <TaskTypeIcon type={taskType} />
            </span>
            <h4 className="font-medium text-xs">{getTaskTypeName(taskType)}</h4>
          </div>
          <span className={`inline-flex items-center justify-center rounded-md border font-medium w-fit whitespace-nowrap text-xs py-0 px-1.5 ${
            status === 'completed' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
          }`}>
            {status === 'completed' ? '已完成' : '进行中'}
          </span>
        </div>
        
        {renderSubtasks()}
      </div>
    </div>
  );
}

export default function TaskProgressTest() {
  // 定义任务状态
  const [taskStatuses, setTaskStatuses] = useState({
    [taskTypes.SUBTITLE]: 'completed',
    [taskTypes.LOCALIZATION]: 'completed',
    [taskTypes.TRANSLATION]: 'processing',
    [taskTypes.EDITING]: 'idle'
  });
  
  // 模拟任务状态变化
  useEffect(() => {
    // 5秒后翻译君完成
    const translationTimer = setTimeout(() => {
      setTaskStatuses(prev => ({
        ...prev,
        [taskTypes.TRANSLATION]: 'completed'
      }));
      
      // 翻译君完成后，剪辑师开始
      setTaskStatuses(prev => ({
        ...prev,
        [taskTypes.EDITING]: 'processing'
      }));
      
      // 15秒后剪辑师完成
      setTimeout(() => {
        setTaskStatuses(prev => ({
          ...prev,
          [taskTypes.EDITING]: 'completed'
        }));
      }, 15000);
    }, 8000);
    
    return () => {
      clearTimeout(translationTimer);
    };
  }, []);
  
  // 用于测试的控制按钮
  const changeTaskStatus = (taskType, status) => {
    setTaskStatuses(prev => ({
      ...prev,
      [taskType]: status
    }));
  };
  
  return (
    <div className="container mx-auto py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">任务进度测试 - 方案B</h1>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-4">
            {Object.values(taskTypes).map(type => (
              taskStatuses[type] !== 'idle' && (
                <TaskProgressItem 
                  key={type} 
                  taskType={type} 
                  status={taskStatuses[type]} 
                />
              )
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">测试控制</h2>
        <div className="space-y-4">
          {Object.values(taskTypes).map(type => (
            <div key={type} className="flex items-center gap-4">
              <span className="w-24 font-medium">{getTaskTypeName(type)}:</span>
              <button 
                onClick={() => changeTaskStatus(type, 'idle')}
                className={`px-3 py-1 rounded text-xs ${taskStatuses[type] === 'idle' ? 'bg-gray-500 text-white' : 'bg-gray-200'}`}
              >
                不显示
              </button>
              <button 
                onClick={() => changeTaskStatus(type, 'processing')}
                className={`px-3 py-1 rounded text-xs ${taskStatuses[type] === 'processing' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                进行中
              </button>
              <button 
                onClick={() => changeTaskStatus(type, 'completed')}
                className={`px-3 py-1 rounded text-xs ${taskStatuses[type] === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
              >
                已完成
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
