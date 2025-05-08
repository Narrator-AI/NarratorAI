"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { setApiKey } from "@/services/env-config";

export default function Settings() {
  const [apiKey, setApiKeyState] = useState("");
  
  // 组件加载时获取API密钥
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem('narrator_api_key') || "";
      setApiKeyState(savedApiKey);
    }
  }, []);
  
  const handleSaveSettings = () => {
    // 保存API密钥到localStorage
    setApiKey(apiKey);
    toast.success("API设置已保存");
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      
      <Tabs defaultValue="api" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="api">API设置</TabsTrigger>
          <TabsTrigger value="interface">界面设置</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API配置</CardTitle>
              <CardDescription>
                配置NarratorAI API密钥
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">NarratorAI API密钥</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="输入您的API密钥" 
                />
                <p className="text-xs text-muted-foreground">
                  您的API密钥会安全存储在本地，从不会发送到我们的服务器
                </p>
              </div>
              
              <Button onClick={handleSaveSettings}>保存API设置</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interface">
          <Card>
            <CardHeader>
              <CardTitle>界面设置</CardTitle>
              <CardDescription>
                自定义应用界面和交互方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="message-sound">消息提示音</Label>
                  <p className="text-sm text-muted-foreground">收到新消息时播放提示音</p>
                </div>
                <Switch id="message-sound" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-scroll">自动滚动</Label>
                  <p className="text-sm text-muted-foreground">自动滚动到最新消息</p>
                </div>
                <Switch id="auto-scroll" defaultChecked />
              </div>
              
              <Button onClick={() => toast.success("界面设置已保存")}>保存界面设置</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>高级设置</CardTitle>
              <CardDescription>
                高级用户配置选项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max-tokens">最大生成Token数</Label>
                <Input id="max-tokens" type="number" defaultValue={4096} />
                <p className="text-xs text-muted-foreground">
                  设置AI回复的最大长度
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperature">生成温度</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">0</span>
                  <Input 
                    id="temperature" 
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue="70" 
                    className="flex-1" 
                  />
                  <span className="text-sm">1</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  调整AI创造性程度：较低值产生更确定性的输出，较高值产生更多样化的输出
                </p>
              </div>
              
              <Button onClick={() => toast.success("高级设置已保存")}>保存高级设置</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
