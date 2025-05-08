"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PlusCircle,
  MessageSquare,
  BookMarked,
  MoreVertical,
  ChevronsLeft,
  Menu,
  Key,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatSession {
  id: string;
  title: string;
  date: string;
  targetLanguages: string[];
  status:
    | "not-started"
    | "in-progress"
    | "waiting-confirm"
    | "completed"
    | "failed";
  cardType?: string;
}

interface SidebarProps {
  onCollapsedChange: (collapsed: boolean) => void;
  onSelectChat: (id: string, isNew?: boolean) => void;
  currentChatId: string | null;
}

// 将任务类型映射为中文标题
function mapTaskType(taskType: string): string {
  if (!taskType) return "未知类型";

  switch (taskType.toLowerCase()) {
    case "video_translation":
      return "视频翻译";
    case "srt_translation":
      return "字幕翻译";
    case "video_generation":
      return "视频生成";
    case "image_translation":
      return "图片翻译";
    case "document_translation":
      return "文档翻译";
    default:
      return taskType;
  }
}

export function Sidebar({
  onCollapsedChange,
  onSelectChat,
  currentChatId,
}: SidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [collapsed, setCollapsed] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // 导航到新任务创建页面
  const navigateToTaskSelectionPage = () => {
    // 只是切换到任务选择页面，不创建任务
    if (onSelectChat) {
      // 添加时间戳确保每次点击都刷新选项
      onSelectChat(`new-task-${Date.now()}`, true); // 传递特殊ID表示新任务页面
    }

    // 触发刷新右侧内容区的事件
    const refreshEvent = new CustomEvent("refreshTaskOptions", {
      detail: { timestamp: Date.now() },
    });
    window.dispatchEvent(refreshEvent);
  };
  
  // 加载更多任务
  const loadMoreTasks = useCallback(async () => {
    console.log('调用 loadMoreTasks 函数 - hasMore:', hasMore, 'isLoadingMore:', isLoadingMore, 'isRefreshing:', isRefreshing);
    
    if (!hasMore) {
      console.log('没有更多任务可加载，终止加载');
      return;
    }
    
    if (isLoadingMore) {
      console.log('正在加载中，跳过本次加载请求');
      return;
    }
    
    if (isRefreshing) {
      console.log('正在刷新任务列表，跳过加载更多');
      return;
    }
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      // 动态导入任务服务
      const taskService = (await import("@/services/task-service")).default;
      
      // 获取下一页任务列表
      console.log(`加载更多任务，当前页码: ${nextPage}`);
      const response = await taskService.getTasks(
        {
          page: nextPage,
          limit: 100,
        }
      );
      console.log(`加载更多任务响应:`, response);
      
      if (response && response.items && response.items.length > 0) {
        // 更新分页信息
        setCurrentPage(nextPage);
        setTotalItems(response.total || 0);
        
        // 判断是否还有更多数据
        const currentCount = sessions.length + response.items.length;
        setHasMore(currentCount < (response.total || 0));
        
        // 合并新数据到现有任务列表
        const formattedSessions = response.items.map((task: any) => {
          // 生成唯一标识，添加更多随机性确保唯一
          const uniqueId = `more_${nextPage}_${task.id || ''}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
          // 确保任务ID存在且为字符串
          const taskId = task.id
            ? task.id.toString()
            : String(Math.random()).slice(2, 10);

          // 获取任务名称，如果不存在则使用默认名称
          const taskName =
            task.file_set_name || task.name || task.title || `任务 ${taskId}`;

          // 获取创建时间
          const createTime = task.createTime || task.create_time || Date.now();

          // 获取任务类型
          const taskType =
            task.taskType || task.task_type || "video_translation";

          // 获取任务状态并映射为侧边栏状态
          let statusValue = task.status;
          // 如果状态是数字，则映射为字符串状态
          if (typeof statusValue === "number") {
            switch (statusValue) {
              case 1:
                statusValue = "in-progress"; // 未开始 默认为 进行中
                break;
              case 2:
                statusValue = "in-progress";
                break;
              case 3:
                statusValue = "completed";
                break;
              case 5:
                statusValue = "failed";
                break;
              case 6:
                statusValue = "waiting-confirm";
                break;
              default:
                statusValue = "not-started";
            }
          } else if (typeof statusValue === "string") {
            // 如果是字符串状态，则映射为侧边栏状态
            switch (statusValue.toLowerCase()) {
              case "pending":
                statusValue = "not-started";
                break;
              case "processing":
                statusValue = "in-progress";
                break;
              case "waiting":
                statusValue = "waiting-confirm";
                break;
              case "completed":
                statusValue = "completed";
                break;
              case "failed":
                statusValue = "failed";
                break; // 失败也显示为完成状态，可以根据需求调整
              default:
                statusValue = "not-started";
            }
          }

          return {
            id: taskId,
            title: taskName,
            date: new Date(createTime).toLocaleString(),
            targetLanguages:
              task.targetLanguages || task.target_languages || [],
            status: statusValue,
            cardType: taskType,
            taskTypeName: mapTaskType(taskType),
          };
        });
        
        // 将新数据添加到已有数据中
        setSessions(prevSessions => [...prevSessions, ...formattedSessions]);
        console.log(`加载了新的 ${formattedSessions.length} 条数据，当前总共 ${sessions.length + formattedSessions.length} 条`);
      } else {
        // 没有更多数据
        setHasMore(false);
      }
    } catch (error) {
      console.error("加载更多任务失败:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isRefreshing, currentPage]); // 添加依赖项
  
  // 刷新任务列表
  const refreshTaskList = async () => {
    try {
      setIsRefreshing(true);
      setCurrentPage(1); // 重置到第一页
      setHasMore(true);  // 重置加载状态
      
      // 动态导入任务服务
      const taskService = (await import("@/services/task-service")).default;
      
      // 获取任务列表
      console.log("刷新任务列表...");
      const response = await taskService.getTasks(
        {
          page: 1,
          limit: 100,
        }
      );
      console.log("刷新任务列表响应:", response);
      
      if (response) {
        // 更新分页信息
        setTotalItems(response.total || 0);
        setHasMore((response.items?.length || 0) < (response.total || 0));
        
        // 触发任务列表更新事件
        if (response.items) {
          const tasksUpdateEvent = new CustomEvent("updateTasksList", {
            detail: { tasks: response.items },
          });
          window.dispatchEvent(tasksUpdateEvent);
        }
      }
    } catch (error) {
      console.error("刷新任务列表失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // 监听任务列表更新事件
  useEffect(() => {
    const handleTasksUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { tasks } = customEvent.detail;

      console.log("收到任务列表更新事件:", customEvent.detail);
      console.log("任务数据:", tasks);
      console.log("任务数据类型:", typeof tasks, Array.isArray(tasks));

      if (Array.isArray(tasks)) {
        console.log(`处理 ${tasks.length} 个任务项`);

        if (tasks.length === 0) {
          console.log("任务列表为空，清空侧边栏");
          setSessions([]);
          return;
        }

        // 将API返回的任务数据转换为侧边栏需要的格式
        const formattedSessions = tasks.map((task: any) => {
          console.log("处理任务项:", task);

          // 确保任务ID存在且为字符串
          const taskId = task.id
            ? task.id.toString()
            : String(Math.random()).slice(2, 10);
            
          // 生成唯一标识，使用随机字符串确保唯一性
          const uniqueId = `init_${taskId}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

          // 获取任务名称，如果不存在则使用默认名称
          const taskName =
            task.file_set_name || task.name || task.title || `任务 ${taskId}`;

          // 获取创建时间
          const createTime = task.createTime || task.create_time || Date.now();

          // 获取任务类型
          const taskType =
            task.taskType || task.task_type || "video_translation";

          // 获取任务状态并映射为侧边栏状态
          let statusValue = task.status;
          // 如果状态是数字，则映射为字符串状态
          if (typeof statusValue === "number") {
            switch (statusValue) {
              case 1:
                statusValue = "in-progress"; // 未开始 默认为 进行中
                break;
              case 2:
                statusValue = "in-progress";
                break;
              case 3:
                statusValue = "completed";
                break;
              case 5:
                statusValue = "failed";
                break;
              case 6:
                statusValue = "waiting-confirm";
                break;
              default:
                statusValue = "not-started";
            }
          } else if (typeof statusValue === "string") {
            // 如果是字符串状态，则映射为侧边栏状态
            switch (statusValue.toLowerCase()) {
              case "pending":
                statusValue = "not-started";
                break;
              case "processing":
                statusValue = "in-progress";
                break;
              case "waiting":
                statusValue = "waiting-confirm";
                break;
              case "completed":
                statusValue = "completed";
                break;
              case "failed":
                statusValue = "failed";
                break; // 失败也显示为完成状态，可以根据需求调整
              default:
                statusValue = "not-started";
            }
          }

          console.log("原始状态:", task.status, "映射后状态:", statusValue);

          // 构建格式化的任务项
          return {
            originalId: taskId, // 保存原始ID用于业务操作
            id: uniqueId, // 使用生成的唯一ID做为组件key
            title: taskName,
            date: new Date(createTime).toLocaleString(),
            targetLanguages:
              task.targetLanguages || task.target_languages || [],
            status: statusValue,
            cardType: taskType,
            // 添加中文任务类型
            taskTypeName: mapTaskType(taskType),
          };
        });

        console.log("格式化后的任务列表:", formattedSessions);

        // 更新侧边栏任务列表
        setSessions(formattedSessions);
      } else {
        console.error("收到的任务数据不是数组格式:", tasks);
      }
    };

    // 添加事件监听器
    window.addEventListener("updateTasksList", handleTasksUpdate);

    // 组件卸载时清理事件监听器
    return () => {
      window.removeEventListener("updateTasksList", handleTasksUpdate);
    };
  }, []);

  // 将任务状态映射为可读文本
  const mapTaskStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "等待中",
      processing: "处理中",
      completed: "已完成",
      failed: "失败",
    };

    return statusMap[status] || status;
  };

  // 将API任务状态映射到侧边栏状态
  const mapTaskStatus = (
    apiStatus: number
  ):
    | "not-started"
    | "in-progress"
    | "waiting-confirm"
    | "completed"
    | "failed" => {
    switch (apiStatus) {
      case 1:
        return "not-started";
      case 2:
        return "in-progress";
      case 3:
        return "completed";
      case 6:
        return "waiting-confirm"; // 错误和失败状态也显示为已完成
      case 5:
        return "failed"; // 错误和失败状态也显示为已完成
      default:
        return "not-started";
    }
  };

  // 创建新任务的事件监听器 - 当任务类型被选择并提交后调用
  useEffect(() => {
    const handleTaskSubmit = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { taskType, taskTitle = "新建任务" } = customEvent.detail;

      // 创建新的会话数据
      const sessionData = {
        id: `chat-${Date.now()}`,
        title: taskTitle,
        cardType: taskType,
        targetLanguages: [],
        status: "not-started" as const,
        date: "",
      };

      // 添加新的会话到列表中
      setSessions((prev) => [
        {
          ...sessionData,
          targetLanguages: [],
          status: "not-started",
        },
        ...prev,
      ]);

      // 自动选择新创建的任务
      setTimeout(() => {
        if (onSelectChat) {
          onSelectChat(sessionData.id, false);
        }
      }, 100); // 短暂延迟确保UI更新后再选中
    };

    // 添加事件监听器
    window.addEventListener("taskSubmitted", handleTaskSubmit);

    // 组件卸载时清理事件监听器
    return () => {
      window.removeEventListener("taskSubmitted", handleTaskSubmit);
    };
  }, [onSelectChat]);

  const toggleCollapse = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    onCollapsedChange(newCollapsedState);
  };

  if (collapsed) {
    return (
      <aside
        className="w-16 border-r h-screen flex flex-col items-center transition-all duration-300"
        style={{ background: "#EFEFED" }}
      >
        <div className="py-4 border-b w-full flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="rounded-full h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="py-4 flex-1 flex flex-col space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={refreshTaskList}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">刷新任务列表</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={navigateToTaskSelectionPage}
          >
            <PlusCircle className="h-5 w-5" />
            <span className="sr-only">创建</span>
          </Button>
        </div>
        <div className="mt-auto py-4 border-t w-full flex justify-center">
          <button
            onClick={() => setShowApiKeyDialog(true)}
            className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <Key className="h-4 w-4 text-primary" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-64 border-r h-screen flex flex-col transition-all duration-300"
      style={{ background: "#EFEFED" }}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-primary font-bold text-xl flex items-center">
            <span className="bg-primary text-primary-foreground rounded px-1 py-0.5 text-sm mr-1">
              N
            </span>
            arratorAI
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="rounded-full h-8 w-8"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="py-3 px-4">
        <Button
          className="w-full justify-start gap-2"
          variant="default"
          onClick={navigateToTaskSelectionPage}
        >
          <PlusCircle className="h-4 w-4" />
          创建新任务
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-3 pb-2 flex justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            历史任务
            {/* 历史任务 {totalItems > 0 ? `(${sessions.length}/${totalItems})` : ''} */}
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 cursor-pointer" 
            onClick={refreshTaskList}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="px-3 h-[calc(100%-40px)]">
          {sessions.length > 0 ? (
            <>
              <SessionList
                sessions={sessions}
                onSelect={(id) => onSelectChat(id)}
                currentChatId={currentChatId}
                onScrollEnd={loadMoreTasks}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
              />
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
              <p>暂无任务记录</p>
              <p className="text-sm mt-2">点击"创建新任务"开始使用</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto p-4 border-t">
        <button
          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 transition-colors text-sm font-medium text-gray-700"
          onClick={() => setShowApiKeyDialog(true)}
        >
          <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <span>API密钥设置</span>
        </button>
      </div>

      {showApiKeyDialog && (
        <ApiKeyDialog
          open={showApiKeyDialog}
          onOpenChange={setShowApiKeyDialog}
          onSaveSuccess={refreshTaskList}
        />
      )}
    </aside>
  );
}

interface SessionListProps {
  sessions: ChatSession[];
  onSelect: (id: string) => void;
  currentChatId: string | null;
  onScrollEnd?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

function SessionList({ sessions, onSelect, currentChatId, onScrollEnd, isLoadingMore = false, hasMore = false }: SessionListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const initialCheckDone = useRef(false);

  // 滚动处理函数
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    console.log('滚动事件触发', target);

    // 检查必要条件
    if (!onScrollEnd) {
      // console.log('onScrollEnd 回调函数未提供');
      return;
    }

    if (!hasMore) {
      // console.log('没有更多数据可加载');
      return;
    }

    if (isLoadingMore) {
      // console.log('正在加载数据中，跳过本次检测');
      return;
    }

    // 获取滚动信息 - Read from event target
    const { scrollTop, scrollHeight, clientHeight } = target;
    // console.log('滚动信息 - 滚动高度:', scrollTop, '内容高度:', scrollHeight, '可视区域高度:', clientHeight);
    // console.log('距离底部:', scrollHeight - scrollTop - clientHeight, '像素');

    // 判断是否触底
    const threshold = 50; // Trigger when 50px from bottom
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      // console.log('已达到底部触发区域，正在调用 loadMoreTasks');
      onScrollEnd();
    }
  };

  useEffect(() => {
    const listElement = listRef.current;
    // Run check only if: we have sessions, haven't done the check, have more items, and not currently loading
    if (listElement && sessions.length > 0 && !initialCheckDone.current && hasMore && !isLoadingMore && onScrollEnd) {
      // console.log('执行首次加载内容检查...');
      // Check if content is less than or equal to container height
      if (listElement.scrollHeight <= listElement.clientHeight) {
        // console.log('初始内容不足，触发加载更多...');
        onScrollEnd();
      }
      initialCheckDone.current = true; // Mark check as done
    }
  }, [sessions, hasMore, isLoadingMore, onScrollEnd]);

  // 处理任务状态徽章
  const getStatusBadge = (status: ChatSession["status"]) => {
    switch (status) {
      case "not-started":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            未开始
          </span>
        );
      case "in-progress":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
            进行中
          </span>
        );
      case "waiting-confirm":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-600">
            待确认
          </span>
        );
      case "completed":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">
            已完成
          </span>
        );
      case "failed":
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">
            失败
          </span>
        );
      default:
        return null;
    }
  };

  // 处理任务点击事件
  const handleTaskClick = async (taskId: string) => {
    // 提取原始ID，如果是自定义的唯一ID，找到对应的原始ID
    const session = sessions.find(s => s.id === taskId);
    const originalId = session?.originalId || taskId;
    // console.log(`处理任务点击，组件ID: ${taskId}, 原始ID: ${originalId}`);
    
    try {
      // 先触发选择任务事件，更新UI
      onSelect(originalId);

      // 导入任务服务
      const taskService = (await import("@/services/task-service")).default;

      // 调用接口获取任务状态
      // console.log(`获取任务状态: 任务ID ${originalId}`);
      const response = await taskService.getTask(originalId);
      // console.log('任务状态接口响应:', JSON.stringify(response));

      // 触发任务状态更新事件
      if (response && response.success) {
        const taskStatusEvent = new CustomEvent("taskStatusUpdated", {
          detail: {
            taskId: originalId,
            taskData: response.data,
          },
        });
        window.dispatchEvent(taskStatusEvent);
      }
    } catch (error) {
      console.error("获取任务状态失败:", error);
    }
  };

  // console.log('SessionList 渲染，任务数量:', sessions.length, 'hasMore:', hasMore);
  
  return (
    <ScrollArea className="h-full" onScroll={handleScroll}>
      <div className="space-y-1" ref={listRef}>
        {sessions.map((session, index) => (
          <div
            key={`${session.id}-${index}`}
            className={`flex items-start justify-between rounded-md p-2 hover:bg-muted cursor-pointer group ${
              session.id === currentChatId ? "bg-muted" : ""
            }`}
            onClick={() => handleTaskClick(session.id)}
          >
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium leading-none mb-1">
                  {session.title}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-slate-500">
                    {session.taskTypeName ||
                      mapTaskType(session.cardType) ||
                      "未分类"}
                  </p>
                  {getStatusBadge(session.status)}
                </div>
              </div>
            </div>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">更多选项</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>重命名</DropdownMenuItem>
                <DropdownMenuItem>删除</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        ))}
        
        {isLoadingMore && (
          <div className="py-2 flex justify-center items-center">
            <div className="text-xs text-gray-500 flex items-center">
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              加载更多任务...
            </div>
          </div>
        )}
        
        {!isLoadingMore && !hasMore && sessions.length > 0 && (
          <div className="py-2 flex justify-center">
            <span className="text-xs text-gray-500">已加载全部任务</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
