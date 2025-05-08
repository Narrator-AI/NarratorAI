import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    webpack: (config, { isServer }) => {
        // 处理 node: 协议前缀的模块引用（如 node:timers）
        config.resolve.alias = {
            ...config.resolve.alias,
            "node:timers": "timers",  // 将 node:timers 映射到标准 timers 模块
        };
        return config;
    },
    eslint: {
        // 构建时忽略所有 ESLint 错误 [1](@ref)
        ignoreDuringBuilds: true,
    },
    typescript: {
        // 构建时忽略 TypeScript 类型错误 [1](@ref)
        ignoreBuildErrors: true,
    }
};

export default nextConfig;