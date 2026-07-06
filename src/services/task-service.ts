/**
 * 任务服务
 * 处理视频翻译、SRT翻译等各类任务的API
 */

// import { toast } from '@/lib/toast';
import { toast } from "sonner";
import apiClient from './api-client';

// 请求状态跟踪缓存 - 防止重复发送确认请求
const confirmRequestCache = {};

/**
 * 任务类型
 */
export type TaskType = 
  | 'video_translation' // 视频翻译
  | 'srt_translation'   // 纯SRT翻译
  | 'video_erasure'     // 视频擦除
  | 'video_extraction'  // 视频提取
  | 'video_merging';    // 视频压制

/**
 * 任务状态
 */
export enum TaskStatus {
  NotStarted = 1,   // 未开始
  InProgress = 2,   // 进行中
  Success = 3,      // 成功
  Error = 4,        // 出错
  Failed = 5        // 失败
}

/**
 * 目标语言
 */
export interface TargetLanguage {
  language: string;  // 语言
  area?: string;     // 国家
}

/**
 * 字幕样式配置
 */
export interface SubtitleStyle {
  font_size?: number;       // 字号大小
  primary_colour?: string;  // 字幕主色（ABGR格式，&H开头）
  outline_colour?: string;  // 字幕边框色
  back_colour?: string;     // 字幕阴影色
  border_style?: number;    // 边框样式：1-笔画加边+投影；3-方形纯色盒子
  outline?: number;         // 笔画边粗细（像素），支持0-4
  shadow?: number;          // 投影深度（像素），支持0-4
  alignment?: number;       // 字幕对齐位置，1-9对应数字键盘位置，2为中下位
  margin_l?: number;        // 左边距
  margin_r?: number;        // 右边距
  margin_v?: number;        // 纵向边距
  wrap_style?: number;      // 换行方式
}

/**
 * 资源信息
 */
export interface ResourceInfo {
  file_set_id?: string | number;  // 文件夹ID
  file_set_name?: string;         // 文件夹名称
  file_ids?: (string | number)[]; // 文件ID列表
}

/**
 * 基础任务创建参数
 */
interface BaseTaskParams {
  task_type: TaskType;           // 任务类型
  resources: ResourceInfo;       // 资源信息
  auto_run?: 0;              // 0：关键节点暂停等待用户确认，1：全流程自动
  style_prompt?: string;         // 翻译风格要求
  subtitle_style?: SubtitleStyle; // 字幕样式配置
}

/**
 * 翻译任务参数
 */
export interface TranslationTaskParams extends BaseTaskParams {
  original_language: string;       // 原始语言
  target_languages: TargetLanguage[]; // 目标语言列表
  video_erase_mode?: 'advanced' | 'normal'; // 视频擦除模式，仅 video_translation 或 video_erasure 有效
}

/**
 * 任务查询参数
 */
export interface TaskQueryParams {
  page?: number;
  limit?: number;
  task_type?: TaskType;
  status?: TaskStatus;
}

/**
 * 本土化或翻译内容更新参数
 */
export interface ContentUpdateParams {
  playlet_num: string;        // 集数
  type: 'srt' | 'localized';  // 类型：srt=翻译字幕，localized=本土化信息
  content: string;            // 内容
  target_lang: string;        // 目标语言
}

/**
 * 原字幕内容更新参数
 */
export interface OriginSrtUpdateParams {
  content: string;  // 字幕内容
}

/**
 * 处理分页响应格式
 */
