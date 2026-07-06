/**
 * 工作流服务
 * 整合文件夹创建、文件上传和任务管理的完整工作流
 */

import projectService, { CreateProjectParams, UploadFileParams } from './project-service';
import taskService, { 
  TaskType, 
  TranslationTaskParams, 
  ErasureTaskParams, 
  MergingTaskParams, 
  ContentUpdateParams 
} from './task-service';
import apiClient from './api-client';

/**
 * 工作流服务接口
 */
const workflowService = {
  /**
   * 确认擦除字幕结果
   * @param srtId 字幕ID
   */
  confirmRemoveSrt: async (srtId: string) => {
    try {
      console.log(`确认擦除字幕结果，srtId: ${srtId}`);
      
      // 使用正确的 API 端点格式
      const response = await apiClient.post(`/api/narrator/ai/v1/confirm/task/flow/status/${srtId}`, {});
      
      if (!response.success) {
        console.error('确认擦除字幕结果失败:', response.error);
        throw new Error(`确认擦除字幕结果失败: ${response.error || '未知错误'}`);
      }
      
      console.log('确认擦除字幕结果成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('确认擦除字幕结果错误:', error);
      throw error;
    }
  },
  /**
   * 更新字幕内容
   * @param srtId 字幕ID
   * @param content 字幕内容
   */
  updateSubtitleContent: async (srtId: string, content: string, taks_id?: string) => {
    try {
      console.log(`开始更新字幕内容，srtId: ${srtId}`);
      
      // 使用正确的 API 端点格式
      const response = await apiClient.post(`/api/narrator/ai/v1/videoTasks/update/${srtId}/originSrt/content`, { content, task_id: taks_id });
      
      if (!response.success) {
        console.error('更新字幕内容失败:', response.error);
        throw new Error(`更新字幕内容失败: ${response.error || '未知错误'}`);
      }
      
      console.log('更新字幕内容成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('更新字幕内容错误:', error);
      throw error;
    }
  },
  /**
   * 视频翻译工作流
   * 创建文件夹、上传视频、创建视频翻译任务
   */
  startVideoTranslationWorkflow: async (
    projectParams: CreateProjectParams,
    file: File,
    translationParams: Omit<TranslationTaskParams, 'project_id' | 'file_ids'>
  ) => {
    try {
      // 步骤1：创建文件夹
      const projectResult = await projectService.createProject(projectParams);
      const projectId = projectResult.data.id;
      
      // 步骤2：上传视频文件
      const fileResult = await projectService.uploadFile({
        project_id: projectId,
        file
      });
      const fileId = fileResult.data.id;
      
      // 步骤3：创建视频翻译任务
      const taskResult = await taskService.createVideoTranslationTask({
        project_id: projectId,
        file_ids: [fileId],
        ...translationParams
      });
      
      return {
        projectId,
        fileId,
        taskId: taskResult.data.id
      };
    } catch (error) {
      console.error('视频翻译工作流启动失败:', error);
      throw error;
    }
  },
  
  /**
   * SRT翻译工作流
   * 创建文件夹、上传SRT文件、创建SRT翻译任务
   */
  startSrtTranslationWorkflow: async (
    projectParams: CreateProjectParams,
    file: File,
    translationParams: Omit<TranslationTaskParams, 'project_id' | 'file_ids'>
  ) => {
    try {
      // 步骤1：创建文件夹
      const projectResult = await projectService.createProject(projectParams);
      const projectId = projectResult.data.id;
      
      // 步骤2：上传SRT文件
      const fileResult = await projectService.uploadFile({
        project_id: projectId,
        file
      });
      const fileId = fileResult.data.id;
      
      // 步骤3：创建SRT翻译任务
      const taskResult = await taskService.createSrtTranslationTask({
        project_id: projectId,
        file_ids: [fileId],
        ...translationParams
      });
      
      return {
        projectId,
        fileId,
        taskId: taskResult.data.id
      };
    } catch (error) {
      console.error('SRT翻译工作流启动失败:', error);
      throw error;
    }
  },
  
  /**
   * 视频擦除工作流
   * 创建文件夹、上传视频、创建视频擦除任务
   */
  startVideoErasureWorkflow: async (
    projectParams: CreateProjectParams,
    file: File,
    erasureParams: Omit<ErasureTaskParams, 'project_id' | 'file_ids'>
  ) => {
    try {
      // 步骤1：创建文件夹
      const projectResult = await projectService.createProject(projectParams);
      const projectId = projectResult.data.id;
      
      // 步骤2：上传视频文件
      const fileResult = await projectService.uploadFile({
        project_id: projectId,
        file
      });
      const fileId = fileResult.data.id;
      
      // 步骤3：创建视频擦除任务
      const taskResult = await taskService.createVideoErasureTask({
        project_id: projectId,
        file_ids: [fileId],
        ...erasureParams
      });
      
      return {
        projectId,
        fileId,
        taskId: taskResult.data.id
      };
    } catch (error) {
      console.error('视频擦除工作流启动失败:', error);
      throw error;
    }
  },
  
  /**
   * 视频提取工作流
   * 创建文件夹、上传视频、创建视频提取任务
   */
  startVideoExtractionWorkflow: async (
    projectParams: CreateProjectParams,
    file: File
  ) => {
    try {
      // 步骤1：创建文件夹
      const projectResult = await projectService.createProject(projectParams);
      const projectId = projectResult.data.id;
      
      // 步骤2：上传视频文件
      const fileResult = await projectService.uploadFile({
        project_id: projectId,
        file
      });
      const fileId = fileResult.data.id;
      
      // 步骤3：创建视频提取任务
      const taskResult = await taskService.createVideoExtractionTask({
        project_id: projectId,
        file_ids: [fileId],
        task_type: 'video_extraction'
      });
      
      return {
        projectId,
        fileId,
        taskId: taskResult.data.id
      };
    } catch (error) {
      console.error('视频提取工作流启动失败:', error);
      throw error;
    }
  },
  
  /**
   * 视频压制工作流
   * 创建文件夹、上传视频和字幕文件、创建视频压制任务
   */
  startVideoMergingWorkflow: async (
    projectParams: CreateProjectParams,
    videoFile: File,
    subtitleFile: File,
    mergingParams: Omit<MergingTaskParams, 'project_id' | 'file_ids'>
  ) => {
    try {
      // 步骤1：创建文件夹
      const projectResult = await projectService.createProject(projectParams);
      const projectId = projectResult.data.id;
      
      // 步骤2：上传视频文件
      const videoFileResult = await projectService.uploadFile({
        project_id: projectId,
        file: videoFile
      });
      const videoFileId = videoFileResult.data.id;
      
      // 步骤3：上传字幕文件
      const subtitleFileResult = await projectService.uploadFile({
        project_id: projectId,
        file: subtitleFile
      });
      const subtitleFileId = subtitleFileResult.data.id;
      
      // 步骤4：创建视频压制任务
      const taskResult = await taskService.createVideoMergingTask({
        project_id: projectId,
        file_ids: [videoFileId, subtitleFileId],
        ...mergingParams
      });
      
      return {
        projectId,
        fileIds: [videoFileId, subtitleFileId],
        taskId: taskResult.data.id
      };
    } catch (error) {
      console.error('视频压制工作流启动失败:', error);
      throw error;
    }
  },
  
  /**
   * 确认任务流程（在各关键节点调用）
   */
  confirmWorkflowStep: async (taskId: string | number, flowId: string | number) => {
    return taskService.confirmTaskFlow(taskId, flowId);
  },
  
  /**
   * 更新本土化映射或翻译字幕
   */
  updateWorkflowContent: async (taskId: string | number, params: ContentUpdateParams) => {
    return taskService.updateTaskContent(taskId, params);
  },
  
  /**
   * 获取任务状态
   */
  getWorkflowStatus: async (taskId: string | number) => {
    return taskService.getTask(taskId);
  }
};

export default workflowService;
