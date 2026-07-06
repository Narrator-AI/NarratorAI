"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import {
  LaptopIcon,
  MoonIcon,
  SunIcon,
  MenuIcon,
  HomeIcon,
  MessageSquareIcon,
  PieChartIcon,
  BoxIcon,
  FilesIcon,
  SearchIcon,
  User2Icon
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { useState } from "react"
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuItem 
} from './ui/dropdown-menu';

export function Navbar() {
  const [open, setOpen] = useState(false)
  
  return (
    <nav className="border-b bg-background sticky top-0 z-10">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="md:hidden mr-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-4 mt-4">
                <Link 
                  href="/" 
                  className="flex items-center gap-2 text-lg font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <HomeIcon className="h-5 w-5" />
                  首页
                </Link>
                <Link 
                  href="/chat" 
                  className="flex items-center gap-2 text-lg font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <MessageSquareIcon className="h-5 w-5" />
                  对话
                </Link>
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-lg font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <PieChartIcon className="h-5 w-5" />
                  仪表盘
                </Link>
                <Link 
                  href="/features" 
                  className="flex items-center gap-2 text-lg font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <BoxIcon className="h-5 w-5" />
                  功能展示
                </Link>
                <Link 
                  href="/forms" 
                  className="flex items-center gap-2 text-lg font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <FilesIcon className="h-5 w-5" />
                  高级表单
                </Link>
                <Link 
                  href="/docs" 
                  className="flex items-center gap-2 text-lg font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <FilesIcon className="h-5 w-5" />
                  文档
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Image 
            src="/logo.svg" 
            width={30} 
            height={30} 
            alt="NarratorAI Logo" 
            className="mr-2" 
          />
          <span className="font-bold text-xl">NarratorAI</span>
        </Link>
        
        <MainNav className="mx-6" />
        
        <div className="ml-auto flex items-center space-x-4">
          <SearchInput />
          <UserNav />
        </div>
      </div>
    </nav>
  )
}

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

function MainNav({ className, ...props }: MainNavProps) {
  return (
    <div className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link
        href="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        首页
      </Link>
      <Link
        href="/tasks"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        任务管理
      </Link>
      <Link
        href="/files"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        文件管理
      </Link>
      <Link
        href="/docs"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        文档中心
      </Link>
    </div>
  );
}

function SearchInput() {
  return (
    <div>
      <Input
        type="search"
        placeholder="搜索..."
        className="md:w-[200px] lg:w-[250px]"
      />
    </div>
  )
}

function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/user.png" alt="用户头像" />
            <AvatarFallback>用户</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">用户</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/profile" className="flex w-full">个人资料</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
