"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, MessageSquare, Sparkles, BookOpen } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function Features() {
  const [progress, setProgress] = useState(33);
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <div className="container max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold mb-6">功能展示</h1>
      
      <p className="text-muted-foreground mb-8">
        本页面展示了Narrator应用中使用的各种UI组件，基于Shadcn/ui构建
      </p>

      <Tabs defaultValue="interactive" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="interactive">交互组件</TabsTrigger>
          <TabsTrigger value="display">展示组件</TabsTrigger>
          <TabsTrigger value="feedback">反馈组件</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive">
          <div className="grid gap-8">
            {/* 手风琴组件 */}
            <Card>
              <CardHeader>
                <CardTitle>手风琴组件</CardTitle>
                <CardDescription>可折叠的内容面板</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Narrator是什么？</AccordionTrigger>
                    <AccordionContent>
                      Narrator是一款基于先进AI技术的智能叙事和对话助手，提供自然流畅的交互体验。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>支持哪些AI模型？</AccordionTrigger>
                    <AccordionContent>
                      我们支持多种AI模型，包括Claude 3.7、Claude 3.5、DeepSeek Reasoner和DeepSeek Chat等。
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>如何设置API密钥？</AccordionTrigger>
                    <AccordionContent>
                      前往设置页面，在API设置选项卡中输入您的NarratorAI API密钥。
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* 弹出框和悬停卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>弹出框和悬停卡片</CardTitle>
                <CardDescription>用于显示附加信息的浮动元素</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">点击弹出信息</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">弹出框内容</h4>
                        <p className="text-sm text-muted-foreground">
                          弹出框可以用于显示详细信息、设置选项或快速操作。
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="outline">悬停查看信息</Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex justify-between space-x-4">
                        <Avatar>
                          <span className="text-xs">N</span>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">Narrator AI</h4>
                          <p className="text-sm">
                            智能叙事助手，为您提供流畅自然的对话体验
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">提示工具</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>简短的提示信息</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>

            {/* 滑块组件 */}
            <Card>
              <CardHeader>
                <CardTitle>滑块组件</CardTitle>
                <CardDescription>用于选择特定范围内的值</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>调整值: {sliderValue[0]}</span>
                    </div>
                    <Slider
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      max={100}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>进度展示: {progress}%</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newProgress = Math.min(100, progress + 10);
                          setProgress(newProgress);
                          if (newProgress >= 100) {
                            toast.success("进度已完成！");
                          }
                        }}
                      >
                        增加进度
                      </Button>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="display">
          <div className="grid gap-8">
            {/* 徽章组件 */}
            <Card>
              <CardHeader>
                <CardTitle>徽章组件</CardTitle>
                <CardDescription>用于展示状态或标签</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>默认</Badge>
                  <Badge variant="secondary">次要</Badge>
                  <Badge variant="outline">轮廓</Badge>
                  <Badge variant="destructive">警告</Badge>
                  <Badge className="bg-blue-500 hover:bg-blue-600">自定义</Badge>
                  <Badge className="bg-green-500 hover:bg-green-600">成功</Badge>
                  <Badge className="bg-amber-500 hover:bg-amber-600">注意</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 骨架屏加载 */}
            <Card>
              <CardHeader>
                <CardTitle>骨架屏加载</CardTitle>
                <CardDescription>用于内容加载过程中的占位显示</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => toast.info("骨架屏常用于内容加载时提供更好的用户体验")}
                >
                  了解更多
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="grid gap-8">
            {/* 提醒组件 */}
            <Card>
              <CardHeader>
                <CardTitle>提醒组件</CardTitle>
                <CardDescription>用于显示重要信息和通知</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>提示</AlertTitle>
                    <AlertDescription>
                      这是一条普通提示信息，用于通知用户重要但非紧急的事项。
                    </AlertDescription>
                  </Alert>
                  
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>错误</AlertTitle>
                    <AlertDescription>
                      这是一条错误提示，用于显示严重问题或操作失败的情况。
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* 通知演示 */}
            <Card>
              <CardHeader>
                <CardTitle>通知演示</CardTitle>
                <CardDescription>各种类型的弹出通知</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => toast("这是一条普通通知")}
                  >
                    普通通知
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => toast.success("操作成功完成！")}
                  >
                    成功通知
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => toast.error("操作失败，请重试")}
                  >
                    错误通知
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => toast.info("这是一条信息提示")}
                  >
                    信息通知
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => toast.warning("请注意，这个操作可能有风险")}
                  >
                    警告通知
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
