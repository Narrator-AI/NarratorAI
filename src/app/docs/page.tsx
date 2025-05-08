import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Docs() {
  return (
    <div className="container max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold mb-6">文档中心</h1>

      <Tabs defaultValue="guide" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="guide">使用指南</TabsTrigger>
          <TabsTrigger value="api">API文档</TabsTrigger>
          <TabsTrigger value="models">模型说明</TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>Narrator 使用指南</CardTitle>
              <CardDescription>
                快速上手智能叙事助手
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">入门</h3>
                <p className="mb-4">欢迎使用Narrator智能叙事助手。本指南将帮助您快速了解和使用Narrator的各项功能。</p>

                <h4 className="text-md font-semibold mb-2">快速开始</h4>
                <ol className="list-decimal list-inside space-y-2 mb-4">
                  <li>在设置页面配置您的API密钥</li>
                  <li>选择您偏好的AI模型</li>
                  <li>前往聊天页面开始对话</li>
                </ol>

                <h4 className="text-md font-semibold mb-2">基本功能</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>智能对话：支持多轮上下文记忆的自然语言交流</li>
                  <li>多模型支持：可选择Claude、DeepSeek等多种先进模型</li>
                  <li>界面定制：深色/浅色主题切换，界面偏好设置</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API文档</CardTitle>
              <CardDescription>
                Narrator API使用说明
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">API概览</h3>
                <p className="mb-4">
                  Narrator提供了RESTful API，允许开发者将AI能力集成到自己的应用中。
                  所有API调用都需要身份验证，且使用JSON格式进行数据交换。
                </p>

                <h4 className="text-md font-semibold mb-2">认证</h4>
                <p className="mb-2">所有API请求需要在Header中包含API密钥：</p>
                <pre className="bg-muted p-2 rounded text-sm overflow-x-auto mb-4">
                  {`Authorization: Bearer YOUR_API_KEY`}
                </pre>

                <h4 className="text-md font-semibold mb-2">基础端点</h4>
                <div className="space-y-2">
                  <div className="p-2 border rounded">
                    <p className="font-semibold">POST /v1/chat/completions</p>
                    <p className="text-sm text-muted-foreground">创建聊天完成请求</p>
                  </div>
                  <div className="p-2 border rounded">
                    <p className="font-semibold">GET /v1/models</p>
                    <p className="text-sm text-muted-foreground">获取可用模型列表</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>模型说明</CardTitle>
              <CardDescription>
                支持的AI模型及其特点
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded p-4">
                  <h3 className="text-lg font-semibold mb-1">Claude 3.7 Sonnet</h3>
                  <p className="text-sm text-muted-foreground mb-2">anthropic/claude-3.7-sonnet</p>
                  <p>Anthropic的高级模型，提供卓越的理解能力和知识深度，适合复杂任务和创意内容生成。</p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="text-lg font-semibold mb-1">Claude 3.5 Sonnet</h3>
                  <p className="text-sm text-muted-foreground mb-2">anthropic/claude-3.5-sonnet</p>
                  <p>平衡性能和效率的Claude模型，适合大多数日常任务和应用场景。</p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="text-lg font-semibold mb-1">DeepSeek Reasoner</h3>
                  <p className="text-sm text-muted-foreground mb-2">deepseek/deepseek-r1</p>
                  <p>专注于推理和问题解决的先进模型，在逻辑思维和数学问题上表现出色。</p>
                </div>

                <div className="border rounded p-4">
                  <h3 className="text-lg font-semibold mb-1">DeepSeek Chat</h3>
                  <p className="text-sm text-muted-foreground mb-2">deepseek/deepseek-chat</p>
                  <p>通用对话模型，平衡了响应质量和速度，适合一般对话和信息查询场景。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
