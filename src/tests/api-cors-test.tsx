'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { getEnvConfig } from '@/services/env-config';

/**
 * API CORS诊断工具
 * 专门用于测试API连接和CORS问题
 */
export default function ApiCorsTest() {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>(`${getEnvConfig().API_BASE_URL}/api/narrator/ai/v1/fileSets`);
  const [requestMode, setRequestMode] = useState<string>('cors');
  const [loading, setLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [requestLogs, setRequestLogs] = useState<string[]>([]);

  // 添加日志
  const addLog = (message: string) => {
    setRequestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 清除日志
  const clearLogs = () => {
    setRequestLogs([]);
    setTestResult(null);
  };

  // 测试API连接
  const testApiConnection = async () => {
    clearLogs();
    setLoading(true);
    setTestResult(null);
    
    try {
      // 使用基础URL测试连接
      const baseUrl = getEnvConfig().API_BASE_URL;
      addLog(`尝试连接服务器基础URL: ${baseUrl}`);
      
      const response = await fetch(baseUrl, {
        method: 'GET',
        mode: 'no-cors' // 使用no-cors以避免CORS问题
      });
      
      addLog(`基础URL连接成功: ${response.status} ${response.statusText}`);
      addLog(`基础URL连接类型: ${response.type}`);
      
      setTestResult({
        success: true,
        message: '服务器基础URL可以连接'
      });
      
      toast({
        title: '测试成功',
        description: '服务器基础URL可以连接',
        variant: 'success'
      });
    } catch (error) {
      console.error('API基础URL连接测试失败:', error);
      
      addLog(`基础URL连接失败: ${error instanceof Error ? error.message : String(error)}`);
      
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: '测试失败',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 执行自定义API请求
  const executeApiRequest = async () => {
    clearLogs();
    setLoading(true);
    setTestResult(null);
    
    if (!apiKey) {
      toast({
        title: '警告',
        description: '请输入API密钥',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    try {
      addLog(`准备发送请求: ${apiUrl}`);
      addLog(`请求模式: ${requestMode}`);
      addLog(`使用API密钥: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
      
      // 设置请求头
      const headers: Record<string, string> = {
        'APP-KEY': apiKey
      };
      // 如果不是no-cors模式，添加其他头信息
      if (requestMode !== 'no-cors') {
        headers['Content-Type'] = 'application/json';
        headers['Accept'] = 'application/json';
      }
      
      addLog(`请求头: ${JSON.stringify(headers)}`);
      
      // 发送请求
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
        mode: requestMode as RequestMode,
        credentials: 'omit',
        cache: 'no-cache'
      });
      
      addLog(`响应状态: ${response.status} ${response.statusText}`);
      addLog(`响应类型: ${response.type}`);
      
      // 如果是no-cors模式，无法读取响应内容
      if (requestMode === 'no-cors') {
        addLog('无法读取no-cors模式的响应内容，但请求已发送');
        setTestResult({
          success: true,
          message: '请求已发送 (no-cors模式无法读取响应内容)'
        });
      } else {
        // 读取响应内容
        const text = await response.text();
        addLog(`响应内容: ${text}`);
        
        let data;
        try {
          data = JSON.parse(text);
          addLog(`解析的JSON数据: ${JSON.stringify(data, null, 2)}`);
          
          setTestResult({
            success: response.ok,
            status: response.status,
            data
          });
          
          if (data.code === 10000) {
            toast({
              title: 'API请求成功',
              description: '服务器返回成功响应',
              variant: 'success'
            });
          } else {
            toast({
              title: '请求成功但返回错误',
              description: `错误代码: ${data.code}, 信息: ${data.message}`,
              variant: 'default'
            });
          }
        } catch (e) {
          addLog(`响应不是有效的JSON: ${e instanceof Error ? e.message : String(e)}`);
          setTestResult({
            success: false,
            message: '响应不是有效的JSON',
            text
          });
        }
      }
    } catch (error) {
      console.error('API请求失败:', error);
      
      addLog(`请求失败: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        addLog(`错误堆栈: ${error.stack}`);
      }
      
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: '请求失败',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API CORS 诊断工具</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* API服务器基础连接测试 */}
        <Card>
          <CardHeader>
            <CardTitle>服务器连接测试</CardTitle>
            <CardDescription>测试API服务器基础连接</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              此测试会尝试连接API服务器的基础URL，不包含API密钥。使用no-cors模式，仅测试服务器是否可达。
            </p>
            <Button 
              onClick={testApiConnection}
              disabled={loading}
              className="w-full"
            >
              {loading ? '测试中...' : '测试服务器连接'}
            </Button>
          </CardContent>
        </Card>
        
        {/* 自定义API请求 */}
        <Card>
          <CardHeader>
            <CardTitle>自定义API请求</CardTitle>
            <CardDescription>配置并执行API请求</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">API密钥</label>
              <Input 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                placeholder="输入API密钥" 
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">API URL</label>
              <Input 
                value={apiUrl} 
                onChange={e => setApiUrl(e.target.value)}
                placeholder="API URL"
                className="mt-1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">请求模式</label>
              <RadioGroup value={requestMode} onValueChange={setRequestMode} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cors" id="cors" />
                  <Label htmlFor="cors">cors</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no-cors" id="no-cors" />
                  <Label htmlFor="no-cors">no-cors</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="same-origin" id="same-origin" />
                  <Label htmlFor="same-origin">same-origin</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={executeApiRequest}
              disabled={loading}
              className="w-full"
            >
              {loading ? '请求中...' : '执行API请求'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* 测试结果 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult && (
              <div className={`p-4 rounded mb-4 ${testResult.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                <h3 className={`font-bold ${testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {testResult.success ? '成功' : '失败'}
                </h3>
                {testResult.message && <p className="mt-1">{testResult.message}</p>}
                {testResult.status && <p className="mt-1">状态码: {testResult.status}</p>}
                {testResult.data && (
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
                {testResult.text && (
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                    {testResult.text}
                  </pre>
                )}
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-medium">请求日志</h3>
                <Button variant="outline" size="sm" onClick={clearLogs} disabled={requestLogs.length === 0}>
                  清除日志
                </Button>
              </div>
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded h-60 overflow-y-auto">
                {requestLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无日志</p>
                ) : (
                  <div className="space-y-1">
                    {requestLogs.map((log, index) => (
                      <p key={index} className="text-xs font-mono">{log}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
