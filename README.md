# 🚀 活码智能分发溯源系统 (One-Click Installation Guide)

> 基于 React 18 (Vite) + Node.js (Express) Build，极致高并发性能优化，配备微信/QQ/浏览器扫码精准智能分发与数据防洪自愈能力。

## 📥 Linux 服务器一键安装部署

在您的 Linux 服务器（支持 CentOS, Ubuntu, Debian 等）上，直接执行以下任一命令，即可自动安装运行所需环境（Node.js, Git, PM2），并下载、编译、守护运行活码系统：

### 命令行部署 (推荐)

**使用 curl 一键安装：**

```bash
curl -sSO https://raw.githubusercontent.com/qweyuqq1-crypto/huoma-xitong/main/install.sh && bash install.sh
```

**或者使用 wget 一键安装：**

```bash
wget -O install.sh https://raw.githubusercontent.com/qweyuqq1-crypto/huoma-xitong/main/install.sh && chmod +x install.sh && ./install.sh
```

---

## 🛠️ 将代码推送到您的 GitHub 仓库

您可以用以下两种方法，将当前在 AI Studio 编写的高性能系统代码推存、同步到您指定的 GitHub 仓库中：

### 方法一：通过 AI Studio 网页内置菜单直接同步（零命令）
1. 在 AI Studio 编辑器右上角，点击 **Settings (设置)** 齿轮图标。
2. 找到 **Export (导出)** / **GitHub Sync** 相关选项。
3. 绑定或连接您的 GitHub 账号。
4. 选择或填写您的仓库名称：`huoma-xitong`（用户名 `qweyuqq1-crypto`）。
5. 点击提交即可一键推送到您的 GitHub 仓库！

### 方法二：通过本地 Git 推送
如果您将代码下载到了本地，可打开终端进入项目根目录，依次运行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "feat: sync performance optimized qr-system with installer"

# 关联远程仓库
git remote add origin https://github.com/qweyuqq1-crypto/huoma-xitong.git

# 设为主分支
git branch -M main

# 推送到 GitHub
git push -u origin main
```

---

## ⚙️ 系统运维与自愈指令

安装脚本会自动配置 **PM2 进程守护程序**。如果系统异常崩溃，PM2 会自动在 1 秒内拉起自愈，确保服务永不离线：

- **查看实时运行日志：**
  ```bash
  pm2 logs qr-system
  ```
- **查看服务状态列表：**
  ```bash
  pm2 status
  ```
- **更新代码后手动重编译并重启服务：**
  ```bash
  git pull
  npm run build
  pm2 restart qr-system
  ```
- **停止服务：**
  ```bash
  pm2 stop qr-system
  ```

---

## ⚙️ 端口说明
部署成功后默认访问端口为 `3000`。
- 如果需要使用 80 (HTTP) 或 443 (HTTPS) 端口，建议在服务器安装 **Nginx** 并在 Nginx 配置中反向代理 `http://127.0.0.1:3000`，不仅更加安全，也能获得更高的静态资源并发处理效率。