const handlePaginatedResponse = async (promise: Promise<any>) => {
  try {
    const response = await promise;
    console.log('原始API响应数据:', response);
    // console.log('原始API响应类型:', typeof response);
    
    // 处理不同的响应格式
    if (!response.success) {
      toast.error(response.message)
      return { items: [], total: 0 };
    }
    
    // 检查是否是标准响应格式（包含 code/success/data 结构）
    if (response.success === true && response.data) {
      console.log('检测到标准响应格式，使用 response.data');
      const data = response.data;
      
      // 如果 data 是数组
      if (Array.isArray(data)) {
        console.log('数据是数组格式');
        return {
          items: data,
          total: response.total || data.length,
          page: response.page || 1,
          limit: response.limit || 15
        };
      }
      
      // 如果 data 是包含 items 的对象
      if (data.items && Array.isArray(data.items)) {
        console.log('数据是包含 items 的对象');
        return {
          items: data.items,
          total: data.total || data.items.length,
          page: data.page || 1,
          limit: data.limit || 10
        };
      }
      
      // 如果 data 本身就是对象数组
      if (typeof data === 'object' && !Array.isArray(data)) {
        console.log('数据是对象，但不是数组');
        return {
          items: [data],
          total: 1
        };
      }
    }
    
    // 如果是直接的数组
    if (Array.isArray(response)) {
      console.log('响应直接是数组');
      return {
        items: response,
        total: response.length
      };
    }
    
    // 如果是包含 items 的对象
    if (response.items && Array.isArray(response.items)) {
      console.log('响应是包含 items 的对象');
      return {
        items: response.items,
        total: response.total || response.items.length,
        page: response.page || 1,
        limit: response.limit || 10
      };
    }
    
    // 如果是其他对象格式
    if (typeof response === 'object' && !Array.isArray(response)) {
      console.log('响应是其他对象格式');
      // 尝试将整个对象作为一个任务项
      return {
        items: [response],
        total: 1
      };
    }
    
    console.log('无法识别的响应格式，返回空数组');
    return { items: [], total: 0 };
  } catch (error) {
    console.error('处理分页响应出错:', error);
    return { items: [], total: 0 };
  }
};

/**
 * 任务服务接口
 */
