#!/bin/bash

# ==============================================================================
#  活码分发系统 - 一键安装与部署脚本 (Linux Build)
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

# 2. 检测 Node.js 环境
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

# 3. 检测并全局安装 PM2 进程守护程序
echo -e "\n${BLUE}[2/5] 正在配置后台守护管理工具 (PM2)...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}正在全局安装 PM2...${NC}"
    npm install -g pm2 --registry=https://registry.npmmirror.com
else
    echo -e "${GREEN}✓ 已检测到 PM2 进程管理器。${NC}"
fi

# 4. 安装项目依赖
echo -e "\n${BLUE}[3/5] 正在安装生产环境依赖项...${NC}"
if [ -f "package.json" ]; then
    npm install --registry=https://registry.npmmirror.com
else
    echo -e "${RED}❌ 错误: 未能在当前目录找到 package.json 文件。${NC}"
    echo -e "${YELLOW}请确保您是在克隆后的项目根目录下运行此脚本。${NC}"
    exit 1
fi

# 5. 编译并打包项目
echo -e "\n${BLUE}[4/5] 正在编译前端与合并生产后端 CJS 包...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 编译打包失败。请检查依赖或系统内存是否充足 (建议至少 1GB 内存)。${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 编译成功！代码已预编译至 dist/ 目录。${NC}"

# 6. 配置运行与开机自启
echo -e "\n${BLUE}[5/5] 启动并设置自愈后台运行守护...${NC}"
# 删除历史同名服务
pm2 delete "qr-system" &> /dev/null

# 启动 PM2 服务
pm2 start dist/server.cjs --name "qr-system" --env NODE_ENV=production

# 保存状态
pm2 save

echo -e "\n${CYAN}================================================================${NC}"
echo -e "${GREEN}      🎉 恭喜！活码智能分发溯源系统已一键部署成功！🎉       ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "  📌  ${BOLD}服务状态：${NC} 运行中 (PM2 守护)"
echo -e "  🌐  ${BOLD}访问端口：${NC} http://你的服务器IP:3000"
echo -e "  🔧  ${BOLD}运维指令：${NC}"
echo -e "      - ${YELLOW}查看实时运行日志：${NC} pm2 logs qr-system"
echo -e "      - ${YELLOW}查看服务运行状态：${NC} pm2 status"
echo -e "      - ${YELLOW}重启系统服务：${NC}     pm2 restart qr-system"
echo -e "      - ${YELLOW}停止服务进程：${NC}     pm2 stop qr-system"
echo -e "${CYAN}================================================================${NC}"
