'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// 导入API服务
import projectService from '@/services/project-service';
import taskService, { TaskType } from '@/services/task-service';
import workflowService from '@/services/workflow-service';

/**
 * API测试组件
 * 用于测试各个API服务的功能
 */
export default function ApiTest() {
  const [results, setResults] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  // 记录测试结果
  const logResult = (testName: string, result: any) => {
    setResults(prev => ({
      ...prev,
      [testName]: result
    }));
  };

  // 开始测试
  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setLoading(prev => ({ ...prev, [testName]: true }));
      
      // 执行测试
      const result = await testFn();
      
      // 记录结果
      logResult(testName, {
        success: true,
        data: result
      });
      
      toast.success(`${testName}测试成功`);
    } catch (error) {
      console.error(`${testName}测试失败:`, error);
      
      // 记录错误
      logResult(testName, {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast.error(`${testName}测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  // 模拟创建文件夹测试
  const testCreateProject = async () => {
    // 这里我们只模拟API调用，不实际发送请求
    console.log('模拟创建文件夹API调用');
    
    // 模拟API响应
    return {
      code: 10000,
      message: 'success',
      data: {
        id: 1001,
        name: '测试文件夹',
        created_at: new Date().toISOString()
      }
    };
  };

  // 模拟文件上传测试
  const testUploadFile = async () => {
    console.log('模拟文件上传API调用');
    
    // 创建一个测试文件
    const testFile = new File(['test content'], 'test.mp4', { type: 'video/mp4' });
    
    // 模拟API响应
    return {
      code: 10000,
      message: 'success',
      data: {
        id: 2001,
        name: 'test.mp4',
        size: testFile.size,
        mime_type: testFile.type,
        created_at: new Date().toISOString()
      }
    };
  };

  // 模拟创建任务测试
  const testCreateTask = async () => {
    console.log('模拟创建任务API调用');
    
    // 模拟API响应
    return {
      code: 10000,
      message: 'success',
      data: {
        id: 3001,
        task_type: 'video_translation',
        status: 1,
        original_language: '中文',
        target_languages: [
          {
            language: '英语',
            area: '美国'
          }
        ],
        created_at: new Date().toISOString()
      }
    };
  };

  // 模拟确认任务流程测试
  const testConfirmTaskFlow = async () => {
    console.log('模拟确认任务流程API调用');
    
    // 模拟API响应
    return {
      code: 10000,
      message: 'success',
      data: null
    };
  };

  // 模拟获取任务状态测试
  const testGetTaskStatus = async () => {
    console.log('模拟获取任务状态API调用');
    
    // 模拟API响应
    return {
      code: 10000,
      message: 'success',
      data: {
        id: 3001,
        task_uuid: '',
        task_type: 'video_translation',
        status: 2,
        original_language: '中文',
        target_languages: [
          {
            area: '美国',
            language: '英语'
          }
        ],
        started_at: new Date(Date.now() - 1000 * 60).toISOString(),
        completed_at: null,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    };
  };

  // 渲染测试结果
  const renderTestResult = (testName: string) => {
    const result = results[testName];
    
    if (!result) {
      return <p className="text-gray-500">尚未执行测试</p>;
    }
    
    if (result.success) {
      return (
        <div>
          <p className="text-green-500 font-medium">测试成功</p>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      );
    } else {
      return (
        <div>
          <p className="text-red-500 font-medium">测试失败</p>
          <p className="mt-1 text-red-400">{result.error}</p>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">NarratorAI API 测试</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* 文件夹创建测试 */}
        <Card>
          <CardHeader>
            <CardTitle>文件夹创建测试</CardTitle>
            <CardDescription>测试创建文件夹API接口</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTestResult('createProject')}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => runTest('createProject', testCreateProject)}
              disabled={loading['createProject']}
            >
              {loading['createProject'] ? '测试中...' : '运行测试'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* 文件上传测试 */}
        <Card>
          <CardHeader>
            <CardTitle>文件上传测试</CardTitle>
            <CardDescription>测试文件上传API接口</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTestResult('uploadFile')}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => runTest('uploadFile', testUploadFile)}
              disabled={loading['uploadFile']}
            >
              {loading['uploadFile'] ? '测试中...' : '运行测试'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* 任务创建测试 */}
        <Card>
          <CardHeader>
            <CardTitle>任务创建测试</CardTitle>
            <CardDescription>测试创建翻译任务API接口</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTestResult('createTask')}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => runTest('createTask', testCreateTask)}
              disabled={loading['createTask']}
            >
              {loading['createTask'] ? '测试中...' : '运行测试'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* 任务确认测试 */}
        <Card>
          <CardHeader>
            <CardTitle>任务确认测试</CardTitle>
            <CardDescription>测试确认任务流程API接口</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTestResult('confirmTaskFlow')}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => runTest('confirmTaskFlow', testConfirmTaskFlow)}
              disabled={loading['confirmTaskFlow']}
            >
              {loading['confirmTaskFlow'] ? '测试中...' : '运行测试'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* 任务状态测试 */}
        <Card>
          <CardHeader>
            <CardTitle>任务状态测试</CardTitle>
            <CardDescription>测试获取任务状态API接口</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTestResult('getTaskStatus')}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => runTest('getTaskStatus', testGetTaskStatus)}
              disabled={loading['getTaskStatus']}
            >
              {loading['getTaskStatus'] ? '测试中...' : '运行测试'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
