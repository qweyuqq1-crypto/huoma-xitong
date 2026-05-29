/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  QrCode, 
  User, 
  Database, 
  Globe, 
  ShieldAlert, 
  BarChart3, 
  Clock, 
  MapPin, 
  KeyRound, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Check, 
  Filter, 
  Calendar, 
  ExternalLink, 
  BookOpen, 
  Layers, 
  Server, 
  CheckCircle,
  Download,
  HelpCircle,
  Lock,
  X,
  ChevronRight,
  Sparkles,
  Terminal,
  ShieldCheck,
  Eye,
  Settings,
  Smartphone,
  ChevronDown,
  Info,
  Upload
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { DynamicQRConfig, DomainItem, ScanLog, SystemStats, QRGroupItem } from "./types";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

export default function App() {
  // Session Access Token state
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [authError, setAuthError] = useState("");

  // System Core Data States
  const [configs, setConfigs] = useState<DynamicQRConfig[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalScans: 0,
    wechatScans: 0,
    nonWechatScans: 0,
    failoversCount: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "configs" | "domains" | "logs">("dashboard");

  // Filter conditions for scan history
  const [logFilterQuery, setLogFilterQuery] = useState("");
  const [logFilterWechatOnly, setLogFilterWechatOnly] = useState(false);

  // Form States for Editing/Adding Configurations
  const [isAddingConfig, setIsAddingConfig] = useState(false);
  const [editConfigId, setEditConfigId] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<{
    id: string;
    title: string;
    type: "group" | "service";
    forceWechatBrowser: boolean;
    isActive: boolean;
    items: QRGroupItem[];
  }>({
    id: "",
    title: "",
    type: "group",
    forceWechatBrowser: true,
    isActive: true,
    items: []
  });

  // Simulator Panel States
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simCampaign, setSimCampaign] = useState("");
  const [simUa, setSimUa] = useState("Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302c) NetType/WIFI");
  const [simProvince, setSimProvince] = useState("Guangdong");
  const [simIp, setSimIp] = useState("14.18.2.19");
  const [simHour, setSimHour] = useState(new Date().getHours());
  const [simDevice, setSimDevice] = useState("iPhone 16 Pro");
  const [simNetwork, setSimNetwork] = useState("WiFi");
  const [simStayDuration, setSimStayDuration] = useState(15);
  const [simResult, setSimResult] = useState<{
    success: boolean;
    wechatBlocked: boolean;
    targetQrName: string;
    targetQrUrl: string;
    hops: any[];
  } | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Domains Pool Adding States
  const [newDomainAddress, setNewDomainAddress] = useState("");
  const [newDomainType, setNewDomainType] = useState<"entrance" | "transit" | "landing" >("transit");
  const [domainMessage, setDomainMessage] = useState("");

  // Redis simulator logging states for glassmorphic portal visualizer
  const [redisLogs, setRedisLogs] = useState<string[]>([]);
  const [redisBlacklist, setRedisBlacklist] = useState<string[]>([]);
  const [isRedisLogExpanded, setIsRedisLogExpanded] = useState(false);
  const [isVpsGuideExpanded, setIsVpsGuideExpanded] = useState(false);

  // Auto Refresh triggers
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Download state and helper actions
  const [downloadTarget, setDownloadTarget] = useState<{ 
    url: string; 
    filename: string;
    fgColor: string;
    bgColor: string;
    logoDataUrl?: string;
    cornerRadius: number;
  } | null>(null);

  const handleDownloadQrAction = async (item: QRGroupItem) => {
    const qrcodeUrl = item.qrcodeUrl;
    if (!qrcodeUrl) return;
    const sanitizedName = item.name.trim().replace(/\s+/g, "_") || "qrcode";
    const filename = `qr_${sanitizedName}`;

    if (qrcodeUrl.startsWith("http") || (!qrcodeUrl.startsWith("data:") && !qrcodeUrl.startsWith("/assets/"))) {
      setDownloadTarget({ 
        url: qrcodeUrl, 
        filename: `${filename}.png`,
        fgColor: item.fgColor || "#000000",
        bgColor: item.bgColor || "#ffffff",
        logoDataUrl: item.logoDataUrl || "",
        cornerRadius: item.cornerRadius !== undefined ? item.cornerRadius : 8
      });
      return;
    }

    if (qrcodeUrl.startsWith("/assets/") || qrcodeUrl.startsWith("data:")) {
      try {
        const img = new Image();
        img.src = qrcodeUrl;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 300;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, size, size);
            
            ctx.fillStyle = item.bgColor || "#ffffff";
            ctx.fillRect(0, 0, size, size);

            const r = item.cornerRadius !== undefined ? (item.cornerRadius * size / 100) : 0;
            
            if (r > 0) {
              ctx.beginPath();
              ctx.moveTo(r, 0);
              ctx.lineTo(size - r, 0);
              ctx.quadraticCurveTo(size, 0, size, r);
              ctx.lineTo(size, size - r);
              ctx.quadraticCurveTo(size, size, size - r, size);
              ctx.lineTo(r, size);
              ctx.quadraticCurveTo(0, size, 0, size - r);
              ctx.lineTo(0, r);
              ctx.quadraticCurveTo(0, 0, r, 0);
              ctx.closePath();
              ctx.clip();
            }

            ctx.drawImage(img, 0, 0, size, size);

            const pngUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        };
        img.onerror = () => {
          const a = document.createElement("a");
          a.href = qrcodeUrl;
          a.download = `${filename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
      } catch (e) {
        const a = document.createElement("a");
        a.href = qrcodeUrl;
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  useEffect(() => {
    let intervalId: any;
    if (token) {
      const fetchRedisData = () => {
        const apiHeaders = token ? { "Authorization": `Bearer ${token}` } : {};
        Promise.all([
          fetch("/api/admin/redis-logs", { headers: apiHeaders }).then(r => r.json()),
          fetch("/api/admin/redis-blacklist", { headers: apiHeaders }).then(r => r.json())
        ]).then(([logsRes, blacklistRes]) => {
          if (logsRes.logs) setRedisLogs(logsRes.logs);
          if (blacklistRes.blacklist) setRedisBlacklist(blacklistRes.blacklist);
        }).catch(err => console.log("Redis polling alert:", err));
      };
      
      fetchRedisData();
      intervalId = setInterval(fetchRedisData, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token, refreshTrigger]);

  // Mock User Agent template presets
  const UA_PRESETS = [
    { name: "📱 微信内置浏览器 (iPhone Client)", value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302c) NetType/WIFI Language/zh_CN" },
    { name: "📱 微信内置浏览器 (Android Client)", value: "Mozilla/5.0 (Linux; Android 14; NE2210 Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 MMWEBID/5713 MicroMessenger/8.0.47.2560" },
    { name: "🌐 苹果手机 Safari (普通浏览器)", value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1" },
    { name: "💻 电脑版谷歌 Chrome 浏览器", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
    { name: "🕷️ 恶意爬虫 / 百度搜索蜘蛛 (Baiduspider)", value: "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)" }
  ];

  // Geolocation presets for simulated scans
  const PROVINCE_PRESETS = [
    { code: "Guangdong", name: "广东省 (Guangdong)" },
    { code: "Beijing", name: "北京市 (Beijing)" },
    { code: "Shanghai", name: "上海市 (Shanghai)" },
    { code: "Zhejiang", name: "浙江省 (Zhejiang)" },
    { code: "Sichuan", name: "四川省 (Sichuan)" },
    { code: "Hubei", name: "湖北省 (Hubei)" },
    { code: "HongKong", name: "香港特别行政区 (HongKong)" }
  ];

  // 1. Initial State Synchronization & Async Load Block
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const apiHeaders: Record<string, string> = { "Authorization": `Bearer ${token}` };

    Promise.all([
      fetch("/api/admin/configs", { headers: apiHeaders }).then(r => r.json()),
      fetch("/api/admin/domains", { headers: apiHeaders }).then(r => r.json()),
      fetch("/api/admin/logs", { headers: apiHeaders }).then(r => r.json()),
      fetch("/api/admin/stats", { headers: apiHeaders }).then(r => r.json())
    ]).then(([configsData, domainsData, logsData, statsData]) => {
      if (configsData && configsData.configs) setConfigs(configsData.configs);
      if (domainsData && domainsData.domains) setDomains(domainsData.domains);
      if (logsData && logsData.logs) setLogs(logsData.logs);
      if (statsData && statsData.stats) {
        setStats(statsData.stats);
        setChartData(statsData.chartData || []);
      }
      
      // Auto set the simulator campaign if empty
      if (configsData && configsData.configs && configsData.configs.length > 0 && !simCampaign) {
        setSimCampaign(configsData.configs[0].id);
      }
    }).catch(err => {
      console.error("API sync error:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [token, refreshTrigger]);

  // Handle administrator login validation challenge
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
        setRefreshTrigger(prev => prev + 1);
      } else {
        setAuthError(data.error || "登入失败");
      }
    } catch {
      setAuthError("Network server connection timed out.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (downloadTarget) {
      const timer = setTimeout(() => {
        const canvas = document.getElementById("hidden-download-canvas") as HTMLCanvasElement | null;
        if (canvas) {
          try {
            const pngUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = downloadTarget.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (error) {
            console.error("Canvas download failed:", error);
          }
        }
        setDownloadTarget(null);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [downloadTarget]);

  // Sign out developer
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setConfigs([]);
  };

  const handleClearRedisBlacklist = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/redis-clear-blacklist", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRefreshTrigger(p => p + 1);
      }
    } catch {
      console.error("Error clearing Redis blacklist.");
    }
  };

  // 2. Routing Link Management API Actions
  const handleToggleCampaignState = async (config: DynamicQRConfig) => {
    if (!token) return;
    const updated = { ...config, isActive: !config.isActive };
    try {
      const res = await fetch(`/api/admin/configs/${config.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (e) {
      alert("Error synchronizing campaign toggle.");
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!configForm.id || !configForm.title) {
      alert("请填写唯一活码标志 ID 与活动名称。");
      return;
    }

    if (configForm.items.length === 0) {
      alert("您必须至少定义一个子承接目标二维码！");
      return;
    }

    const method = editConfigId ? "PUT" : "POST";
    const endpoint = editConfigId ? `/api/admin/configs/${editConfigId}` : "/api/admin/configs";

    try {
      setLoading(true);
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...configForm,
          timeRules: [], // clean mock integration
          regionRules: []
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddingConfig(false);
        setEditConfigId(null);
        setConfigForm({
          id: "",
          title: "",
          type: "group",
          forceWechatBrowser: true,
          isActive: true,
          items: []
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.error || "保存活码选项失败。");
      }
    } catch (err) {
      alert("网络同步错误。");
    } finally {
      setLoading(false);
    }
  };

  const startEditCampaign = (config: DynamicQRConfig) => {
    setEditConfigId(config.id);
    setConfigForm({
      id: config.id,
      title: config.title,
      type: config.type,
      forceWechatBrowser: config.forceWechatBrowser,
      isActive: config.isActive,
      items: JSON.parse(JSON.stringify(config.items)) // deep copy
    });
    setIsAddingConfig(true);
  };

  const handleDeleteCampaign = async (configId: string) => {
    if (!token || !window.confirm("确定要删除此活码调度活动吗？对应的计数配置将一并移除。")) return;
    try {
      const res = await fetch(`/api/admin/configs/${configId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch {
      alert("删除活动发生网络通讯异常。");
    }
  };

  const handleAddSubQrRow = () => {
    const newItem: QRGroupItem = {
      id: "item_sub_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      name: configForm.type === "group" 
        ? `裂变群码 0${configForm.items.length + 1}号` 
        : `VIP客服专员 ${String.fromCharCode(65 + configForm.items.length)}`,
      qrcodeUrl: `/assets/wechat_mock_qr_${(configForm.items.length % 3) + 1}.png`,
      maxScans: 15,
      currentScans: 0,
      weight: 1,
      isActive: true,
      fgColor: "#000000",
      bgColor: "#ffffff",
      logoDataUrl: "",
      cornerRadius: 8,
      subType: "wechat"
    };
    setConfigForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveSubQrRow = (idx: number) => {
    setConfigForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateSubQrRow = (idx: number, fields: Partial<QRGroupItem>) => {
    setConfigForm(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], ...fields };
      return { ...prev, items: updated };
    });
  };

  const handleSubQrImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        handleUpdateSubQrRow(idx, { qrcodeUrl: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  // 3. Domain Registration Pools Operations
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setDomainMessage("");

    if (!newDomainAddress) {
      setDomainMessage("❌ 域地址不能为空。");
      return;
    }

    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ domain: newDomainAddress, type: newDomainType })
      });
      const data = await res.json();
      if (res.ok) {
        setNewDomainAddress("");
        setDomainMessage("✅ 域名节点向中继反向代理注册并配置成功！");
        setRefreshTrigger(prev => prev + 1);
      } else {
        setDomainMessage(`❌ ${data.error || '域名导入校验错误'}`);
      }
    } catch {
      setDomainMessage("❌ 链接超时挂起。");
    }
  };

  const handleToggleDomainStatus = async (item: DomainItem) => {
    if (!token) return;
    const targetStatus = item.status === "healthy" ? "abnormal" : "healthy";
    try {
      const res = await fetch(`/api/admin/domains/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      if (res.ok) {
         setRefreshTrigger(prev => prev + 1);
      }
    } catch {
       alert("域名状态同步异常。");
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!token || !window.confirm("确定将此域名彻底从跳转池中注销吗？")) return;
    try {
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch {
      alert("移除域名节点异常。");
    }
  };

  // 4. Scanned Telemetry Simulator Triggers
  const triggerSimulatorScan = async () => {
    if (!simCampaign) {
      alert("请先选择一条需要执行沙盒测试的分配活动通道。");
      return;
    }
    setSimulating(true);
    setSimResult(null);

    try {
      const response = await fetch("/api/simulate/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId: simCampaign,
          customUa: simUa,
          customIp: simIp,
          customProvince: simProvince,
          customHour: simHour,
          customDevice: simDevice,
          customNetwork: simNetwork,
          customStayDuration: simStayDuration
        })
      });
      const data = await response.json();
      if (response.ok) {
        setTimeout(() => {
          setSimResult(data);
          setSimulating(false);
          setRefreshTrigger(prev => prev + 1);
        }, 1100);
      } else {
        alert(data.error || "模拟跳转服务器计算响应异常。");
        setSimulating(false);
      }
    } catch {
      alert("测试沙盒服务响应超时。");
      setSimulating(false);
    }
  };

  // 5. Clear Analytical Tracking Data
  const clearScanLogs = async () => {
    if (!token || !window.confirm("危险操作：确定要彻底清空数据库中所有的访客扫描记录与审计明细吗？此项清空不可撤销。")) return;
    try {
      const res = await fetch("/api/admin/logs/clear", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch {
      alert("数据清除异常。");
    }
  };

  // Memo filters for log lists parsing
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchText = log.configId.toLowerCase().includes(logFilterQuery.toLowerCase()) || 
                        log.configTitle.toLowerCase().includes(logFilterQuery.toLowerCase()) || 
                        log.targetQrName.toLowerCase().includes(logFilterQuery.toLowerCase()) ||
                        log.ip.includes(logFilterQuery) ||
                        log.location.toLowerCase().includes(logFilterQuery.toLowerCase());
      
      const matchWechat = !logFilterWechatOnly || log.isWechat;
      return matchText && matchWechat;
    });
  }, [logs, logFilterQuery, logFilterWechatOnly]);

  const activeDomainCounts = useMemo(() => {
    return {
      entrance: domains.filter(d => d.type === "entrance").length,
      transit: domains.filter(d => d.type === "transit").length,
      landing: domains.filter(d => d.type === "landing").length,
      unhealthy: domains.filter(d => d.status === "abnormal").length
    };
  }, [domains]);

  const avgStayDuration = useMemo(() => {
    const activeLogs = logs.filter(l => l.stayDuration && l.stayDuration > 0);
    if (activeLogs.length === 0) return 14; 
    const sum = activeLogs.reduce((acc, curr) => acc + (curr.stayDuration || 0), 0);
    return Math.round(sum / activeLogs.length);
  }, [logs]);

  const topDeviceModel = useMemo(() => {
    const devices = logs.filter(l => l.device).map(l => l.device);
    if (devices.length === 0) return "iPhone 16 Pro";
    const counts: Record<string, number> = {};
    devices.forEach(d => {
      if (d) counts[d] = (counts[d] || 0) + 1;
    });
    let top = "iPhone 16 Pro";
    let max = 0;
    Object.entries(counts).forEach(([device, count]) => {
      if (count > max) {
        max = count;
        top = device;
      }
    });
    return top;
  }, [logs]);

  const blockedAttacksCount = useMemo(() => {
    return logs.filter(l => l.isAttackBlocked).length;
  }, [logs]);

  // Quick launch simulator from specific campaign
  const launchSimulatorWithCampaign = (campaignId: string) => {
    setSimCampaign(campaignId);
    setSimResult(null);
    setIsSimulatorOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      {/* HEADER NAVIGATION BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-xl border border-emerald-500/15">
              <QrCode className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">十夜活码系统</span>
                <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-500/20 rounded-full font-mono">v3.5 Pro</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">多渠道智能分流、自愈防封与跨平台扫码路由决策中心</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {token && (
              <>
                <button
                  onClick={() => setIsSimulatorOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>在线测码沙盒</span>
                </button>
                <div className="hidden lg:flex items-center text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  <span>双向通道长链正常</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1.5 hover:bg-rose-50/60 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                >
                  安全退出
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* LOGIN PASS OVERVIEW */}
      {!token ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-slate-200/80 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-emerald-50 rounded-2xl border border-emerald-500/10 text-emerald-600 mb-3.5">
                <Lock className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">安全运维控制台</h2>
              <p className="text-xs text-slate-500 mt-1">请输入管理员身份凭据，进行域名安全和分流矩阵维护</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2]" />
                <span className="font-semibold">{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">运营管理员</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入帐号"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">登录保护口令</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium font-mono"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-xs transition-all text-xs mt-4 cursor-pointer"
              >
                {loading ? "正在验证身份安全..." : "授权系统进入 Control Panel"}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-slate-100 text-center">
              <div className="bg-slate-50/80 border border-slate-200/50 rounded-xl p-3.5 inline-block text-left w-full">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">📌 快速试用凭据：</span>
                <div className="text-[11px] font-medium text-slate-500 space-y-0.5">
                  <p>• 管理账号: <span className="text-slate-800 font-bold">admin</span></p>
                  <p>• 测试密码: <span className="text-slate-800 font-bold">admin123</span></p>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ADMIN ACTIVE SERVICES PANELS */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* LEFT COLUMN: VERTICAL NAVIGATION OPTIONS (STYLISH SIDEBAR) */}
            <div className="w-full md:w-64 shrink-0 sticky top-20">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-1.5">
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 mb-2 pb-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">十夜管理导航</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="系统活动就绪" />
                </div>
                {[
                  { id: "dashboard", label: "运营指标看板", icon: BarChart3 },
                  { id: "configs", label: "智能活码配置", icon: Layers },
                  { id: "domains", label: "高自愈域名池", icon: Globe },
                  { id: "logs", label: "访客访问审计", icon: Database },
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsAddingConfig(false);
                        setEditConfigId(null);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isActive 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <TabIcon className={`w-4 h-4 ${isActive ? "text-emerald-500" : "text-slate-400"}`} />
                        <span>{tab.label}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Minimal System Info Tag */}
              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200/80 text-[10px] text-slate-400 space-y-1">
                <p>• 当前节点: <span className="font-mono text-slate-500 font-bold">Cloud-Node-01</span></p>
                <p>• 吞吐率: <span className="font-mono text-slate-500 font-bold">99.98% (极高可用)</span></p>
                <p>• 服务版本: <span className="font-mono text-slate-500 font-bold">v3.5 Build2026</span></p>
              </div>
            </div>

            {/* RIGHT COLUMN: MAIN PANEL VIEWS */}
            <div className="flex-1 min-w-0 w-full">
              <AnimatePresence mode="wait">
            {/* ======================================= */}
            {/* TAB SECTION: DASHBOARD PERFORMANCE */}
            {/* ======================================= */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-5"
              >
                {/* 4 CORE METRICS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <QrCode className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-wider">今日累计扫码量</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalScans} <span className="text-xs font-semibold text-slate-400">次</span></h3>
                      <p className="text-[10px] text-slate-500">Redis 原子计数并发安全</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                      <CheckCircle className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-wider">微信渠道直达率</p>
                      <h3 className="text-2xl font-bold text-teal-600 mt-0.5">
                        {stats.totalScans > 0 ? Math.round((stats.wechatScans / stats.totalScans)*100) : 0}%
                      </h3>
                      <p className="text-[10px] text-slate-500">微信内置识别拦截外部</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <ShieldAlert className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-wider">拦截防屏蔽机制</p>
                      <h3 className="text-2xl font-bold text-amber-700 mt-0.5">{stats.nonWechatScans} <span className="text-xs font-semibold text-slate-400">次</span></h3>
                      <p className="text-[10px] text-slate-500">拦截非微信及垃圾爬虫</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <RefreshCw className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-wider">节点自动容灾路由</p>
                      <h3 className="text-2xl font-bold text-blue-600 mt-0.5">{stats.failoversCount} <span className="text-xs font-semibold text-slate-400">次</span></h3>
                      <p className="text-[10px] text-slate-500">自动检测阻断及故障秒切</p>
                    </div>
                  </div>
                </div>

                {/* CHART WORK AREA & SECONDARY KPI BENTO */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* LEFT AREA: CHART */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">最新小时扫码走势分析</h4>
                        <p className="text-[11px] text-slate-400">实时统计微信扫码活动流量与普通浏览器拦截过滤频率</p>
                      </div>
                      <div className="flex items-center gap-3.5 text-xs font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />微信直连</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />拦截过滤</span>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="coolWechat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="coolBlock" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "11px" }} />
                            <Area type="monotone" dataKey="微信扫码" name="微信扫码" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#coolWechat)" />
                            <Area type="monotone" dataKey="普通扫码(拦截)" name="外部/防屏蔽过滤" stroke="#94a3b8" strokeWidth={1} fillOpacity={1} fill="url(#coolBlock)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                          ⌛ 正在同步获取 Redis 数据包大盘走势...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT AREA: PERFORMANCE SENSORS BENTO */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col justify-around">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500">多维指纹特征</span>
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">正常接入</span>
                      </div>

                      <div className="space-y-4 pt-4">
                        {/* 1 */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">平均停留时间</span>
                          <span className="text-sm font-bold text-slate-800">{avgStayDuration} 秒</span>
                        </div>
                        {/* 2 */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">核心扫描设备型配</span>
                          <span className="text-xs font-bold text-slate-800 max-w-[150px] truncate" title={topDeviceModel}>
                            {topDeviceModel}
                          </span>
                        </div>
                        {/* 3 */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">攻击刷量拦截</span>
                          <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                            <span>{blockedAttacksCount} 次</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* REDIS SECURITY POOL STATE */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-indigo-500">REDIS 访问控制库</p>
                          <h4 className="text-sm font-bold text-slate-800 mt-0.5">{redisBlacklist.length} 个限频拦截 IP</h4>
                        </div>
                        {redisBlacklist.length > 0 && (
                          <button
                            onClick={handleClearRedisBlacklist}
                            className="text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 py-1 px-3.5 rounded-lg border border-rose-200/40 transition-colors cursor-pointer"
                          >
                            一键解除
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">限制单个IP在1分钟内高频、非脚本恶意扫码群入口</p>
                    </div>
                  </div>
                </div>

                {/* COLLAPSIBLE DEV STICKY MONITOR: REDIS CLI STREAMS */}
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <button 
                    onClick={() => setIsRedisLogExpanded(!isRedisLogExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Terminal className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold font-mono">🛠️ 实时 Redis 数据交互监控监听流 (Developer CLI Monitor)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
                      <span>{isRedisLogExpanded ? "点击折叠" : "点击展开监控器"}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isRedisLogExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isRedisLogExpanded && (
                    <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs border-t border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-slate-900 pb-2 mb-2">
                        <span>💻 $ redis-cli -p 6379 MONITOR</span>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Redis-First 高并发代理网关同步中 ({configs.length} 个活码缓存)</span>
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] text-emerald-400 leading-relaxed max-w-full">
                        {redisLogs.length > 0 ? (
                          redisLogs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-slate-600 select-none">❯</span>
                              <span className={
                                log.includes("INCR") ? "text-amber-400" :
                                log.includes("SADD") || log.includes("SISMEMBER") ? "text-rose-400" :
                                log.includes("configs_hash") ? "text-sky-300" : "text-emerald-300/90"
                              }>
                                {log}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-center py-6">
                            ⏳ 暂无实时扫码流，点击右上角 “⚡ 在线测码沙盒” 执行扫描测试，即可瞬时在此捕获到最新的 Redis INCR/HGET /SISMEMBER 指令日志。
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* TAB SECTION: CAMPAIGN CONFIGS */}
            {/* ======================================= */}
            {activeTab === "configs" && (
              <motion.div
                key="configs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-5"
              >
                {!isAddingConfig ? (
                  <div className="space-y-4">
                    {/* Header line */}
                    <div className="flex justify-between items-center flex-wrap gap-3.5">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">活码通道分发管理</h3>
                        <p className="text-xs text-slate-500 mt-0.5">创建及分配落地二维码，扫其限扫阈值上限、或配置多客服防封轮询分权</p>
                      </div>
                      <button
                        onClick={() => {
                          setConfigForm({
                            id: "campaign_" + Math.random().toString(36).substring(7),
                            title: "",
                            type: "group",
                            forceWechatBrowser: true,
                            isActive: true,
                            items: [
                              {
                                id: "item1",
                                name: "种子客户私域群 1群",
                                qrcodeUrl: "/assets/wechat_mock_qr_1.png",
                                maxScans: 10,
                                currentScans: 0,
                                weight: 1,
                                isActive: true
                              }
                            ]
                          });
                          setIsAddingConfig(true);
                          setEditConfigId(null);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-emerald-300" />
                        <span>快速新建活码端点</span>
                      </button>
                    </div>

                    {/* Matrix Cards Row */}
                    {configs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {configs.map((config) => {
                          const totalScans = config.items.reduce((acc, it) => acc + it.currentScans, 0);
                          return (
                            <div key={config.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col justify-between">
                              {/* Card Header stats */}
                              <div className="p-5 border-b border-slate-100 flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        config.type === "group" ? "bg-emerald-50 text-emerald-600 border border-emerald-500/10" : "bg-indigo-50 text-indigo-600 border border-indigo-500/10"
                                      }`}>
                                        {config.type === "group" ? "👥 微信群(加满自动切)" : "👤 多客服(加权智能轮度)"}
                                      </span>
                                      {!config.isActive && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-400">已禁下线</span>
                                      )}
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800 mt-2">{config.title}</h4>
                                    <div className="flex items-center space-x-1 text-xs font-mono text-slate-400 mt-1">
                                      <span>入口投放映射 URL:</span>
                                      <span className="bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded text-[11px] select-all">/r/{config.id}</span>
                                    </div>
                                  </div>

                                  {/* Active control block */}
                                  <button
                                    onClick={() => handleToggleCampaignState(config)}
                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                      config.isActive ? "bg-emerald-500" : "bg-slate-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                        config.isActive ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Details tags */}
                                <div className="mt-4 border-t border-slate-50 pt-3 space-y-1.5 text-[11px] text-slate-500">
                                  <div className="flex justify-between items-center">
                                    <span>强制微信识别打开:</span>
                                    <span className={config.forceWechatBrowser ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}>
                                      {config.forceWechatBrowser ? '🛡️ 微信安全沙架限制 (开启)' : '🔓 任意浏览器允许直达'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Target Sub QRs List */}
                              <div className="p-4 bg-slate-50/70 border-b border-slate-100 space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider block">分配承接子码 ({config.items.length} 个):</span>
                                
                                {config.items.map((item) => {
                                  const progress = config.type === "group" ? (item.currentScans / item.maxScans) * 100 : 100;
                                  return (
                                    <div key={item.id} className="bg-white p-2 text-xs rounded-xl border border-slate-200/50 flex items-center justify-between gap-3">
                                      <div className="flex items-center space-x-2 min-w-0">
                                        {item.qrcodeUrl && (item.qrcodeUrl.startsWith("http") || !item.qrcodeUrl.startsWith("data:")) ? (
                                          <div 
                                            className="w-8 h-8 flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden p-0.5"
                                            style={{
                                              borderRadius: `${item.cornerRadius !== undefined ? Math.max(2, item.cornerRadius / 4) : 4}px`,
                                              backgroundColor: item.bgColor || "#ffffff"
                                            }}
                                          >
                                            <QRCodeSVG 
                                              value={item.qrcodeUrl} 
                                              size={24} 
                                              fgColor={item.fgColor || "#000000"} 
                                              bgColor={item.bgColor || "#ffffff"} 
                                              level="H"
                                              imageSettings={item.logoDataUrl ? {
                                                src: item.logoDataUrl,
                                                height: 6,
                                                width: 6,
                                                excavate: true
                                              } : undefined}
                                            />
                                          </div>
                                        ) : (
                                          <img 
                                            src={item.qrcodeUrl || "/assets/wechat_mock_qr_1.png"} 
                                            className="w-8 h-8 border border-slate-100 bg-slate-50 shrink-0 object-contain" 
                                            style={{
                                              borderRadius: `${item.cornerRadius !== undefined ? Math.max(2, item.cornerRadius / 4) : 4}px`
                                            }}
                                            alt="Min QR" 
                                          />
                                        )}
                                        <div className="truncate">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-700">{item.name}</span>
                                            {item.subType === "qq" ? (
                                              <span className="bg-sky-50 text-[10px] text-sky-600 border border-sky-100 font-extrabold px-1.5 py-0.2 rounded-md">QQ</span>
                                            ) : item.subType === "link" ? (
                                              <span className="bg-slate-100 text-[10px] text-slate-600 border border-slate-200 font-extrabold px-1.5 py-0.2 rounded-md">链接</span>
                                            ) : (
                                              <span className="bg-emerald-50 text-[10px] text-emerald-600 border border-emerald-100 font-extrabold px-1.5 py-0.2 rounded-md">微信</span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-400">
                                            {config.type === "group" 
                                              ? `分配数: ${item.currentScans} / 切换阈值: ${item.maxScans} 扫` 
                                              : `权重配比: ${item.weight} | 实际已被重定向: ${item.currentScans} 次`}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2 shrink-0">
                                        {config.type === "group" && (
                                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                            <div 
                                              className={`h-full ${item.currentScans >= item.maxScans ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                              style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                          </div>
                                        )}
                                        <button
                                          onClick={() => handleDownloadQrAction(item)}
                                          title="下载当前二维码 (PNG)"
                                          className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 p-1.5 rounded-lg shrink-0 transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Action Footer row */}
                              <div className="p-3 bg-white flex justify-between items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  已承合流: <span className="font-bold text-slate-700">{totalScans} 扫</span>
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => launchSimulatorWithCampaign(config.id)}
                                    className="text-[11px] text-slate-700 hover:text-black font-semibold px-2.5 py-1.5 hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Sparkles className="w-3 h-3 text-emerald-500" />
                                    <span>测试跳转</span>
                                  </button>
                                  <button
                                    onClick={() => startEditCampaign(config)}
                                    className="text-[11px] text-slate-700 hover:text-black font-semibold px-2.5 py-1.5 hover:bg-slate-50 border border-slate-200/80 rounded-lg transition-colors cursor-pointer"
                                  >
                                    核心配置
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCampaign(config.id)}
                                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold px-2 rounded-lg transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl text-slate-400">
                        <Info className="w-9 h-9 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                        <span className="text-xs">暂无配置过的活码调度规则，点击右上角 “快速新建活码端点” 创建一个。</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* CONFIGURATION CREATING FORM */
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 relative shadow-md">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 rounded-t-2xl" />

                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                      <div>
                        <h4 className="text-base font-bold text-slate-800">
                          {editConfigId ? "编辑微信推广调度活码" : "配置高可用动态微信推广活码"}
                        </h4>
                        <p className="text-xs text-slate-400">灵活配置多客服、多群二维码轮序，系统全功能支持防封阻自动断连与秒切自愈</p>
                      </div>
                      <button
                        onClick={() => setIsAddingConfig(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
                      >
                        ✕ 取消返回
                      </button>
                    </div>

                    <form onSubmit={handleSaveCampaign} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">1. 唯一映射链接定位标志 (字符 & 数值)</label>
                          <input
                            type="text"
                            value={configForm.id}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") }))}
                            disabled={!!editConfigId}
                            placeholder="如: qr_tech_campaign"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono font-medium"
                            required
                          />
                          <p className="text-[10px] text-slate-400 mt-1">创建后的实际扫码链接路径为: /r/{"{本标志}"}</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">2. 推广活动业务标题</label>
                          <input
                            type="text"
                            value={configForm.title}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="如: VIP特邀高端体验私域引流码"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">3. 活码智能分流算法</label>
                          <select
                            value={configForm.type}
                            onChange={(e) => {
                              const selectedType = e.target.value as any;
                              const updatedItems = configForm.items.map((it, idx) => ({
                                ...it,
                                name: selectedType === "group" 
                                  ? `裂变群码 0${idx + 1}号` 
                                  : `VIP客服专员 ${String.fromCharCode(65 + idx)}`
                              }));
                              setConfigForm(prev => ({ ...prev, type: selectedType, items: updatedItems }));
                            }}
                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                          >
                            <option value="group">👥 微信群加满自动轮替模式 (限频秒切)</option>
                            <option value="service">👤 坐席顾问多活负载权轮询模式 (分担流量)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">4. 安全微信识别锁定</label>
                          <select
                            value={configForm.forceWechatBrowser ? "true" : "false"}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, forceWechatBrowser: e.target.value === "true" }))}
                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                          >
                            <option value="true">🔒 开启 (非微信扫码提示'在微信内打开'，极防封)</option>
                            <option value="false">🌏 兼容任意浏览器直接流转 (测试调试更便捷)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">5. 活码上线态正常状态</label>
                          <select
                            value={configForm.isActive ? "true" : "false"}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, isActive: e.target.value === "true" }))}
                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                          >
                            <option value="true">🟢 开启 - 负载解析分流正常中</option>
                            <option value="false">🔴 离线 - 暂时进入停服拦截页</option>
                          </select>
                        </div>
                      </div>

                      {/* SUB TARGET POOLS MANAGEMENT */}
                      <div className="bg-slate-50/70 p-4 border border-slate-200/70 rounded-xl space-y-3.5">
                        <div className="flex justify-between items-center whitespace-nowrap">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">配置并上传备接子微信号/群码</span>
                            <span className="text-[10px] text-slate-400">设置每个微信子图及对应扫限拦截阀</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddSubQrRow}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-500" />
                            <span>添加二维码实例</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {configForm.items.map((item, idx) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col gap-4 relative">
                              {/* Header Row: Index number and Delete */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded">二维码实例 #{idx + 1}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubQrRow(idx)}
                                  disabled={configForm.items.length === 1}
                                  className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-20 p-1.5 rounded-lg shrink-0 cursor-pointer border border-transparent hover:border-rose-200/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Layout: QR Visualer on Left, inputs on Right */}
                              <div className="flex flex-col sm:flex-row gap-4 items-start">
                                {/* Left: Dynamic QR Visualizer */}
                                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200/60 rounded-2xl shrink-0 self-stretch sm:self-auto min-w-[124px]">
                                  <div 
                                    className="bg-white p-2 shadow-3xs overflow-hidden flex items-center justify-center relative transition-all duration-200"
                                    style={{
                                      border: "1px solid #edf2f7",
                                      borderRadius: `${item.cornerRadius !== undefined ? item.cornerRadius : 8}px`,
                                      backgroundColor: item.bgColor || "#ffffff"
                                    }}
                                  >
                                    {item.qrcodeUrl && (item.qrcodeUrl.startsWith("http") || !item.qrcodeUrl.startsWith("data:")) ? (
                                      <QRCodeSVG 
                                        value={item.qrcodeUrl} 
                                        size={84} 
                                        fgColor={item.fgColor || "#000000"} 
                                        bgColor={item.bgColor || "#ffffff"} 
                                        level="H"
                                        imageSettings={item.logoDataUrl ? {
                                          src: item.logoDataUrl,
                                          height: 18,
                                          width: 18,
                                          excavate: true
                                        } : undefined}
                                      />
                                    ) : (
                                      <img 
                                        src={item.qrcodeUrl || "/assets/wechat_mock_qr_1.png"} 
                                        className="w-[84px] h-[84px] object-contain" 
                                        style={{
                                          borderRadius: `${item.cornerRadius !== undefined ? item.cornerRadius : 8}px`
                                        }}
                                        alt="QR visual preview" 
                                      />
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-bold mt-2 tracking-wider uppercase font-mono mb-2">LIVE PREVIEW</span>
                                  
                                  {/* Download SVG/Canvas block */}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadQrAction(item)}
                                    title="下载高清二维码 (PNG)"
                                    className="w-full bg-white hover:bg-slate-100 text-[10px] text-slate-700 hover:text-black font-semibold border border-slate-200 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all shadow-3xs cursor-pointer mb-1.5"
                                  >
                                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>保存下载 PNG</span>
                                  </button>

                                  {/* Upload Button */}
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`upload-qr-file-${idx}`)?.click()}
                                    title="上传本地真实展示用的二维码图片（自动转为 base64 存入服务器）"
                                    className="w-full bg-slate-50 hover:bg-slate-100 text-[10px] text-slate-700 hover:text-black font-semibold border border-slate-200 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all shadow-3xs cursor-pointer"
                                  >
                                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>上传实体二维码</span>
                                  </button>
                                  <input
                                    id={`upload-qr-file-${idx}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleSubQrImageUpload(idx, e)}
                                  />

                                  {/* Undo/Reset if uploaded string is present */}
                                  {item.qrcodeUrl && item.qrcodeUrl.startsWith("data:") && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubQrRow(idx, { qrcodeUrl: `/assets/wechat_mock_qr_${(idx % 3) + 1}.png` })}
                                      className="text-[9px] text-rose-500 hover:text-rose-700 underline font-medium mt-1.5 cursor-pointer block text-center"
                                    >
                                      撤销上传，还原默认
                                    </button>
                                  )}
                                </div>

                                {/* Right: Input fields split in grid */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 flex-1 w-full text-left">
                                  
                                  {/* QR Code Routing subType selector */}
                                  <div className="md:col-span-12 col-auto">
                                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">活码载体类型</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {[
                                        { id: 'wechat', name: '🟢 微信扫码', desc: '长按识别微信群/客服（生成微信绿主题落地页）' },
                                        { id: 'qq', name: '🔵 QQ扫码', desc: '长按识别QQ群/个人（生成QQ蓝主题落地页）' },
                                        { id: 'link', name: '🔗 浏览器链接', desc: '直接进行302网址重定向（不提示扫码直接瞬移）' }
                                      ].map(opt => {
                                        const isSelected = (item.subType || 'wechat') === opt.id;
                                        return (
                                          <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                              handleUpdateSubQrRow(idx, { 
                                                subType: opt.id as any,
                                                // If link is selected, and it is a placeholder image path, default to a real URL
                                                ...(opt.id === 'link' && (!item.qrcodeUrl || item.qrcodeUrl.startsWith('/assets/')) ? { qrcodeUrl: "https://www.baidu.com" } : {}),
                                                // If transitioning back and it is an URL, maybe default back to a dummy asset
                                                ...(opt.id !== 'link' && item.qrcodeUrl.startsWith('http') && !item.qrcodeUrl.startsWith('data:') ? { qrcodeUrl: `/assets/wechat_mock_qr_${(idx % 3) + 1}.png` } : {})
                                              });
                                            }}
                                            className={`px-3.5 py-2.5 border text-left rounded-xl transition-all flex flex-col justify-between ${
                                              isSelected 
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-3xs' 
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/75'
                                            }`}
                                          >
                                            <span className="text-xs font-bold">{opt.name}</span>
                                            <span className={`text-[9px] mt-1 leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{opt.desc}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="md:col-span-6 col-auto">
                                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">
                                      {item.subType === 'link' ? '🔗 链接别名 / 推广渠道标记' : '🏷️ 二维码别名 / 席位名'}
                                    </label>
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => handleUpdateSubQrRow(idx, { name: e.target.value })}
                                      className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all rounded-lg text-xs font-medium"
                                      placeholder={item.subType === 'link' ? '例如: 百度推广落地' : '例如: 客服微信1群'}
                                      required
                                    />
                                  </div>

                                  <div className="md:col-span-6 col-auto">
                                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">
                                      {item.subType === 'link' ? '🎯 瞬移重定向网址 (Target URL)' : '🖼️ 对应的真实加人/加群链接 (任意URL)'}
                                    </label>
                                    <input
                                      type="text"
                                      value={item.qrcodeUrl}
                                      onChange={(e) => handleUpdateSubQrRow(idx, { qrcodeUrl: e.target.value })}
                                      className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all rounded-lg text-xs font-mono font-semibold"
                                      placeholder="粘贴微信原生加好友链接、加群URL或普通网页链接"
                                      required
                                    />
                                  </div>

                                  {configForm.type === "group" ? (
                                    <div className="md:col-span-6 col-auto">
                                      <label className="block text-[10px] text-slate-500 mb-1 font-semibold">扫码自动阈值切换线 (满该扫数自动切走)</label>
                                      <input
                                        type="number"
                                        value={item.maxScans}
                                        min={1}
                                        onChange={(e) => handleUpdateSubQrRow(idx, { maxScans: Number(e.target.value) })}
                                        className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all rounded-lg text-xs font-mono font-semibold"
                                        required
                                      />
                                    </div>
                                  ) : (
                                    <div className="md:col-span-6 col-auto">
                                      <label className="block text-[10px] text-slate-500 mb-1 font-semibold">顾问负载权重比例 (1 - 10，权重高分发多)</label>
                                      <input
                                        type="number"
                                        value={item.weight}
                                        min={1}
                                        max={10}
                                        onChange={(e) => handleUpdateSubQrRow(idx, { weight: Number(e.target.value) })}
                                        className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all rounded-lg text-xs font-mono font-semibold"
                                        required
                                      />
                                    </div>
                                  )}

                                  <div className="md:col-span-6 col-auto">
                                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">初始累计重定向数 (可模拟已热身次数)</label>
                                    <input
                                      type="number"
                                      value={item.currentScans}
                                      min={0}
                                      onChange={(e) => handleUpdateSubQrRow(idx, { currentScans: Number(e.target.value) })}
                                      className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all rounded-lg text-xs font-mono font-semibold"
                                      required
                                    />
                                  </div>

                                  {/* 🎨 brand customization tools panel */}
                                  <div className="md:col-span-12 mt-1 pt-3 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">🎨 品牌视觉美化自定义 (已对长按识别与下载等同步生效)</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                      {/* FG ColorPicker */}
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">前景色 (二维码码点)</label>
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="color"
                                            value={item.fgColor || "#000000"}
                                            onChange={(e) => handleUpdateSubQrRow(idx, { fgColor: e.target.value })}
                                            className="w-8 h-7 cursor-pointer rounded border border-slate-200 p-0"
                                          />
                                          <input
                                            type="text"
                                            value={item.fgColor || "#000000"}
                                            onChange={(e) => handleUpdateSubQrRow(idx, { fgColor: e.target.value })}
                                            className="w-full text-[10px] font-mono py-1 px-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* BG ColorPicker */}
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">背景色 (背景底板色)</label>
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="color"
                                            value={item.bgColor || "#ffffff"}
                                            onChange={(e) => handleUpdateSubQrRow(idx, { bgColor: e.target.value })}
                                            className="w-8 h-7 cursor-pointer rounded border border-slate-200 p-0"
                                          />
                                          <input
                                            type="text"
                                            value={item.bgColor || "#ffffff"}
                                            onChange={(e) => handleUpdateSubQrRow(idx, { bgColor: e.target.value })}
                                            className="w-full text-[10px] font-mono py-1 px-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* Corner Slider */}
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">圆角设置 ({item.cornerRadius ?? 8}px)</label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <input
                                            type="range"
                                            min="0"
                                            max="24"
                                            value={item.cornerRadius ?? 8}
                                            onChange={(e) => handleUpdateSubQrRow(idx, { cornerRadius: Number(e.target.value) })}
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                          />
                                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{item.cornerRadius ?? 8}px</span>
                                        </div>
                                      </div>

                                      {/* Mini Center Logo */}
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">中心 Logo 图标点缀</label>
                                        {item.logoDataUrl ? (
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <img src={item.logoDataUrl} className="w-7 h-7 object-contain rounded border border-slate-200 bg-white" alt="logo center preview" />
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateSubQrRow(idx, { logoDataUrl: "" })}
                                              className="text-[9px] bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 font-bold border border-slate-200 px-1.5 py-1 rounded transition-colors cursor-pointer"
                                            >
                                              清除 Logo
                                            </button>
                                          </div>
                                        ) : (
                                          <div>
                                            <button
                                              type="button"
                                              onClick={() => document.getElementById(`upload-logo-file-${idx}`)?.click()}
                                              className="w-full bg-white hover:bg-slate-50 text-[10px] text-slate-600 border border-slate-200 py-1 px-1.5 rounded font-semibold transition-colors text-center cursor-pointer"
                                            >
                                              选择上传 Logo
                                            </button>
                                            <input
                                              id={`upload-logo-file-${idx}`}
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const reader = new FileReader();
                                                  reader.onload = (event) => {
                                                    if (event.target?.result) {
                                                      handleUpdateSubQrRow(idx, { logoDataUrl: event.target.result as string });
                                                    }
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SUB SECTION: STEPS TIME RULES INFORMATION */}
                      <div className="p-4 bg-emerald-50/50 border border-emerald-500/10 rounded-xl">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          已内置高级北京时间自动时空分流、及全国省地分流识别：
                        </span>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                          系统将会智能根据访问者的所属 IP 运营商以及当前扫码小时，自动跳过常规群轮询规则，将 <b>广东省</b> 的客户直指资深销售；在 <b>(00:00 - 08:00) 深夜值备段</b>，所有引流将强制自动负载给夜巡机器人或备岗小蜜进行精准衔接，最大幅稳定业务转化流失。
                        </p>
                      </div>

                      {/* CANCEL & SAVE BUTTONS */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingConfig(false);
                            setEditConfigId(null);
                          }}
                          className="text-xs text-slate-500 hover:bg-slate-100 border border-slate-100 px-4 py-2.5 rounded-xl font-bold transition-all"
                        >
                          不保存，返回
                        </button>
                        <button
                          type="submit"
                          className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          核心活码规则保存并注入
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {/* ======================================= */}
            {/* TAB SECTION: DOMAINS POOL */}
            {/* ======================================= */}
            {activeTab === "domains" && (
              <motion.div
                key="domains"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* LEFT DOMAIN INJECTOR */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 lg:col-span-4 h-fit space-y-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-sm font-bold text-slate-800">动态域名注册与混淆</h3>
                    </div>

                    {domainMessage && (
                      <div className="p-3 bg-slate-50 text-[11px] font-semibold rounded-xl border border-slate-200">
                        {domainMessage}
                      </div>
                    )}

                    <form onSubmit={handleAddDomain} className="space-y-4 text-xs font-medium">
                      <div>
                        <label className="block text-slate-600 mb-1.5 font-bold">三层中继防阻挡层级类型 (Domain Level)</label>
                        <select
                          value={newDomainType}
                          onChange={(e) => setNewDomainType(e.target.value as any)}
                          className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 font-bold"
                        >
                          <option value="entrance">🟢 入口域名 (不变的对外首扫活码载体)</option>
                          <option value="transit">🟡 中转加密验证域名 (过滤UA并中继路由)</option>
                          <option value="landing">🟠 落地展示二维码域名 (易封，随机轮换展示)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1 font-normal">三层跳重定向是业内公认最彻底的微信裂变防屏蔽机制</p>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1.5 font-bold">域名全路径绑定 (FQDN Host)</label>
                        <input
                          type="text"
                          value={newDomainAddress}
                          onChange={(e) => setNewDomainAddress(e.target.value)}
                          placeholder="例如: landing92.yourdomain.cn"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 font-semibold font-mono"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        安全通道注册导入此域名
                      </button>
                    </form>

                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-[11px] text-indigo-950 font-medium leading-relaxed">
                      <span className="font-bold block text-slate-800 mb-1 text-xs">🧪 自动化自愈灾防模拟验证：</span>
                      <span>
                        您可以在右侧列表中对任意落地防封域名点击 <b>“模拟损坏”</b>。标记异常后，去点击 “⚡ 在线测码沙盒”，会立即观察到网防监测秒级自愈并无感切换至下一个备接落地域名的极容灾特性！
                      </span>
                    </div>
                  </div>

                  {/* RIGHT DOMAIN LIST */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 lg:col-span-8 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">中继防封域名解析池诊断</h4>
                      <p className="text-xs text-slate-400">系统提供实时微信防限制状态定时自检，遇封禁阻隔将自动对 Redis 完成无延迟重设、秒级熔断故障路由口</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse font-medium">
                        <thead>
                          <tr className="bg-slate-50/80 text-slate-400 font-bold border-b border-slate-100">
                            <th className="p-3">域层阶级 (Step)</th>
                            <th className="p-3">注册在案的域名主机 hostname</th>
                            <th className="p-3 text-center">系统可用检测</th>
                            <th className="p-3 text-center">微信防拦截检测阀</th>
                            <th className="p-3 text-right">人工维护管控</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {domains.map((item) => {
                            let typeBadge = "bg-emerald-50 text-emerald-600 border-emerald-500/15";
                            if (item.type === "transit") typeBadge = "bg-sky-50 text-slate-700 border-slate-500/10";
                            if (item.type === "landing") typeBadge = "bg-indigo-50 text-indigo-600 border-indigo-500/10";

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-sans font-bold ${typeBadge}`}>
                                    {item.type === "entrance" ? "入口层" : item.type === "transit" ? "中转审计" : "落地呈现"}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-700 font-bold select-all">{item.domain}</td>
                                <td className="p-3 text-center">
                                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                    item.status === "healthy" ? "bg-emerald-100/60 text-emerald-700" : "bg-rose-100/60 text-rose-700"
                                  }`}>
                                    {item.status === "healthy" ? "🟢 状态健康" : "🔴 被封自愈熔断"}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-slate-400 font-sans">{item.failCount} / 3 失败自动触发</td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleToggleDomainStatus(item)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                                      item.status === "healthy" 
                                        ? "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200/60" 
                                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200/60"
                                    }`}
                                  >
                                    {item.status === "healthy" ? "模拟拦截" : "一键恢复"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDomain(item.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
                                    title="注销此域名"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* VPS PRODUCTION SPEC DOCS */}
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <button 
                    onClick={() => setIsVpsGuideExpanded(!isVpsGuideExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 text-slate-700">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold font-sans">📚 生产环境集群化部署 VPS + Nginx 架构指引说明书</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium overflow-x-hidden whitespace-nowrap">
                      <span>{isVpsGuideExpanded ? "点击折叠" : "点击展开部署指南"}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isVpsGuideExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isVpsGuideExpanded && (
                    <div className="p-5 bg-white border-t border-slate-100 space-y-4 text-xs font-medium leading-relaxed text-slate-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-800 block text-xs">① 高并发 Redis 原子计数设计思想</span>
                            <p className="mt-1">
                              系统底座依赖 Redis 高性能原子事务命令（<code className="text-emerald-600 font-mono bg-white px-1 py-0.2 rounded font-bold">INCR</code>）。在高并发高压力推广流量扫入时，通过 O(1) 渐进，对超限群在内存即时秒切路由（Mutex），保障多条服务器线程互斥绝对安全。
                            </p>
                            <div className="mt-3 bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[10px] select-all overflow-x-auto">
                              {`// 推广活码分流核心原子验证机制 (Express Server pseudo code)
const curScans = await redis.incr(\`config_scan:\${id}:\${target_id}\`);
if (curScans >= maxLimit) {
  // 原子越限，自动在 Redis 哈希标记该二维码失效/下线并无感切换。
  await setQRExpiredInCache(id, target_id);
}`}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-800 block text-xs">② MySQL / Postgre 数据库表模型实体推荐</span>
                            <div className="mt-2 space-y-1 text-[11px] font-mono leading-normal">
                              <p>• <b>campaign</b>: (id, title, type, enforce_wechat, is_active, created_at)</p>
                              <p>• <b>sub_qrcodes</b>: (id, campaign_id, qrcode_image_url, max_scans, priority_weight, is_active)</p>
                              <p>• <b>domain_pools</b>: (id, domain_host, level_type(entrance/transit/landing), is_healthy)</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-800 block text-xs">③ VPS Nginx 反向混淆代理防封阻配置</span>
                            <p className="mt-1">
                              Nginx 层做预检查能阻断 90% 不必要流量，拦截恶意爬虫和外部自动审核蜘蛛的株连拦截：
                            </p>
                            <div className="mt-2.5 bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[10px] select-all overflow-x-auto">
                              {`server {
    listen 80;
    server_name *.safe-entrance.cn *.landing.com;

    # 封禁高并发脚本特征和已知自动化搜索引擎蜘蛛
    if ($http_user_agent ~* "Baiduspider|Sogou|Yisou|Yandex|spider|audit") {
        return 403;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="font-bold text-slate-800 block text-xs">④ 生产环境顶级域名防封建议</span>
                            <p>• <b>专板隔离：</b> 落地页千万不可放置除微信分享、探针脚本外的任何第三方外链。保持独立性避免被系统株连整站受封。</p>
                            <p>• <b>轻度轮流：</b> 每天自动混淆轮换中转页，高安全入口页仅引导验证并不呈现，降低单主域名每日拦截曝光阀限。</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* TAB SECTION: VISITORS LOGS */}
            {/* ======================================= */}
            {activeTab === "logs" && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4"
              >
                <div className="flex justify-between items-center flex-wrap gap-3.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">实时请求审计流水线</h3>
                    <p className="text-xs text-slate-500 mt-0.5">详细记录每一个扫码访客的時間、对应渠道、IP定位、浏览器 UserAgent 标识、网络及停留时间</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRefreshTrigger(prev => prev + 1)}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>刷新日志</span>
                    </button>
                    <button
                      onClick={clearScanLogs}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 py-2 px-3.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      清屏彻底清空
                    </button>
                  </div>
                </div>

                {/* FILTERS TOOLBAR */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/50">
                  <div className="w-full sm:flex-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Filter className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="模糊过滤推广渠道名、省份标识、承接微信号、IP或日志特征..."
                      value={logFilterQuery}
                      onChange={(e) => setLogFilterQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 pl-8.5 pr-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 placeholder-slate-400"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0 cursor-pointer w-full sm:w-auto">
                    <input
                      type="checkbox"
                      checked={logFilterWechatOnly}
                      onChange={(e) => setLogFilterWechatOnly(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-500 accent-emerald-500 h-4.5 w-4.5 cursor-pointer"
                    />
                    <span>仅查看微信安全扫入流量</span>
                  </label>
                </div>

                {/* REAL TIME LOG TABLE VIEW */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  {filteredLogs.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse font-medium">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-400 font-bold border-b border-slate-100">
                          <th className="p-3">扫描时间 (Beijing)</th>
                          <th className="p-3">渠道活码</th>
                          <th className="p-3">重定向分配结果</th>
                          <th className="p-3">设备/运营商</th>
                          <th className="p-3">浏览停留</th>
                          <th className="p-3">地理定位 (访客 IP)</th>
                          <th className="p-3">微信客户端校验</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 text-[11px] font-mono">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                            </td>
                            <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">{log.configTitle} (/{log.configId})</td>
                            <td className="p-3 whitespace-nowrap text-slate-900 font-bold font-sans">
                              {log.isAttackBlocked ? (
                                <span className="text-rose-600 font-bold flex items-center gap-1">❌ IP 强制频限 (Rate Block)</span>
                              ) : log.targetQrName.startsWith("Blocked") ? (
                                <span className="text-red-500 font-bold">🚫 UA 异常拦截防白</span>
                              ) : (
                                <span className="text-emerald-700 font-bold">🎯 {log.targetQrName}</span>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap font-sans text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded leading-none">{log.device || "iPhone 15"}</span>
                                <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded leading-none">{log.network || "WiFi"}</span>
                              </span>
                            </td>
                            <td className="p-3 text-amber-600 font-bold whitespace-nowrap">
                              {log.isAttackBlocked ? "0" : (log.stayDuration || 14)} <span className="text-[10px] text-slate-400 font-normal">秒 (Beacon)</span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="flex items-center gap-1.5 font-sans text-slate-600">
                                <span className="select-all font-mono font-bold text-slate-700">{log.ip}</span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center text-slate-500 text-[10px]"><MapPin className="w-3 h-3 text-emerald-500 shrink-0 mr-0.5" /> {log.location}</span>
                              </span>
                            </td>
                            <td className="p-3">
                              {log.isAttackBlocked ? (
                                <span className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">
                                  恶意拦截
                                </span>
                              ) : (
                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  log.isWechat ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                                }`}>
                                  {log.isWechat ? "✅ Yes (微信标识)" : "⚠️ No (常规外界推广)"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-16 text-slate-400 font-sans">
                      <HelpCircle className="w-9 h-9 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                      当前大盘数据库中尚未收到任何匹配的过滤审计流水。
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
            </div> {/* Closing RIGHT COLUMN: MAIN PANEL VIEWS */}
          </div> {/* Closing flex-col md:flex-row wrapper */}

          {/* FLOATING SENSORS CONTROLLER ON SCREEN RIGHT BOTTOM */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="bg-slate-900 text-white flex items-center justify-center p-3 sm:py-3 sm:px-4 rounded-full sm:rounded-2xl shadow-xl hover:bg-slate-800 transition-all cursor-pointer font-semibold text-xs space-x-1.5"
            >
              <Sparkles className="w-4.5 h-4.5 text-yellow-300 stroke-[2] animate-bounce" />
              <span className="hidden sm:inline">⚡ 在线极速测码</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* SLIDE-OVER DRAWER COMPONENT: SIMULATOR (MULTIPATH DEBUGGER) */}
          {/* ============================================================== */}
          <AnimatePresence>
            {isSimulatorOpen && (
              <>
                {/* BACKDROP */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.45 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSimulatorOpen(false)}
                  className="fixed inset-0 bg-black z-50"
                />

                {/* DRAWER PANE */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.22 }}
                  className="fixed top-0 right-0 h-full w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col justify-between overflow-hidden"
                >
                  
                  {/* Drawer Header */}
                  <div className="p-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center space-x-2.5">
                      <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-500/10">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">一键通道在线测码沙盒</h3>
                        <p className="text-[10px] text-slate-400 font-medium">仿真微信扫码及普通流量，安全穿透三级跳防拦截池</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsSimulatorOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-medium text-slate-700">
                    
                    <div>
                      <label className="block text-slate-600 mb-1.5 font-bold">1. 选定测试活码分发渠道</label>
                      <select
                        value={simCampaign}
                        onChange={(e) => setSimCampaign(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="">-- 请选择要测试的业务线 --</option>
                        {configs.map(cfg => (
                          <option key={cfg.id} value={cfg.id}>{cfg.title} (路径: /r/{cfg.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1.5 font-bold">2. 仿真设备指纹 UserAgent 头</label>
                      <select
                        value={simUa}
                        onChange={(e) => setSimUa(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        {UA_PRESETS.map((ua, idx) => (
                          <option key={idx} value={ua.value}>{ua.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1.5 font-bold">3. 请求省份</label>
                        <select
                          value={simProvince}
                          onChange={(e) => setSimProvince(e.target.value)}
                          className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          {PROVINCE_PRESETS.map(prov => (
                            <option key={prov.code} value={prov.code}>{prov.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1.5 font-bold">4. 虚拟 IP</label>
                        <input
                          type="text"
                          value={simIp}
                          onChange={(e) => setSimIp(e.target.value)}
                          className="w-full px-3 py-1.8 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-100 pt-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">物理设配型</label>
                        <select
                          value={simDevice}
                          onChange={(e) => setSimDevice(e.target.value)}
                          className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
                        >
                          <option value="iPhone 16 Pro Plus">iPhone 16 Pro Plus</option>
                          <option value="Huawei Mate 70 RS">Huawei Mate 70</option>
                          <option value="Xiaomi 15 Ultra">Xiaomi 15</option>
                          <option value="Windows Desktop">PC 电脑</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">模拟网络</label>
                        <select
                          value={simNetwork}
                          onChange={(e) => setSimNetwork(e.target.value)}
                          className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
                        >
                          <option value="WiFi">WiFi</option>
                          <option value="5G">5G 蜂窝</option>
                          <option value="4G">4G 蜂窝</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">模拟停留时间</label>
                        <select
                          value={simStayDuration}
                          onChange={(e) => setSimStayDuration(Number(e.target.value))}
                          className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
                        >
                          <option value="5">5秒 (极快过)</option>
                          <option value="15">15秒 (中浏览)</option>
                          <option value="35">35秒 (深度转化)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={triggerSimulatorScan}
                        disabled={simulating || !simCampaign}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
                      >
                        <Play className="w-4 h-4 fill-white text-emerald-300" />
                        <span>{simulating ? "正在仿真重定向分析引擎..." : "执行扫码沙盒链路追踪"}</span>
                      </button>
                    </div>

                    {/* INTERACTIVE HOP RENDER TRACE */}
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <span className="text-[11px] font-bold text-slate-400 tracking-wider block">追踪轨迹与承载反馈：</span>
                      
                      {simulating ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-2">
                          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                          <span className="text-[10px] text-slate-400">正在与 Redis 大厅/分布式自愈域名池中转校验...</span>
                        </div>
                      ) : simResult ? (
                        <div className="space-y-4">
                          
                          {/* visual timeline of hops */}
                          <div className="space-y-2.5">
                            {simResult.hops.map((hop, index) => {
                              let statusColor = "border-slate-200 bg-slate-50 text-slate-700";
                              if (hop.status === "failover") statusColor = "border-amber-400 bg-amber-50 text-amber-900";
                              if (hop.status === "blocked") statusColor = "border-rose-400 bg-rose-50 text-rose-950";
                              if (hop.status === "ok") statusColor = "border-emerald-500/30 bg-emerald-500/5 text-slate-800";

                              return (
                                <div key={index} className={`p-2.5 rounded-xl border ${statusColor} text-[11px] leading-relaxed relative overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1`}>
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-[9px] block text-slate-400 font-mono uppercase">
                                      Hop #{index + 1}: {hop.step}
                                    </span>
                                    <p className="font-mono text-slate-800 font-bold max-w-[280px] truncate select-all">{hop.domain || "二维码静态展示层"}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{hop.message}</p>
                                  </div>
                                  <div className="self-end sm:self-center shrink-0">
                                    {hop.status === "ok" && <Check className="w-4 h-4 text-emerald-600" />}
                                    {hop.status === "failover" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                                    {hop.status === "blocked" && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* final presentation image */}
                          {simResult.success ? (
                            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="space-y-1 sm:space-y-2 flex-grow min-w-0">
                                <span className={`inline-block py-0.5 px-2 text-white font-bold text-[9px] rounded ${
                                  simResult.subType === 'link' ? 'bg-indigo-600' : simResult.subType === 'qq' ? 'bg-sky-600' : 'bg-emerald-600'
                                }`}>
                                  {simResult.subType === 'link' ? '🔗 302 瞬移重定向 (SUCCESS)' : simResult.subType === 'qq' ? '🔵 QQ识别就绪 (SUCCESS)' : '🟢 微信识别就绪 (SUCCESS)'}
                                </span>
                                <p className="text-[11px] text-slate-800 font-bold leading-normal">
                                  成功分发至: <span className="text-slate-900 block mt-0.5 font-extrabold text-xs">{simResult.targetQrName}</span>
                                </p>
                                <p className="text-[9px] text-slate-400 font-normal">UA 验证正常、运营商检测为高质流量，已秒级自动更新 Redis 计数 (+1)</p>
                              </div>
                              
                              {simResult.subType === "link" ? (
                                <a
                                  href={simResult.targetQrUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full sm:w-auto self-stretch sm:self-center shrink-0 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                  title="点击直接测试落地重定向链接"
                                >
                                  <span>测试跳转链接</span>
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              ) : (
                                <div 
                                  className="p-1.5 bg-white shadow-3xs overflow-hidden shrink-0 flex items-center justify-center transition-all"
                                  style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: `${simResult.cornerRadius !== undefined ? simResult.cornerRadius : 8}px`,
                                    backgroundColor: simResult.bgColor || "#ffffff"
                                  }}
                                >
                                  {simResult.targetQrUrl && (simResult.targetQrUrl.startsWith("http") || !simResult.targetQrUrl.startsWith("data:")) ? (
                                    <QRCodeSVG 
                                      value={simResult.targetQrUrl} 
                                      size={80} 
                                      fgColor={simResult.fgColor || "#000000"}
                                      bgColor={simResult.bgColor || "#ffffff"}
                                      level="H"
                                      imageSettings={simResult.logoDataUrl ? {
                                        src: simResult.logoDataUrl,
                                        height: 16,
                                        width: 16,
                                        excavate: true
                                      } : undefined}
                                    />
                                  ) : (
                                    <img 
                                      src={simResult.targetQrUrl} 
                                      className="w-20 h-20 object-contain" 
                                      style={{
                                        borderRadius: `${simResult.cornerRadius !== undefined ? simResult.cornerRadius : 8}px`
                                      }}
                                      alt="QR Visualizer" 
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-rose-50 border border-rose-500/15 p-4 rounded-xl flex items-start gap-2.5">
                              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold text-rose-800 text-[11px] block">⚠️ 被防限制防护层截断 (AUDIT DETECT BLOCKED)</span>
                                <p className="text-[10px] text-rose-950 font-medium">
                                   检测到请求来源非微信内置微端环境（该活码设置了安全拦截强审限制）。系统已切断路由服务，避免真实承接微信号遭遇不可抗力封防。
                                </p>
                              </div>
                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
                          请在上方配妥请求，单击“执行扫码沙盒链路追踪”。
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Drawer Footer info links */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200/60 text-center flex justify-around">
                    <span className="text-[10px] text-slate-400 font-medium">真实的物理扫码测试：</span>
                    <a 
                      href={`/r/${simCampaign || 'qr_tech_campaign'}`} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      className="text-[10px] text-emerald-600 font-bold font-mono underline inline-flex items-center gap-0.5"
                    >
                      <span>打开 /r/{simCampaign || 'qr_tech_campaign'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                </motion.div>
              </>
            )}
          </AnimatePresence>

        </main>
      )}

      {downloadTarget && (
        <div style={{ display: "none" }}>
          <QRCodeCanvas
            id="hidden-download-canvas"
            value={downloadTarget.url}
            size={300}
            level="H"
            includeMargin={true}
            fgColor={downloadTarget.fgColor}
            bgColor={downloadTarget.bgColor}
            imageSettings={downloadTarget.logoDataUrl ? {
              src: downloadTarget.logoDataUrl,
              height: 60,
              width: 60,
              excavate: true
            } : undefined}
          />
        </div>
      )}

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-[11px] text-slate-400 tracking-normal">
        <div className="max-w-7xl mx-auto px-4 space-y-1 font-medium font-sans">
          <p>智能微信推广活码防阻断分流重定向调度引擎 &copy; 2026. 版权保护。</p>
          <p className="font-mono text-[10px]">Developer Profile: <strong>qweyuqq1@gmail.com</strong> | Dedicated Proxy Nodes Server Cluster Active</p>
        </div>
      </footer>
    </div>
  );
}