const taskService = {
  /**
   * 创建任务
   * 根据task_type创建相应类型的任务
   */
  createTask: async (params: TranslationTaskParams) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('创建任务：API密钥不存在');
        return { success: false };
      }
      return apiClient.post('/api/narrator/ai/v1/tasks', params);
    } catch (error) {
      console.error('创建任务失败:', error);
      return { success: false };
    }
  },

  /**
   * 获取任务列表
   */
  getTasks: async (params: TaskQueryParams = {}) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('获取任务列表：API密钥不存在');
        return { items: [], total: 0 };
      }
      console.log('开始请求任务列表...');
      const response = await apiClient.get('/api/narrator/ai/v1/videoTasks', params);
      console.log('任务列表API响应:', response);
      
      const result = await handlePaginatedResponse(Promise.resolve(response));
      console.log('处理后的任务列表数据:', result);
      return result;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      return { items: [], total: 0 };
    }
  },

  /**
   * 获取任务详情
   */
  getTask: async (taskId: string | number) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('获取任务详情：API密钥不存在');
        return { success: false };
      }
      console.log(`调用获取任务状态接口: /api/narrator/ai/v1/videoTasks/${taskId}`);
      const response = await apiClient.get(`/api/narrator/ai/v1/videoTasks/${taskId}`);
      // console.log('获取任务状态接口响应:', JSON.stringify(response));
      console.log('接口响应code:', response?.code, '类型:', typeof response?.code);
      
      // 打印task_flows字段信息
      if (response?.data?.task_flows) {
        // console.log('任务工作流信息(task_flows):', JSON.stringify(response.data.task_flows, null, 2));
        
        // 如果task_flows是数组，打印每个工作流的详细信息
        // if (Array.isArray(response.data.task_flows)) {
        //   response.data.task_flows.forEach((flow, index) => {
        //     console.log(`工作流 #${index + 1}:`, flow);
        //     console.log(`工作流 #${index + 1} 状态:`, flow.status);
        //     console.log(`工作流 #${index + 1} 类型:`, flow.type);
        //   });
        // }
      } else {
        console.log('任务中不包含task_flows字段或为空');
      }
      
      // 处理接口返回的数据结构
      if (response && (response.success == true || response.code == 200)) {
        console.log('获取任务状态成功, 任务数据:', response.data);
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        console.log('获取任务状态失败, 错误信息:', response?.message, 'code:', response?.code);
        return {
          success: false,
          message: response?.message || '获取任务状态失败'
        };
      }
    } catch (error) {
      console.error('获取任务状态失败:', error);
      return { 
        success: false,
        message: error instanceof Error ? error.message : '获取任务状态失败，请稍后重试'
      };
    }
  },
  
  /**
   * 获取任务状态
   * 用于工作流程中获取任务当前执行状态
   */
  getTaskStatus: async (taskId: string | number) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('获取任务状态：API密钥不存在');
        return { success: false };
      }
      return apiClient.get(`/api/narrator/ai/v1/tasks/${taskId}/status`);
    } catch (error) {
      console.error('获取任务状态出错:', error);
      return { success: false };
    }
  },
  
  /**
   * 获取任务详细信息
   * 包含当前任务所有数据（字幕、本土化、翻译结果等）
   */
  getTaskDetails: async (taskId: string | number) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('获取任务详细信息：API密钥不存在');
        return { success: false };
      }
      return apiClient.get(`/api/narrator/ai/v1/tasks/${taskId}/details`);
    } catch (error) {
      console.error('获取任务详细信息出错:', error);
      return { success: false };
    }
  },
  
  /**
   * 确认任务流程
   * 添加请求锁定机制防止重复发送指令
   */
  confirmTaskFlow: async (taskId: string | number, flowId: string | number) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('确认任务流程：API密钥不存在');
        return { success: false };
      }
      
      const cacheKey = `confirm_${taskId}`;
      // 检查是否在短时间内已经发送过请求
      if (confirmRequestCache[cacheKey]) {
        console.log('已在处理确认请求，忽略重复请求');
        return {success: true, message: '请求正在处理中'};
      }
      
      // 标记为正在请求
      confirmRequestCache[cacheKey] = true;
      console.log(`发送确认请求，taskId: ${taskId}, ${flowId}`);
      
      try {
        const response = await apiClient.post(`/api/narrator/ai/v1/confirm/task/flow/${taskId}`, {
          flow_id: flowId
        });
        console.log('确认请求响应:', response);
        return response;
      } finally {
        // 1秒后清除请求标记，允许再次请求
        setTimeout(() => {
          console.log(`清除请求缓存，taskId: ${taskId}`);
          delete confirmRequestCache[cacheKey];
        }, 1000);
      }
    } catch (error) {
      console.error('确认任务流程失败:', error);
      return { success: false, message: error instanceof Error ? error.message : '确认失败' };
    }
  },
  
  /**
   * 确认工作流步骤（别名，与confirmTaskFlow功能相同）
   * 使用相同的请求锁定机制，确保短时间内不会重复发送请求
   */
  confirmWorkflowStep: async (taskId: string | number, flowId: string | number) => {
    // 直接调用confirmTaskFlow，确保请求逻辑一致
    return taskService.confirmTaskFlow(taskId, flowId);
  },

  /**
   * 更新本土化映射或翻译字幕
   */
  updateTaskContent: async (taskId: string | number, params: ContentUpdateParams) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('更新本土化映射或翻译字幕：API密钥不存在');
        return { success: false };
      }
      return apiClient.post(`/api/narrator/ai/v1/videoTasks/update/${taskId}/srt/content`, params);
    } catch (error) {
      console.error('更新本土化映射或翻译字幕出错:', error);
      return { success: false };
    }
  },

  /**
   * 更新任务的原字幕内容
   */
  updateOriginSrtContent: async (srtId: string | number, params: OriginSrtUpdateParams) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('更新任务的原字幕内容：API密钥不存在');
        return { success: false };
      }
      return apiClient.post(`/api/narrator/ai/v1/tasks/update/${srtId}/originSrt/content`, params);
    } catch (error) {
      console.error('更新任务的原字幕内容出错:', error);
      return { success: false };
    }
  },

  /**
   * 生成网盘链接
   */
  createBaiduUrl: async (taskId: string | number) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('生成网盘链接：API密钥不存在');
        return { success: false };
      }
      return apiClient.post(`videoTasks/transfer/baidu/share/${taskId}`);
    } catch (error) {
      console.error('生成网盘链接:', error);
      return { success: false };
    }
  },
  
  /**
   * 获取任务费用
   */
  getTaskFee: async (taskType: TaskType, params: { duration?: number, subtitles_count?: number }) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('获取任务费用：API密钥不存在');
        return { success: false };
      }
      return apiClient.getTaskFee(taskType, params);
    } catch (error) {
      console.error('获取任务费用出错:', error);
      return { success: false };
    }
  },

  /**
   * 计算任务所需点数
   * 在创建任务前调用，用于显示任务将消耗的点数
   */
  calculateTaskPoints: async (params: TranslationTaskParams) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('计算任务点数：API密钥不存在');
        return {
          success: false,
          message: 'API密钥不存在'
        };
      }
      // 调整参数格式，确保与API要求一致（使用下划线命名）
      // 获取设置中的auto_run值
      const autoRunValue = localStorage.getItem('settings_autoRun');
      // 如果设置为"true"，则使用 1，否则使用 0
      const autoRunParam = autoRunValue === "true" ? 1 : 0;
      console.log('autoRunParam:', autoRunParam, autoRunValue);
      
      const requestParams = {
        task_type: params.task_type,
        original_language: params.original_language,
        target_languages: params.target_languages,
        video_erase_mode: params.video_erase_mode,
        auto_run: autoRunParam, // 根据设置中的全流程自动执行开关来取值
        style_prompt: params.style_prompt || '',
        resources: params.resources,
        subtitle_style: params.subtitle_style
      };
      
      console.log('计算任务点数请求参数:', JSON.stringify(requestParams));
      const response = await apiClient.post('/api/narrator/ai/v1/videoTasks/point/calculation', requestParams);
      console.log('计算任务点数接口响应:', JSON.stringify(response));
      console.log('接口响应code:', response?.code, '类型:', typeof response?.code);
      
      // 处理接口返回的数据结构
      if (response && response.success == true) {
        console.log('计算任务点数成功, 点数:', response.data.point, '余额:', response.data.balance);
        return {
          success: true,
          points: response.data.point,
          balance: response.data.balance,
          message: response.message
        };
      } else {
        console.log('计算任务点数失败, 错误信息:', response?.message, 'code:', response?.code);
        return {
          success: false,
          message: response?.message || '计算任务点数失败'
        };
      }
    } catch (error) {
      console.error('计算任务点数失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '计算任务点数失败，请稍后重试'
      };
    }
  },

  /**
   * 创建视频任务
   * 在确认费用后调用，创建实际的视频任务
   */
  createVideoTask: async (params: TranslationTaskParams) => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        console.log('创建视频任务：API密钥不存在');
        return {
          success: false,
          message: 'API密钥不存在'
        };
      }
      
      // 调整参数格式，确保与API要求一致（使用下划线命名）
      // 与calculateTaskPoints使用完全相同的参数格式
      
      // 获取设置中的auto_run值
      const autoRunValue = localStorage.getItem('settings_autoRun');
      // 如果设置为"true"，则使用 1，否则使用 0
      const autoRunParam = autoRunValue === "true" ? 1 : 0;
      console.log('autoRunParam:', autoRunParam, autoRunValue);
      
      const requestParams = {
        task_type: params.task_type,
        original_language: params.original_language,
        target_languages: params.target_languages,
        video_erase_mode: params.video_erase_mode,
        auto_run: autoRunParam, // 根据设置中的全流程自动执行开关来取值
        style_prompt: params.style_prompt || '',
        resources: params.resources,
        subtitle_style: params.subtitle_style
      };
      
      console.log('创建视频任务请求参数:', JSON.stringify(requestParams));
      const response = await apiClient.post('/api/narrator/ai/v1/videoTasks', requestParams);
      console.log('创建视频任务接口响应:', JSON.stringify(response));
      console.log('接口响应code:', response?.code, '类型:', typeof response?.code);
      
      // 处理接口返回的数据结构
      if (response && response.success == true) {
        console.log('创建视频任务成功, 任务ID:', response.data?.id);
        return {
          success: true,
          taskId: response.data?.id,
          message: response.message
        };
      } else {
        console.log('创建视频任务失败, 错误信息:', response?.message, 'code:', response?.code);
        return {
          success: false,
          message: response?.message || '创建视频任务失败'
        };
      }
    } catch (error) {
      console.error('创建视频任务失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '创建视频任务失败，请稍后重试'
      };
    }
  },
};

export default taskService;
