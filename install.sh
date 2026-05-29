#!/bin/bash

# ==============================================================================
#  活码智能分发溯源系统 - 一键安装与部署脚本 (Linux Build)
#  GitHub Repository: qweyuqq1-crypto/huoma-xitong
# ==============================================================================

# 颜色定义
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[0;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

clear
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}          🚀  活码智能分发溯源系统 - 一键部署工具  🚀          ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "${BLUE}系统检测与准备工作中...${NC}"

# 检查是否为 Root 用户
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}⚠️  提示: 建议使用 root 权限或 sudo 运行此脚本以确保环境顺利安装。${NC}"
fi

# 1. 检测系统架构与包管理器
if [ -f /etc/debian_version ]; then
    PM="apt-get"
elif [ -f /etc/redhat-release ]; then
    PM="yum"
else
    PM="unknown"
fi

# 2. 自动化克隆逻辑 (支持一键远程脚本直接运行)
if [ ! -f "package.json" ] || ! grep -q '"name": "react-example"' package.json 2>/dev/null; then
    echo -e "${YELLOW}🔍 检测到当前未在项目目录内，准备为您自动下载并安装 [qweyuqq1-crypto/huoma-xitong]...${NC}"
    
    # 检测并安装 git
    if ! command -v git &> /dev/null; then
        echo -e "${YELLOW}正在安装 git 传输工具...${NC}"
        if [ "$PM" = "apt-get" ]; then
            apt-get update -y && apt-get install -y git
        elif [ "$PM" = "yum" ]; then
            yum install -y git
        else
            echo -e "${RED}❌ 无法识别的包管理器，自动安装 git 失败。请先手动执行：apt/yum install git${NC}"
            exit 1
        fi
    fi

    # 清理并克隆
    if [ -d "huoma-xitong" ]; then
        echo -e "${YELLOW}检测到同名目录 huoma-xitong，正在将其备份...${NC}"
        mv huoma-xitong "huoma-xitong_bak_$(date +%s)"
    fi

    echo -e "${BLUE}正在克隆 GitHub 仓库: https://github.com/qweyuqq1-crypto/huoma-xitong.git...${NC}"
    git clone https://github.com/qweyuqq1-crypto/huoma-xitong.git
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 克隆 GitHub 仓库失败。请检查服务器网络并确保仓库公开可读。${NC}"
        exit 1
    fi

    cd huoma-xitong || exit 1
fi

# 3. 检测 Node.js 环境
echo -e "\n${BLUE}[1/5] 正在检测 Node.js 运行环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}未检测到 Node.js，正在自动为您安装最佳版本 (Node.js LTS)...${NC}"
    if [ "$PM" = "apt-get" ]; then
        apt-get update -y && apt-get install -y curl gnupg
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif [ "$PM" = "yum" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    else
        echo -e "${RED}❌ 无法识别的操作系统。请先手动安装 Node.js (推荐 v20.x 以上)。${NC}"
        exit 1
    fi
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ 已检测到 Node.js 版本: ${NODE_VERSION}${NC}"
fi

# 4. 检测并全局安装 PM2 进程守护程序
echo -e "\n${BLUE}[2/5] 正在配置后台守护管理工具 (PM2)...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}正在全局安装 PM2 守护管理器...${NC}"
    npm install -g pm2 --registry=https://registry.npmmirror.com
else
    echo -e "${GREEN}✓ 已检测到 PM2 进程管理器。${NC}"
fi

# 5. 安装项目依赖
echo -e "\n${BLUE}[3/5] 正在配置国内镜安装生产环境依赖项...${NC}"
if [ -f "package.json" ]; then
    npm install --registry=https://registry.npmmirror.com
else
    echo -e "${RED}❌ 错误: 发生未预期错误，未能找到 package.json 文件。${NC}"
    exit 1
fi

# 6. 编译并打包项目
echo -e "\n${BLUE}[4/5] 正在编译前端与合并生产后端 CJS 包...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 编译打包失败。请检查依赖或系统内存是否充足 (建议至少 1GB 内存)。${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 编译成功！代码已预编译至 dist/ 目录。${NC}"

# 7. 配置运行与开机自启
echo -e "\n${BLUE}[5/5] 启动并设置自愈后台运行守护...${NC}"
# 删除历史同名服务
pm2 delete "qr-system" &> /dev/null

# 启动 PM2 服务
pm2 start dist/server.cjs --name "qr-system" --env NODE_ENV=production

# 保存状态以支持开机自启动
pm2 save

echo -e "\n${CYAN}================================================================${NC}"
echo -e "${GREEN}      🎉 恭喜！活码智能分发溯源系统已一键部署成功！🎉       ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "  📌  服务状态：运行中 (PM2 守护进程模式 - 异常自动重启)"
echo -e "  🌐  访问端口：http://你的服务器IP:3000"
echo -e "  🔧  服务管理与运维指令："
echo -e "      - ${YELLOW}查看运行日志：${NC} pm2 logs qr-system"
echo -e "      - ${YELLOW}查看实时状态：${NC} pm2 status"
echo -e "      - ${YELLOW}启动/重启服务：${NC}pm2 start/restart qr-system"
echo -e "      - ${YELLOW}关闭后台服务：${NC} pm2 stop qr-system"
echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}现在可以通过浏览器访问 http://您的服务器IP:3000 试用您的系统。${NC}"
