"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Check, ChevronsUpDown, Info } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 安装必要的依赖
// npm install @hookform/resolvers zod react-hook-form date-fns @radix-ui/react-checkbox cmdk

// 注册表单的模式
const registerFormSchema = z.object({
  username: z.string().min(3, {
    message: "用户名必须至少3个字符",
  }).max(20, {
    message: "用户名不能超过20个字符",
  }),
  email: z.string().email({
    message: "请输入有效的电子邮件地址",
  }),
  password: z.string().min(8, {
    message: "密码必须至少8个字符",
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "密码必须包含至少一个大写字母、一个小写字母和一个数字",
  }),
  confirmPassword: z.string(),
  terms: z.literal(true, {
    errorMap: () => ({ message: "您必须同意条款和条件" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密码不匹配",
  path: ["confirmPassword"],
});

// 反馈表单模式
const feedbackFormSchema = z.object({
  rating: z.string({
    required_error: "请选择一个评分",
  }),
  name: z.string().min(2, {
    message: "名称必须至少2个字符",
  }).optional(),
  email: z.string().email({
    message: "请输入有效的电子邮件地址",
  }).optional(),
  feedback: z.string().min(10, {
    message: "反馈必须至少10个字符",
  }).max(500, {
    message: "反馈不能超过500个字符",
  }),
  category: z.string({
    required_error: "请选择一个反馈类别",
  }),
  contact: z.boolean().default(false),
});

// 预约表单模式
const appointmentFormSchema = z.object({
  name: z.string().min(2, {
    message: "名称必须至少2个字符",
  }),
  service: z.string({
    required_error: "请选择一个服务类型",
  }),
  date: z.date({
    required_error: "请选择日期",
  }),
  time: z.string({
    required_error: "请选择时间",
  }),
  requirements: z.string().max(300, {
    message: "特殊要求不能超过300个字符",
  }).optional(),
  email: z.string().email({
    message: "请输入有效的电子邮件地址",
  }),
  phone: z.string().min(6, {
    message: "请输入有效的电话号码",
  }),
});

const languages = [
  { label: "中文", value: "zh" },
  { label: "英文", value: "en" },
  { label: "日语", value: "ja" },
  { label: "韩语", value: "ko" },
  { label: "法语", value: "fr" },
  { label: "德语", value: "de" },
  { label: "西班牙语", value: "es" },
  { label: "俄语", value: "ru" },
] as const;

export default function FormsPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  
  // 注册表单
  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });
  
  // 反馈表单
  const feedbackForm = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      rating: "",
      name: "",
      email: "",
      feedback: "",
      category: "",
      contact: false,
    },
  });
  
  // 预约表单
  const appointmentForm = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: "",
      service: "",
      requirements: "",
      email: "",
      phone: "",
    },
  });
  
  // 注册表单提交
  function onRegisterSubmit(values: z.infer<typeof registerFormSchema>) {
    toast.success("注册成功！", {
      description: `欢迎 ${values.username}`,
    });
    registerForm.reset();
  }
  
  // 反馈表单提交
  function onFeedbackSubmit(values: z.infer<typeof feedbackFormSchema>) {
    toast.success("反馈已提交", {
      description: "感谢您的反馈！",
    });
    feedbackForm.reset();
  }
  
  // 预约表单提交
  function onAppointmentSubmit(values: z.infer<typeof appointmentFormSchema>) {
    // 这里通常会将预约数据发送到服务器
    toast.success("预约成功", {
      description: `您的预约已确认：${format(values.date, 'yyyy/MM/dd')} ${values.time}`,
    });
    appointmentForm.reset();
    setDate(undefined);
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold mb-6">高级表单组件</h1>
      
      <Tabs defaultValue="register" className="mb-8">
        <TabsList className="mb-4 grid grid-cols-3">
          <TabsTrigger value="register">用户注册</TabsTrigger>
          <TabsTrigger value="feedback">反馈表单</TabsTrigger>
          <TabsTrigger value="appointment">预约系统</TabsTrigger>
        </TabsList>
        
        {/* 注册表单 */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>创建账户</CardTitle>
              <CardDescription>
                注册一个新账户以开始使用我们的服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用户名</FormLabel>
                        <FormControl>
                          <Input placeholder="输入用户名" {...field} />
                        </FormControl>
                        <FormDescription>
                          您的显示名称，用于登录和个人资料
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>电子邮件</FormLabel>
                        <FormControl>
                          <Input placeholder="example@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          我们将通过此邮箱发送验证码
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>确认密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={registerForm.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            我同意
                            <a href="#" className="text-primary underline ml-1">服务条款</a>
                            和
                            <a href="#" className="text-primary underline ml-1">隐私政策</a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    创建账户
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                已有账户？
                <a href="#" className="text-primary underline ml-1">登录</a>
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* 反馈表单 */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>提交反馈</CardTitle>
              <CardDescription>
                告诉我们您的想法，帮助我们改进产品
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...feedbackForm}>
                <form onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)} className="space-y-6">
                  <FormField
                    control={feedbackForm.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>您对我们的评分</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-1"
                          >
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <FormItem key={rating} className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={rating.toString()} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {rating}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={feedbackForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>反馈类别</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择反馈类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="suggestion">建议</SelectItem>
                            <SelectItem value="bug">问题报告</SelectItem>
                            <SelectItem value="question">疑问</SelectItem>
                            <SelectItem value="praise">表扬</SelectItem>
                            <SelectItem value="other">其他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={feedbackForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>您的名称 (可选)</FormLabel>
                          <FormControl>
                            <Input placeholder="您的名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={feedbackForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>您的邮箱 (可选)</FormLabel>
                          <FormControl>
                            <Input placeholder="您的电子邮件" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={feedbackForm.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>您的反馈</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请详细描述您的反馈、问题或建议..."
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          您的反馈对我们至关重要，我们会认真对待每一条建议
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={feedbackForm.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            我同意被联系以了解更多信息
                          </FormLabel>
                          <FormDescription>
                            如果您选择此项，我们可能会通过您提供的邮箱联系您以获取更多详细信息
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">
                    提交反馈
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 预约表单 */}
        <TabsContent value="appointment">
          <Card>
            <CardHeader>
              <CardTitle>预约系统</CardTitle>
              <CardDescription>
                创建一个新的预约时间
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...appointmentForm}>
                <form onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)} className="space-y-6">
                  <FormField
                    control={appointmentForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>您的姓名</FormLabel>
                        <FormControl>
                          <Input placeholder="输入您的姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={appointmentForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>电子邮件</FormLabel>
                          <FormControl>
                            <Input placeholder="您的电子邮件" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appointmentForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>联系电话</FormLabel>
                          <FormControl>
                            <Input placeholder="您的联系电话" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={appointmentForm.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>服务类型</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择服务类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>翻译服务</SelectLabel>
                              <SelectItem value="translation_doc">文档翻译</SelectItem>
                              <SelectItem value="translation_live">实时口译</SelectItem>
                              <SelectItem value="translation_video">视频字幕</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>创作服务</SelectLabel>
                              <SelectItem value="writing_content">内容创作</SelectItem>
                              <SelectItem value="writing_edit">内容编辑</SelectItem>
                              <SelectItem value="writing_proofread">校对服务</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>咨询服务</SelectLabel>
                              <SelectItem value="consultation_general">一般咨询</SelectItem>
                              <SelectItem value="consultation_tech">技术咨询</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={appointmentForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>预约日期</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: zhCN })
                                  ) : (
                                    <span>选择日期</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setDate(date);
                                }}
                                disabled={(date) => 
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appointmentForm.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>预约时间</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择时间段" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="09:00">上午 9:00</SelectItem>
                              <SelectItem value="10:00">上午 10:00</SelectItem>
                              <SelectItem value="11:00">上午 11:00</SelectItem>
                              <SelectItem value="13:00">下午 1:00</SelectItem>
                              <SelectItem value="14:00">下午 2:00</SelectItem>
                              <SelectItem value="15:00">下午 3:00</SelectItem>
                              <SelectItem value="16:00">下午 4:00</SelectItem>
                              <SelectItem value="17:00">下午 5:00</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* 多选组件 */}
                  <div>
                    <Label className="text-sm font-medium">选择语言（可多选）</Label>
                    <div className="mt-1.5 mb-5">
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {selectedLanguages.length > 0
                              ? `已选择 ${selectedLanguages.length} 种语言`
                              : "选择语言"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="搜索语言..." />
                            <CommandEmpty>未找到相关语言</CommandEmpty>
                            <CommandGroup>
                              {languages.map((language) => (
                                <CommandItem
                                  key={language.value}
                                  value={language.value}
                                  onSelect={() => {
                                    setSelectedLanguages((prev) => {
                                      if (prev.includes(language.value)) {
                                        return prev.filter((item) => item !== language.value);
                                      } else {
                                        return [...prev, language.value];
                                      }
                                    });
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedLanguages.includes(language.value)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {language.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedLanguages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedLanguages.map(value => {
                            const language = languages.find(lang => lang.value === value);
                            return language ? (
                              <Badge key={value} variant="secondary" className="cursor-pointer" onClick={() => {
                                setSelectedLanguages(prev => prev.filter(item => item !== value));
                              }}>
                                {language.label} ×
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <FormField
                    control={appointmentForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>特殊要求（可选）</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请描述您的特殊需求或其他要求..."
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">
                    确认预约
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
