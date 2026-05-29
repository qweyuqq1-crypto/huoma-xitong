/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { DynamicQRConfig, DomainItem, ScanLog, SystemStats, QRGroupItem } from "./src/types";

const app = express();
const PORT = 3000;
const SECRET_KEY = "wechat_live_qr_secret_2026_xyz";
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Initialize Database connection with fallback seeds
interface DatabaseType {
  configs: DynamicQRConfig[];
  domains: DomainItem[];
  logs: ScanLog[];
  stats: SystemStats;
}

const DEFAULT_DOMAINS: DomainItem[] = [
  { id: "ent1", domain: "entrance.livecode.wechat.cn", type: "entrance", status: "healthy", failCount: 0 },
  { id: "ent2", domain: "qr.marketing-core.net", type: "entrance", status: "healthy", failCount: 0 },
  { id: "trans1", domain: "transit-gate1.alicdn-safe.com", type: "transit", status: "healthy", failCount: 0 },
  { id: "trans2", domain: "transit-gate2.alicdn-safe.com", type: "transit", status: "healthy", failCount: 0 },
  { id: "land1", domain: "landing-page-a19.tencent-safe.com", type: "landing", status: "healthy", failCount: 0 },
  { id: "land2", domain: "landing-page-b72.tencent-safe.com", type: "landing", status: "healthy", failCount: 0 },
  { id: "land3", domain: "landing-page-c08.tencent-safe.com", type: "landing", status: "healthy", failCount: 0 },
];

function getMockQRCodeSVG(title: string, subName: string, color: string = "#07C160") {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="300" height="300">
      <rect width="400" height="400" fill="#FFFFFF" rx="16" />
      <path d="M 30 30 L 90 30 M 30 30 L 30 90" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M 370 30 L 310 30 M 370 30 L 370 90" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M 30 370 L 90 370 M 30 370 L 30 310" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M 370 370 L 310 370 M 370 370 L 370 310" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none" />
      <rect x="50" y="50" width="60" height="60" fill="none" stroke="#222" stroke-width="10" />
      <rect x="70" y="70" width="20" height="20" fill="#222" />
      <rect x="290" y="50" width="60" height="60" fill="none" stroke="#222" stroke-width="10" />
      <rect x="310" y="70" width="20" height="20" fill="#222" />
      <rect x="50" y="290" width="60" height="60" fill="none" stroke="#222" stroke-width="10" />
      <rect x="70" y="310" width="20" height="20" fill="#222" />
      <rect x="290" y="290" width="30" height="30" fill="none" stroke="#222" stroke-width="6" />
      <rect x="302" y="302" width="6" height="6" fill="#222" />
      <g fill="#2D3748" opacity="0.85">
        <rect x="130" y="50" width="10" height="20" />
        <rect x="160" y="50" width="30" height="10" />
        <rect x="210" y="50" width="10" height="40" />
        <rect x="240" y="50" width="30" height="10" />
        <rect x="150" y="70" width="10" height="10" />
        <rect x="180" y="70" width="20" height="20" />
        <rect x="240" y="70" width="10" height="30" />
        <rect x="130" y="90" width="20" height="10" />
        <rect x="170" y="100" width="10" height="20" />
        <rect x="190" y="100" width="40" height="10" />
        <rect x="250" y="110" width="20" height="20" />
        <rect x="50" y="130" width="40" height="10" />
        <rect x="100" y="130" width="10" height="30" />
        <rect x="140" y="130" width="30" height="10" />
        <rect x="190" y="130" width="20" height="20" />
        <rect x="230" y="130" width="10" height="40" />
        <rect x="260" y="130" width="30" height="10" />
        <rect x="310" y="130" width="40" height="10" />
        <rect x="50" y="160" width="10" height="20" />
        <rect x="80" y="160" width="20" height="10" />
        <rect x="120" y="160" width="40" height="10" />
        <rect x="170" y="160" width="10" height="30" />
        <rect x="200" y="160" width="20" height="10" />
        <rect x="280" y="160" width="10" height="40" />
        <rect x="310" y="160" width="10" height="20" />
        <rect x="330" y="160" width="20" height="10" />
        <rect x="50" y="190" width="30" height="10" />
        <rect x="100" y="190" width="20" height="25" />
        <rect x="140" y="190" width="10" height="10" />
        <rect x="160" y="190" width="30" height="15" />
        <rect x="210" y="190" width="15" height="15" />
        <rect x="240" y="190" width="30" height="10" />
        <rect x="300" y="190" width="20" height="30" />
        <rect x="330" y="190" width="10" height="10" />
        <rect x="130" y="220" width="40" height="15" />
        <rect x="180" y="220" width="10" height="40" />
        <rect x="200" y="230" width="30" height="10" />
        <rect x="250" y="220" width="10" height="30" />
        <rect x="270" y="210" width="40" height="10" />
        <rect x="330" y="210" width="20" height="20" />
        <rect x="130" y="250" width="20" height="10" />
        <rect x="160" y="250" width="10" height="30" />
        <rect x="210" y="250" width="30" height="10" />
        <rect x="260" y="250" width="20" height="30" />
        <rect x="300" y="250" width="10" height="20" />
        <rect x="320" y="250" width="30" height="10" />
        <rect x="130" y="290" width="30" height="10" />
        <rect x="170" y="290" width="10" height="40" />
        <rect x="200" y="290" width="40" height="10" />
        <rect x="250" y="290" width="20" height="20" />
        <rect x="130" y="320" width="10" height="30" />
        <rect x="150" y="320" width="20" height="10" />
        <rect x="180" y="320" width="30" height="10" />
        <rect x="220" y="320" width="20" height="30" />
        <rect x="250" y="320" width="10" height="10" stroke="#000" />
      </g>
      <circle cx="200" cy="200" r="32" fill="${color}" />
      <g fill="#FFFFFF" transform="translate(182, 185) scale(0.9)">
        <path d="M15,6 C7.8,6 2,10.8 2,16.8 C2,20.1 4.5,23.1 8.5,24.8 L7.5,29.5 L12.5,26.8 C13.3,27 14.1,27.1 15,27.1 C22.2,27.1 28,22.3 28,16.3 C28,10.3 22.2,6 15,6 Z" opacity="0.9" />
        <path d="M26,14 C31,14 35,17.4 35,21.6 C35,23.9 33.2,26 30.5,27.2 L31.2,30.5 L27.7,28.6 C27.1,28.7 26.6,28.8 26,28.8 C21,28.8 17,25.4 17,21.2 C17,17 21,14 26,14 Z" />
      </g>
      <text x="200" y="380" font-family="'Inter', system-ui, sans-serif" font-size="12" fill="#718096" text-anchor="middle" font-weight="600">${title} - ${subName}</text>
    </svg>
  `;
}

// Convert code content into Base64 for the browser image source
function getMockQRCodeUrl(title: string, subName: string, color: string = "#07C160") {
  const svg = getMockQRCodeSVG(title, subName, color);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const DEFAULT_CONFIGS: DynamicQRConfig[] = [
  {
    id: "summer_group",
    title: "2026夏日私域运营裂变群",
    type: "group",
    forceWechatBrowser: true,
    isActive: true,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    items: [
      {
        id: "sg_item1",
        name: "裂变体验1群 (满10人换)",
        qrcodeUrl: getMockQRCodeUrl("2026夏日裂变", "体验1群", "#07C160"),
        maxScans: 10,
        currentScans: 8,
        weight: 1,
        isActive: true,
      },
      {
        id: "sg_item2",
        name: "裂变备用2群 (满10人换)",
        qrcodeUrl: getMockQRCodeUrl("2026夏日裂变", "备用2群", "#3182CE"),
        maxScans: 10,
        currentScans: 0,
        weight: 1,
        isActive: true,
      },
      {
        id: "sg_item3",
        name: "裂变终极3群 (长期开放)",
        qrcodeUrl: getMockQRCodeUrl("2026夏日裂变", "玩家大本营", "#D69E2E"),
        maxScans: 100,
        currentScans: 0,
        weight: 1,
        isActive: true,
      }
    ],
    timeRules: [],
    regionRules: []
  },
  {
    id: "vip_support",
    title: "高端VIP客服多坐席智能轮询",
    type: "service",
    forceWechatBrowser: false,
    isActive: true,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: "vs_item1",
        name: "专属顾问-林经理 (权重5)",
        qrcodeUrl: getMockQRCodeUrl("VIP客服小林", "华南区核心负责", "#07C160"),
        maxScans: 9999,
        currentScans: 43,
        weight: 5,
        isActive: true,
      },
      {
        id: "vs_item2",
        name: "高级助理-陈老师 (权重3)",
        qrcodeUrl: getMockQRCodeUrl("VIP客服小陈", "华北区业务助理", "#805AD5"),
        maxScans: 9999,
        currentScans: 25,
        weight: 3,
        isActive: true,
      },
      {
        id: "vs_item3",
        name: "华东顾问-安娜 (权重2 - 支持深夜分流)",
        qrcodeUrl: getMockQRCodeUrl("VIP客服安娜", "全能型夜班顾问", "#DD6B20"),
        maxScans: 9999,
        currentScans: 14,
        weight: 2,
        isActive: true,
      }
    ],
    timeRules: [
      { id: "tr1", startTime: "00:00", endTime: "08:00", redirectTarget: "vs_item3" }
    ],
    regionRules: [
      { id: "rr1", province: "Guangdong", redirectTarget: "vs_item1" },
      { id: "rr2", province: "Beijing", redirectTarget: "vs_item2" }
    ]
  }
];

const DEFAULT_LOGS: ScanLog[] = [
  {
    id: "log1",
    configId: "summer_group",
    configTitle: "2026夏日私域运营裂变群",
    targetQrName: "裂变体验1群 (满10人换)",
    targetQrUrl: "",
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    isWechat: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302c) NetType/WIFI Language/zh_CN",
    ip: "113.108.19.24",
    location: "Guangdong (广州)",
    referer: "https://mp.weixin.qq.com/",
    step: "landing",
    domainUsed: "landing-page-a19.tencent-safe.com"
  },
  {
    id: "log2",
    configId: "summer_group",
    configTitle: "2026夏日私域运营裂变群",
    targetQrName: "裂变体验1群 (满10人换)",
    targetQrUrl: "",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    isWechat: true,
    ua: "Mozilla/5.0 (Linux; Android 14; NE2210 Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 MMWEBID/5713 MicroMessenger/8.0.47.2560(0x28002F3A) NetType/WIFI",
    ip: "101.4.136.22",
    location: "Beijing (北京)",
    referer: "https://mp.weixin.qq.com/s/article123",
    step: "landing",
    domainUsed: "landing-page-a19.tencent-safe.com"
  },
  {
    id: "log3",
    configId: "vip_support",
    configTitle: "高端VIP客服多坐席智能轮询",
    targetQrName: "高级助理-陈老师 (权重3)",
    targetQrUrl: "",
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    isWechat: false,
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    ip: "202.104.136.22",
    location: "Shanghai (上海)",
    referer: "https://google.com",
    step: "landing",
    domainUsed: "landing-page-b72.tencent-safe.com"
  },
  {
    id: "log4",
    configId: "vip_support",
    configTitle: "高端VIP客服多坐席智能轮询",
    targetQrName: "专属顾问-林经理 (权重5)",
    targetQrUrl: "",
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    isWechat: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48",
    ip: "14.18.2.19",
    location: "Guangdong (深圳)",
    referer: "https://mp.weixin.qq.com/s/ad",
    step: "landing",
    domainUsed: "landing-page-c08.tencent-safe.com"
  }
];

const DEFAULT_STATS: SystemStats = {
  totalScans: 82,
  wechatScans: 68,
  nonWechatScans: 14,
  failoversCount: 3
};

// Quick Sync Persistent File Helper
function readDb(): DatabaseType {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Database read error. Falling back to default seeds:", e);
  }

  const defaultDb: DatabaseType = {
    configs: DEFAULT_CONFIGS,
    domains: DEFAULT_DOMAINS,
    logs: DEFAULT_LOGS,
    stats: DEFAULT_STATS
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
  return defaultDb;
}

let isWriting = false;
let pendingWriteData: DatabaseType | null = null;

function writeDb(db: DatabaseType) {
  pendingWriteData = db;
  triggerWrite();
}

function triggerWrite() {
  if (isWriting || !pendingWriteData) return;
  isWriting = true;
  const dataToWrite = pendingWriteData;
  pendingWriteData = null;

  fs.writeFile(DB_FILE, JSON.stringify(dataToWrite, null, 2), "utf-8", (err) => {
    isWriting = false;
    if (err) {
      console.error("Database async write error:", err);
    }
    if (pendingWriteData) {
      triggerWrite();
    }
  });
}

// SIMULATE REDIS IN-MEMORY KEY-VALUE STORE FOR EXTREME HIGH-CONCURRENCY CACHING
class RedisSimulator {
  private cache: Record<string, string> = {};
  private counters: Record<string, number> = {};
  private hashes: Record<string, Record<string, string>> = {}; // Redis Hashes (HSET/HGET)
  private sets: Record<string, Set<string>> = {}; // Redis Sets (SADD/SISMEMBER)
  private auditLogs: string[] = []; // Redis Command transaction logs for glassmorphic portal visual audit representation

  constructor() {
    this.refreshCache();
  }

  public logCommand(cmd: string) {
    const timestamp = new Date().toISOString().substring(11, 19);
    this.auditLogs.unshift(`[${timestamp}] ${cmd}`);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
    console.log(`[REDIS COMMAND] ${cmd}`);
  }

  public getRedisLogs() {
    return this.auditLogs;
  }

  // Redis HSET and HGET Implementation
  public hset(hashKey: string, field: string, value: string) {
    if (!this.hashes[hashKey]) {
      this.hashes[hashKey] = {};
    }
    this.hashes[hashKey][field] = value;
    this.logCommand(`HSET ${hashKey} ${field} "${value.substring(0, 45)}..."`);
  }

  public hget(hashKey: string, field: string): string | null {
    const val = this.hashes[hashKey]?.[field] || null;
    this.logCommand(`HGET ${hashKey} ${field} -> ${val ? 'HIT' : 'MISS'}`);
    return val;
  }

  public hgetall(hashKey: string): Record<string, string> {
    this.logCommand(`HGETALL ${hashKey}`);
    return this.hashes[hashKey] || {};
  }

  public hdel(hashKey: string, field: string) {
    if (this.hashes[hashKey]) {
      delete this.hashes[hashKey][field];
      this.logCommand(`HDEL ${hashKey} ${field}`);
    }
  }

  // Redis SADD & SISMEMBER for IP Blacklist
  public sadd(setKey: string, value: string) {
    if (!this.sets[setKey]) {
      this.sets[setKey] = new Set();
    }
    this.sets[setKey].add(value);
    this.logCommand(`SADD ${setKey} ${value} (IP Blacklisted - Autoclear in 60s)`);

    // Self-healing: auto-lift IP block after 60 seconds to restore connectivity gracefully
    setTimeout(() => {
      if (this.sets[setKey]?.has(value)) {
        this.srem(setKey, value);
        this.logCommand(`AUTO EXPIRE ${setKey} member ${value} (Unbanned)`);
      }
    }, 60000);
  }

  public sismember(setKey: string, value: string): boolean {
    const exists = this.sets[setKey]?.has(value) || false;
    this.logCommand(`SISMEMBER ${setKey} ${value} -> ${exists ? '1 (BLOCKED)' : '0 (ALLOWED)'}`);
    return exists;
  }

  public srem(setKey: string, value: string) {
    if (this.sets[setKey]) {
      this.sets[setKey].delete(value);
      this.logCommand(`SREM ${setKey} ${value}`);
    }
  }

  public smembers(setKey: string): string[] {
    this.logCommand(`SMEMBERS ${setKey}`);
    return Array.from(this.sets[setKey] || []);
  }

  // Load all QR routing configs from DB into "Redis Hash Map" on startup
  public refreshCache() {
    const db = readDb();
    this.hashes = {};
    this.cache = {};
    
    // Loaded upon initialization
    db.configs.forEach((cfg) => {
      this.hset("configs_hash", cfg.id, JSON.stringify(cfg));
      cfg.items.forEach((item) => {
        this.counters[`scans:${cfg.id}:${item.id}`] = item.currentScans;
      });
    });

    db.domains.forEach(d => {
      this.hset("domains_hash", d.id, JSON.stringify(d));
    });

    // Active Healthy Domain cache nodes
    this.cache["domains:transit"] = JSON.stringify(db.domains.filter(d => d.type === "transit" && d.status === "healthy"));
    this.cache["domains:landing"] = JSON.stringify(db.domains.filter(d => d.type === "landing" && d.status === "healthy"));
    
    this.logCommand(`REDIS_INIT_OK: Successfully loaded ${db.configs.length} campaigns directly into Redis Hash "configs_hash"`);
  }

  public get(key: string): string | null {
    return this.cache[key] || null;
  }

  public set(key: string, value: string) {
    this.cache[key] = value;
  }

  public getCounter(key: string): number {
    return this.counters[key] || 0;
  }

  public incr(key: string): number {
    if (!(key in this.counters)) {
      this.counters[key] = 0;
    }
    this.counters[key] += 1;
    this.logCommand(`INCR ${key} -> ${this.counters[key]}`);
    return this.counters[key];
  }

  public resetCounter(key: string, val: number) {
    this.counters[key] = val;
    this.logCommand(`SET ${key} ${val}`);
  }
}

const redis = new RedisSimulator();

// ====================================================================
// HIGH PERFORMANCE STATS WRITER QUEUE & DETAILED MAPPING TELEMETRY HELPERS
// ====================================================================

// In-Memory Rate Limiting Tracker: Client IP -> Unix Epoch Milliseconds
const lastScanTimes: Record<string, number> = {};

class AnalyticsQueue {
  private queue: Array<{ type: 'log' | 'stay'; data: any }> = [];
  private processing = false;

  constructor() {
    // Poll queue to sync asynchronously on server without blocking user route times
    setInterval(() => this.processQueue(), 250);
  }

  public enqueue(task: { type: 'log' | 'stay'; data: any }) {
    this.queue.push(task);
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    try {
      const batchSize = Math.min(this.queue.length, 20);
      const tasks = [];
      for (let i = 0; i < batchSize; i++) {
        const item = this.queue.shift();
        if (item) tasks.push(item);
      }

      if (tasks.length > 0) {
        const db = readDb();
        for (const task of tasks) {
          if (task.type === 'log') {
            db.logs.unshift(task.data);
          } else if (task.type === 'stay') {
            const { logId, duration } = task.data;
            const targetLog = db.logs.find(l => l.id === logId);
            if (targetLog) {
              targetLog.stayDuration = duration;
            }
          }
        }
        if (db.logs.length > 500) {
          db.logs = db.logs.slice(0, 500);
        }
        writeDb(db);
      }
    } catch (err) {
      console.error("[ANALYTICS QUEUE] Error persisting analytics batch:", err);
    } finally {
      this.processing = false;
    }
  }
}

const analyticsQueue = new AnalyticsQueue();

function getGeolocation(ip: string): string {
  if (!ip) return "广东 深圳";
  if (ip.startsWith("14.18.") || ip.startsWith("113.108.")) return "广东 深圳";
  if (ip.startsWith("101.4.") || ip.startsWith("111.206.")) return "北京 朝阳";
  if (ip.startsWith("202.104.") || ip.startsWith("101.226.")) return "上海 浦东";
  if (ip.startsWith("122.224.")) return "浙江 杭州";
  if (ip.startsWith("125.69.")) return "四川 成都";
  const locations = ["广东 广州", "广东 深圳", "上海 黄浦", "北京 海淀", "浙江 杭州", "江苏 南京", "四川 成都", "湖北 武汉"];
  const charSum = ip.split('.').reduce((acc, part) => {
    const val = parseInt(part, 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
  return locations[charSum % locations.length];
}

function getNetworkType(ua: string): string {
  const uaUpper = ua.toUpperCase();
  if (uaUpper.includes("NETTYPE/WIFI")) return "WiFi";
  if (uaUpper.includes("NETTYPE/5G")) return "5G";
  if (uaUpper.includes("NETTYPE/4G")) return "4G";
  if (uaUpper.includes("NETTYPE/3G") || uaUpper.includes("NETTYPE/2G")) return "3G/2G";
  if (uaUpper.includes("MOBILE") || uaUpper.includes("IPHONE") || uaUpper.includes("ANDROID")) return "5G Mobile";
  return "Broadband WiFi";
}

function getDeviceModel(ua: string): string {
  const uaLower = ua.toLowerCase();
  if (uaLower.includes("iphone os 17") || uaLower.includes("iphone16") || uaLower.includes("iphone 16")) return "iPhone 16 Pro Max";
  if (uaLower.includes("iphone os 16") || uaLower.includes("iphone15") || uaLower.includes("iphone 15")) return "iPhone 15";
  if (uaLower.includes("iphone os 15") || uaLower.includes("iphone14")) return "iPhone 14";
  if (uaLower.includes("iphone")) return "Apple iPhone Mobile";
  if (uaLower.includes("huawei") || uaLower.includes("mate60") || uaLower.includes("mate 60")) return "HUAWEI Mate 60 Pro";
  if (uaLower.includes("xiaomi") || uaLower.includes("mi 14") || uaLower.includes("build/ukq")) return "Xiaomi 14 Ultra";
  if (uaLower.includes("samsung") || uaLower.includes("galaxy")) return "Samsung Galaxy S24 Ultra";
  if (uaLower.includes("android")) return "Generic Android Phone";
  if (uaLower.includes("macintosh") || uaLower.includes("mac os x")) return "Apple MacBook Desktop";
  if (uaLower.includes("windows nt")) return "Windows 11 Workstation";
  if (uaLower.includes("baidu") || uaLower.includes("spider") || uaLower.includes("bot")) return "Crawler Spider Engine";
  return "Other Client Device";
}

// JWT CRYPTO HANDLERS (No jsonwebtoken package required!)
function generateJWT(payload: any, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const h = Buffer.from(JSON.stringify(header)).toString("base64url");
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${signature}`;
}

function verifyJWT(token: string, secret: string) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const computedSignature = crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
    if (s !== computedSignature) return null;
    return JSON.parse(Buffer.from(p, "base64url").toString("utf-8"));
  } catch (e) {
    return null;
  }
}

// Auth Middleware
function authAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(418).json({ error: "Unauthorized access: Please authenticate." });
  }
  const token = authHeader.substring(7);
  const payload = verifyJWT(token, SECRET_KEY);
  if (!payload) {
    return res.status(401).json({ error: "Session expired or invalid token." });
  }
  (req as any).adminUser = payload;
  next();
}

// --- UTILITY TO DISPATCH TO PREFERENTIAL REGIONAL/TIME ROTATIONS ---
function selectQRTarget(config: DynamicQRConfig, reqData: { ip: string, referer: string, province?: string, timeHour?: number }) {
  const activeItems = config.items.filter(it => it.isActive);
  if (activeItems.length === 0) return null;

  // 1. Time splits check
  const currentHour = reqData.timeHour !== undefined ? reqData.timeHour : new Date().getUTCHours() + 8; // default to GMT+8 (Beijing Time)
  const normalizedHour = currentHour % 24;
  
  for (const rule of config.timeRules) {
    const [startH] = rule.startTime.split(":").map(Number);
    const [endH] = rule.endTime.split(":").map(Number);
    if (startH <= endH) {
      if (normalizedHour >= startH && normalizedHour <= endH) {
        const found = activeItems.find(it => it.id === rule.redirectTarget);
        if (found) return found;
      }
    } else {
      // Over midnight rule (e.g. 22:00 to 06:00)
      if (normalizedHour >= startH || normalizedHour <= endH) {
        const found = activeItems.find(it => it.id === rule.redirectTarget);
        if (found) return found;
      }
    }
  }

  // 2. Region / Province splitting check
  if (reqData.province) {
    const provinceClean = reqData.province.toLowerCase();
    for (const rule of config.regionRules) {
      if (rule.province.toLowerCase() === provinceClean) {
        const found = activeItems.find(it => it.id === rule.redirectTarget);
        if (found) return found;
      }
    }
  }

  // 3. Routing Algorithms based on config.type
  if (config.type === "group") {
    // WeChat Group QR: Threshold routing
    // Walk through items and retrieve their corresponding count from Redis.
    // The first item that has not yet reached maxScans is served.
    for (const item of activeItems) {
      const scansInRedis = redis.getCounter(`scans:${config.id}:${item.id}`);
      if (scansInRedis < item.maxScans) {
        return item;
      }
    }
    // Safeguard: if all full, return the last one
    return activeItems[activeItems.length - 1];
  } else {
    // Type 'service': Weighted client rotation
    // Calculate sum of weights
    const totalWeight = activeItems.reduce((acc, curr) => acc + curr.weight, 0);
    if (totalWeight <= 0) return activeItems[0];

    // Pick a pseudo random index
    let randomSample = Math.random() * totalWeight;
    for (const item of activeItems) {
      randomSample -= item.weight;
      if (randomSample <= 0) {
        return item;
      }
    }
    return activeItems[0];
  }
}

// ==========================================
// BUSINESS TELEMETRY ROUTER & REAL LIVE WEB ENGINE
// ==========================================

// Simulator API Router -- returns complete hops details for UI representation
app.post("/api/simulate/scan", (req, res) => {
  const { configId, customUa, customIp, customProvince, customHour } = req.body;
  const db = readDb();
  
  const config = db.configs.find(c => c.id === configId);
  if (!config) {
    return res.status(404).json({ error: "Dynamic link configuration matching this ID went missing" });
  }

  if (!config.isActive) {
    return res.status(400).json({ error: "This live code configuration is currently disabled!" });
  }

  const ip = customIp || "14.18.2.19";
  const ua = customUa || "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1) MicroMessenger/8.0.48";
  const isWechat = ua.toLowerCase().includes("micromessenger");

  // 1. FREQUENCY RATE LIMITING: Check if IP is blacklisted in Redis pool, or scanned within 5 seconds
  if (redis.sismember("blacklist:ips", ip)) {
    return res.status(429).json({
      success: false,
      rateLimited: true,
      error: "⚠️ [IP BLOCKED] Your IP address has been banned by Redis Sentinel due to scan frequency exceeding limits (5s limit).",
      hops: [{
        step: "security_shield",
        domain: "firewall.sec.wechat.cn",
        action: "Redis SISMEMBER Blacklist Audit check.",
        status: "blocked",
        message: `🚫 IP ${ip} resides in Redis Blacklist. Request dropped instantly at edge gateway.`
      }]
    });
  }

  const now = Date.now();
  if (lastScanTimes[ip] && (now - lastScanTimes[ip] < 5000)) {
    // Add to Redis blacklist set (Automatic Ban!)
    redis.sadd("blacklist:ips", ip);
    return res.status(429).json({
      success: false,
      rateLimited: true,
      error: "⚠️ [SPAM ALERT] Scan velocity too high from same IP address! Automatically added to Redis Blacklist.",
      hops: [{
        step: "security_shield",
        domain: "firewall.sec.wechat.cn",
        action: "Rate limits triggered (Scan twice inside 5 seconds).",
        status: "blocked",
        message: `🚨 IP ${ip} detected spamming. SADD blacklist:ips ${ip} executed. Blocking subsequent entries.`
      }]
    });
  }
  // Record latest successful trace time
  lastScanTimes[ip] = now;

  // Garbage Collection for in-memory tracker to prevent memory growth leaks (keep memory heap efficient)
  if (Math.random() < 0.1) {
    for (const key in lastScanTimes) {
      if (now - lastScanTimes[key] > 15000) {
        delete lastScanTimes[key];
      }
    }
  }

  // Telemetry chain logs
  const hopsLog: any[] = [];

  // Step 1: Entrance Check
  const entranceDomains = db.domains.filter(d => d.type === "entrance" && d.status === "healthy");
  const selectedEntrance = entranceDomains.length > 0 ? entranceDomains[0].domain : "entrance-default.com";
  
  hopsLog.push({
    step: "entrance",
    domain: selectedEntrance,
    action: "Scan QR of dynamic entrance url, checking browser compatibility (User-Agent Filter).",
    status: isWechat || !config.forceWechatBrowser ? "ok" : "blocked",
    message: isWechat 
      ? "User Agent contains 'MicroMessenger': Authorised WeChat browser access." 
      : config.forceWechatBrowser 
        ? "Access Refused: Non-WeChat browser environment flagged. Malicious scanners or search crawlers filtered." 
        : "Unrestricted navigation allowed. Bypassing WeChat user-agent lock rule."
  });

  if (config.forceWechatBrowser && !isWechat) {
    db.stats.totalScans += 1;
    db.stats.nonWechatScans += 1;
    
    const logItem = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random()*1000),
      configId: config.id,
      configTitle: config.title,
      targetQrName: "Blocked (Non-WeChat UA)",
      targetQrUrl: "",
      timestamp: new Date().toISOString(),
      ua,
      isWechat: false,
      ip,
      location: getGeolocation(ip),
      device: getDeviceModel(ua),
      network: getNetworkType(ua),
      referer: "https://qr.weixin.qq.com/",
      step: "entrance",
      domainUsed: selectedEntrance,
      isAttackBlocked: true
    };
    
    // Put into High-Performance Queue instead of blocking
    analyticsQueue.enqueue({ type: 'log', data: logItem });
    writeDb(db); // Update stats instantly
    return res.json({ success: false, wechatBlocked: true, hops: hopsLog });
  }

  // Step 2: Transit Hop
  let transitDomains = db.domains.filter(d => d.type === "transit" && d.status === "healthy");
  if (transitDomains.length === 0) {
    transitDomains = [ { id: "t_def", domain: "transit-default-cdn.net", type: "transit", status: "healthy", failCount: 0 } ];
  }
  const selectedTransit = transitDomains[Math.floor(Math.random() * transitDomains.length)].domain;

  hopsLog.push({
    step: "transit",
    domain: selectedTransit,
    action: "Entrance Domain redirects to High-Availability Transit CDN Domain to encrypt direct link headers.",
    status: "ok",
    message: `Decoupled routing destination URL generated successfully on transit network proxy node.`
  });

  // Step 3: Landing Failover Check
  let landingDomains = db.domains.filter(d => d.type === "landing" && d.status === "healthy");
  let finalLandingDomain = "landing-fallback.wechat-secure.com";
  let failoverHappened = false;

  const rawLandingDomains = db.domains.filter(d => d.type === "landing");
  const primaryLanding = rawLandingDomains.length > 0 ? rawLandingDomains[0] : null;
  
  if (primaryLanding && primaryLanding.status === "abnormal") {
    failoverHappened = true;
    db.stats.failoversCount += 1;
    
    // Auto-failover matching Domain Pool list
    const healthyBackup = db.domains.find(d => d.type === "landing" && d.status === "healthy");
    if (healthyBackup) {
      finalLandingDomain = healthyBackup.domain;
      hopsLog.push({
        step: "landing",
        domain: primaryLanding.domain,
        action: "Anti-Ban Domain Firewall: Dynamic health diagnostics failed. Outage detected!",
        status: "failover",
        message: `⚠️ Domain ${primaryLanding.domain} detected as BLOCKED or abnormal! Triggered auto-failover, re-routing visitor to backing pool: ${healthyBackup.domain}.`
      });
    } else {
      finalLandingDomain = "landing-disaster-backup.tencent-safe.com";
      hopsLog.push({
        step: "landing",
        domain: primaryLanding.domain,
        action: "Anti-Ban Domain Firewall: Disaster Recovery mode.",
        status: "recovery",
        message: `⚠️ No healthy landing domains left! Redirecting to Disaster Fallback Page.`
      });
    }
  } else {
    if (landingDomains.length > 0) {
      finalLandingDomain = landingDomains[Math.floor(Math.random() * landingDomains.length)].domain;
    }
    hopsLog.push({
      step: "landing",
      domain: finalLandingDomain,
      action: "Landing Domain Health Verification verified [HEALTHY]. Establishing rendering payload.",
      status: "ok",
      message: `Seamless routing confirmed on landing-nodes.`
    });
  }

  // Step 4: Routing Dispatch & State counters increments
  const province = customProvince || "Guangdong";
  const hour = customHour !== undefined ? Number(customHour) : new Date().getUTCHours() + 8;
  const dispatchResponse = selectQRTarget(config, {
    ip: customIp || "14.18.2.19",
    referer: "https://mp.weixin.qq.com/s/ad",
    province,
    timeHour: hour
  });

  if (!dispatchResponse) {
    return res.status(500).json({ error: "No sub QR Codes are active for this configuration!" });
  }

  // Increment counter in Redis simulator
  const activeItemId = dispatchResponse.id;
  const newScanCount = redis.incr(`scans:${config.id}:${activeItemId}`);

  // Sync back to db persistence logic
  const liveConfigIdx = db.configs.findIndex(c => c.id === configId);
  let thresholdTriggered = false;
  let switchedToNextName = "";

  if (liveConfigIdx > -1) {
    const liveItem = db.configs[liveConfigIdx].items.find(i => i.id === activeItemId);
    if (liveItem) {
      liveItem.currentScans = newScanCount;
      // If group code threshold reached, we report scan switching event
      if (config.type === "group" && newScanCount >= liveItem.maxScans) {
        thresholdTriggered = true;
        // See if there is a next sibling item
        const activeGroupItems = db.configs[liveConfigIdx].items.filter(i => i.isActive);
        const currentItemIdx = activeGroupItems.findIndex(i => i.id === activeItemId);
        if (currentItemIdx > -1 && currentItemIdx + 1 < activeGroupItems.length) {
          switchedToNextName = activeGroupItems[currentItemIdx + 1].name;
        } else {
          switchedToNextName = "No more alternate sub groups left! Repeating last fallback.";
        }
      }
    }
  }

  // Log Scanned Metric
  const logItem: any = {
    id: "log_" + Date.now() + "_" + Math.floor(Math.random()*1000),
    configId: config.id,
    configTitle: config.title,
    targetQrName: dispatchResponse.name,
    targetQrUrl: dispatchResponse.qrcodeUrl,
    timestamp: new Date().toISOString(),
    ua,
    isWechat,
    ip,
    location: getGeolocation(ip),
    device: getDeviceModel(ua),
    network: getNetworkType(ua),
    referer: "https://mp.weixin.qq.com/s/promotions",
    step: "landing",
    domainUsed: finalLandingDomain,
    stayDuration: 0,
    isAttackBlocked: false
  };

  // Enqueue log event in High-Performance queue instead of blocking client
  analyticsQueue.enqueue({ type: 'log', data: logItem });

  db.stats.totalScans += 1;
  if (isWechat) {
    db.stats.wechatScans += 1;
  } else {
    db.stats.nonWechatScans += 1;
  }

  writeDb(db);
  // Refresh Redis simulator configuration state cache
  redis.refreshCache();

  hopsLog.push({
    step: "display",
    targetQrName: dispatchResponse.name,
    targetQrUrl: dispatchResponse.qrcodeUrl,
    action: `Switching/Routing Logic Executed. Current Scans limit monitored. Type: [${config.type}]`,
    status: "ok",
    message: thresholdTriggered 
      ? `📈 Threshold Reached (${newScanCount}/${dispatchResponse.maxScans})! Dynamic switch triggered. Next scans of '${config.title}' will route to: '${switchedToNextName}'!` 
      : config.type === "group" 
        ? `Scan registered successfully in cache. Sub group limits: ${newScanCount}/${dispatchResponse.maxScans} scans.`
        : `Rotated customer support seats evenly. Node selected: '${dispatchResponse.name}' with allocation weight of ${dispatchResponse.weight}.`
  });

  return res.json({
    success: true,
    wechatBlocked: false,
    targetQrName: dispatchResponse.name,
    targetQrUrl: dispatchResponse.qrcodeUrl,
    fgColor: dispatchResponse.fgColor,
    bgColor: dispatchResponse.bgColor,
    logoDataUrl: dispatchResponse.logoDataUrl,
    cornerRadius: dispatchResponse.cornerRadius,
    subType: dispatchResponse.subType || "wechat",
    hops: hopsLog,
    stats: db.stats
  });
});

// ==========================================
// REAL WEB BROWSING REDIRECT ROUTERS
// ==========================================

// 1. Entrance Endpoint: /r/:id
app.get("/r/:id", (req, res) => {
  const configId = req.params.id;
  const db = readDb();
  
  const config = db.configs.find(c => c.id === configId);
  if (!config || !config.isActive) {
    return res.status(404).send("<h2 style='text-align:center;font-family:sans-serif;margin-top:200px;'>Error: Live Code deactivated.</h2>");
  }

  const ip = req.ip || "127.0.0.1";

  // Redis SISMEMBER Blacklist Block
  if (redis.sismember("blacklist:ips", ip)) {
    return res.status(429).send(`
      <div style='max-width:400px;margin:150px auto;text-align:center;font-family:sans-serif;padding:30px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);'>
        <h2 style='color:#dc2626;'>🚫 安全系统警告 [IP BANNED]</h2>
        <p style='color:#4b5563;line-height:1.6;'>您当前的 IP 地址 (${ip}) 扫码频率异常，已被系统防火墙列入 Redis 黑名单拦截。</p>
        <p style='font-size:12px;color:#9ca3af;'>请在 [5秒安全防攻击限制] 过后联系管理员申诉自愈。</p>
      </div>
    `);
  }

  const now = Date.now();
  if (lastScanTimes[ip] && (now - lastScanTimes[ip] < 5000)) {
    redis.sadd("blacklist:ips", ip);
    return res.status(429).send(`
      <div style='max-width:400px;margin:150px auto;text-align:center;font-family:sans-serif;padding:30px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);'>
        <h2 style='color:#eab308;'>🚨 触发高频扫码拦截机制</h2>
        <p style='color:#4b5563;line-height:1.6;'>系统监测到您的 IP 在 5 秒内进行了高频并发扫码，涉嫌恶意抓取接口。</p>
        <p style='font-size:12px;color:#9ca3af;'>为了保障系统带宽及正常客户体验，IP ${ip} 清退并自动拉黑。</p>
      </div>
    `);
  }
  lastScanTimes[ip] = now;

  // Garbage Collection for trackers to save memory from growing indefinitely
  if (Math.random() < 0.1) {
    for (const key in lastScanTimes) {
      if (now - lastScanTimes[key] > 15000) {
        delete lastScanTimes[key];
      }
    }
  }

  const userAgent = req.headers["user-agent"] || "";
  const isWechat = userAgent.toLowerCase().includes("micromessenger");

  if (config.forceWechatBrowser && !isWechat) {
    db.stats.totalScans += 1;
    db.stats.nonWechatScans += 1;

    const logItem = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random()*100),
      configId: config.id,
      configTitle: config.title,
      targetQrName: "Blocked (Real browser non-WeChat scan)",
      targetQrUrl: "",
      timestamp: new Date().toISOString(),
      ua: userAgent,
      isWechat: false,
      ip,
      location: getGeolocation(ip),
      device: getDeviceModel(userAgent),
      network: getNetworkType(userAgent),
      referer: req.headers["referer"] || "Direct Scan",
      step: "entrance",
      domainUsed: "entrance-domain-real",
      isAttackBlocked: true
    };

    analyticsQueue.enqueue({ type: 'log', data: logItem });
    writeDb(db);

    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>请在微信中打开</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; color: #1a202c; }
          .card { background: white; border-radius: 16px; padding: 40px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); width: 90%; max-width: 380px; }
          .icon { width: 80px; height: 80px; margin: 0 auto 24px; color: #07C160; }
          h2 { font-size: 20px; line-height: 1.4; margin-bottom: 12px; }
          p { font-size: 14px; color: #718096; line-height: 1.6; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: #07C160; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">
            <svg fill="currentColor" viewBox="0 0 24 24" width="80" height="80"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <h2>⚠️ 仅限微信浏览器内扫码安全访问</h2>
          <p>为了保障公众号/群聊安全及防止恶意网络抓取，本动态活码页面只允许在微信内置客户端中打开。</p>
          <a href="https://weixin.qq.com" class="btn">安装微信客户端</a>
        </div>
      </body>
      </html>
    `);
  }

  const transitDomains = db.domains.filter(d => d.type === "transit" && d.status === "healthy");
  const fallbackTransit = transitDomains.length > 0 ? transitDomains[Math.floor(Math.random() * transitDomains.length)].domain : req.get("host");

  const transitTarget = `/transit/${configId}?originalHost=${fallbackTransit}&uaWechat=${isWechat}`;
  return res.redirect(302, transitTarget);
});

// 2. Transit Endpoint: /transit/:id
app.get("/transit/:id", (req, res) => {
  const configId = req.params.id;
  const isWechat = req.query.uaWechat === "true";
  const originalHost = req.query.originalHost || req.get("host");

  // Redirect to final Landing step
  const landingTarget = `/landing/${configId}?uaWechat=${isWechat}&originalHost=${originalHost}`;
  return res.redirect(302, landingTarget);
});

// 3. Landing Page Endpoint: /landing/:id
app.get("/landing/:id", (req, res) => {
  const configId = req.params.id;
  const db = readDb();
  
  const config = db.configs.find(c => c.id === configId);
  if (!config || !config.isActive) {
    return res.status(404).send("<h2 style='text-align:center;'>Error: Config not found.</h2>");
  }

  const ip = req.ip || "127.0.0.1";

  // Redis SISMEMBER Blacklist Block inside landing page
  if (redis.sismember("blacklist:ips", ip)) {
    return res.status(429).send("<div style='text-align:center;margin-top:150px;font-family:sans-serif;'><h2>🚫 IP Blocked by Security Center</h2><p>You cannot bypass active rate limits.</p></div>");
  }

  // Validate health failover simulations
  const rawLandingDomains = db.domains.filter(d => d.type === "landing");
  const primaryLanding = rawLandingDomains.length > 0 ? rawLandingDomains[0] : null;
  let domainUsed = req.get("host") || "tencent-landing.net";

  if (primaryLanding && primaryLanding.status === "abnormal") {
    db.stats.failoversCount += 1;
    const backupHealthy = db.domains.find(d => d.type === "landing" && d.status === "healthy");
    if (backupHealthy) {
      domainUsed = backupHealthy.domain;
    }
  }

  // Dispatch live targets
  const clientProvince = "Guangdong"; // Hardcoded region fallback for browser location mockup
  const currentHour = new Date().getUTCHours() + 8; // Beijing timezone
  const dispatchedItem = selectQRTarget(config, {
    ip,
    referer: req.headers["referer"] || "Direct Scan",
    province: clientProvince,
    timeHour: currentHour
  });

  if (!dispatchedItem) {
    return res.status(404).send("<h2 style='text-align:center;'>Alternate seat is not active.</h2>");
  }

  // Increment counter in Redis simulator
  const updatedRedisCount = redis.incr(`scans:${config.id}:${dispatchedItem.id}`);
  
  // Save scan to actual database JSON
  const liveConfigIdx = db.configs.findIndex(c => c.id === configId);
  if (liveConfigIdx > -1) {
    const liveItem = db.configs[liveConfigIdx].items.find(i => i.id === dispatchedItem.id);
    if (liveItem) {
      liveItem.currentScans = updatedRedisCount;
    }
  }

  const userAgent = req.headers["user-agent"] || "";
  const isWechat = userAgent.toLowerCase().includes("micromessenger");

  db.stats.totalScans += 1;
  if (isWechat) {
    db.stats.wechatScans += 1;
  } else {
    db.stats.nonWechatScans += 1;
  }

  const logId = "log_" + Date.now() + "_" + Math.floor(Math.random()*1000);
  const logItem = {
    id: logId,
    configId: config.id,
    configTitle: config.title,
    targetQrName: dispatchedItem.name,
    targetQrUrl: dispatchedItem.qrcodeUrl,
    timestamp: new Date().toISOString(),
    ua: userAgent,
    isWechat,
    ip,
    location: getGeolocation(ip),
    device: getDeviceModel(userAgent),
    network: getNetworkType(userAgent),
    referer: req.headers["referer"] || "Native Redirection",
    step: "landing",
    domainUsed,
    stayDuration: 0,
    isAttackBlocked: false
  };

  analyticsQueue.enqueue({ type: 'log', data: logItem });
  writeDb(db);
  redis.refreshCache();

  const targetType = dispatchedItem.subType || "wechat";

  // Redirect instantly if subType is "link" (浏览器链接)
  if (targetType === "link") {
    return res.redirect(302, dispatchedItem.qrcodeUrl);
  }

  let pageTitle = "加群 & 加好友说明";
  let headerText = "微信安全进群/找客服通道";
  let brandColor = "#07C160"; // WeChat green
  let brandBg = "#eafaf1";
  let badgeText = "🛡️ 微信安全防火墙实时护航";
  let instructionsHtml = `
    <div class="instructions-item">1. 长按二维码图片，点击选项 <span class="green" style="color:#07C160">“识别图中的二维码”</span> 即可快捷添加。</div>
    <div class="instructions-item">2. 如遇二维码失效或异常，请在下方自助服务区域联系管理员并提供截图。</div>
    <div class="instructions-item">3. 提示：该入口将不断进行安全分流保护，每次加载域名在腾讯安全池中轮询调配。</div>
  `;
  let techSupportText = "由 十夜自愈分流中继（活码引擎 v3.5 Pro）提供技术支持";

  if (targetType === "qq") {
    brandColor = "#12B7F5"; // QQ Blue
    brandBg = "#e8f7fd";
    headerText = "QQ群聊安全直达通道";
    badgeText = "🛡️ QQ安全合规风控防火墙";
    pageTitle = "QQ群 & 好友扫码说明";
    instructionsHtml = `
      <div class="instructions-item">1. 手机QQ内请长按二维码图片，点击选项 <span class="green" style="color:#12B7F5">“识别图中的二维码”</span> 即可快捷添加。</div>
      <div class="instructions-item">2. 微信或其他应用访问时，请 <span class="green" style="color:#12B7F5">截图保存</span> 二维码至相册，再打开手机QQ扫描该图片。</div>
      <div class="instructions-item">3. 系统会根据该活动分流规则自动路由可用群席位，防止群饱满拦截。</div>
    `;
    techSupportText = "由 十夜QQ自愈分流中继（活码引擎 v3.5 Pro）提供技术支持";
  }

  // Return elegant HTML rendering with Beacon, staying ping and defensive view-source protections
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>${config.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #ededed; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .wrapper { width: 100%; max-width: 414px; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; }
        .header { background-color: ${brandColor}; color: white; width: 100%; text-align: center; padding: 18px 0; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .card { width: 90%; background: white; border-radius: 12px; margin: 20px 0; padding: 24px; box-sizing: border-box; box-shadow: 0 4px 16px rgba(0,0,0,0.06); text-align: center; }
        .badge { display: inline-block; background-color: ${brandBg}; color: ${brandColor}; font-size: 11px; font-weight: bold; padding: 5px 12px; border-radius: 999px; margin-bottom: 14px; border: 1px solid rgba(7, 193, 96, 0.2); }
        .title { font-size: 18px; font-weight: bold; color: #1a202c; margin-bottom: 6px; }
        .subtitle { font-size: 13px; color: #718096; margin-bottom: 20px; }
        .qr-frame { margin: 15px auto; padding: 10px; display: block; border-radius: 8px; max-width: 280px; background-color: #f7fafc; border: 1px solid #edf2f7; }
        .qr-frame img { width: 100%; height: auto; max-width: 250px; display: block; margin: 0 auto; }
        .instructions { text-align: left; background-color: #f7fafc; border-radius: 8px; padding: 16px; margin-top: 15px; border: 1px solid #edf2f7; }
        .instructions-title { font-size: 13px; font-weight: bold; color: #2d3748; margin-bottom: 8px; display: flex; align-items: center; }
        .instructions-title svg { margin-right: 6px; color: ${brandColor}; }
        .instructions-item { font-size: 12px; color: #4a5568; line-height: 1.6; margin-bottom: 4px; }
        .footer { font-size: 11px; color: #a0aec0; margin: 20px 0; text-align: center; width: 90%; }
        .green { color: ${brandColor}; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">${headerText}</div>
        <div class="card">
          <div class="badge">${badgeText}</div>
          <div class="title">${config.title}</div>
          <div class="subtitle">安全通道已经创建成功，请尽快保存长按识别</div>
          <div class="qr-frame">
            <img src="${(dispatchedItem.qrcodeUrl.startsWith('data:') || dispatchedItem.qrcodeUrl.startsWith('/assets/')) ? dispatchedItem.qrcodeUrl : 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(dispatchedItem.qrcodeUrl)}" alt="Security QR Code" />
          </div>
          <div class="instructions">
            <div class="instructions-title">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
              ${pageTitle}
            </div>
            ${instructionsHtml}
          </div>
        </div>
        <div class="footer">
          ${techSupportText}<br/>
          落地安全保护域名：<strong>${domainUsed}</strong>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- 🚀 FE-PROTECTION & PERFORMANCE TELEMETRY BEACON -->
      <!-- ============================================== -->
      <script>
        // 1. BEACON RETAIN TIME ENGINE: Records stay durations dynamically in seconds on unload!
        const startTime = Date.now();
        window.addEventListener("beforeunload", function() {
          const duration = Math.round((Date.now() - startTime) / 1000);
          const payload = JSON.stringify({ logId: "${logId}", duration: duration });
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon("/api/analytics/stay", payload);
          } else {
            fetch("/api/analytics/stay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
              keepalive: true
            });
          }
        });

        // 2. FRONTEND ANTI-DEBUGGING CODES & CONSOLE FREEZES: prevents right-click source viewing
        document.addEventListener("contextmenu", function(e) {
          e.preventDefault();
        });

        document.addEventListener("keydown", function(e) {
          if (
            e.keyCode === 123 || // F12 Key
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || // Ctrl+Shift+I/J/C
            (e.ctrlKey && e.keyCode === 85) // Ctrl+U: view source
          ) {
            e.preventDefault();
            return false;
          }
        });

        // Active Infinite debugger loops that halt competition inspection
        (function() {
          function protectModule() {
            setInterval(function() {
              debugger;
            }, 100);
          }
          try { protectModule(); } catch (e) {}
        })();

        // Continual Console purification
        setInterval(function() {
          console.clear();
          console.log("%c⚠️ 微信安全防火墙检测运行中", "color: #07C160; font-size: 20px; font-weight: bold;");
          console.log("本页面已开启防抓包反调试机制。禁止非微信官方安全质检代码探测。");
        }, 1000);
      </script>
    </body>
    </html>
  `);
});

// Stay retention endpoint
app.post("/api/analytics/stay", (req, res) => {
  const { logId, duration } = req.body;
  if (logId && duration !== undefined) {
    analyticsQueue.enqueue({ type: 'stay', data: { logId, duration: Number(duration) } });
  }
  return res.json({ success: true });
});

// ==========================================
// ADMINISTRATIVE CRUD ENDPOINTS FOR PORTAL
// ==========================================

// 1. Admin Login (JWT generation)
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    const token = generateJWT({ user: "admin", role: "superuser" }, SECRET_KEY);
    return res.json({ success: true, token });
  }
  return res.status(403).json({ error: "Invalid dynamic administrator credentials. Default (admin / admin123)." });
});

// 2. Fetch admin state configurations
app.get("/api/admin/configs", authAdmin, (req, res) => {
  const db = readDb();
  // Ensure Redis counter state synchronizes back to display UI properly
  const configsWithLiveCounters = db.configs.map(cfg => {
    return {
      ...cfg,
      items: cfg.items.map(item => ({
        ...item,
        currentScans: redis.getCounter(`scans:${cfg.id}:${item.id}`)
      }))
    };
  });
  res.json({ configs: configsWithLiveCounters });
});

// Admin Redis logs and blacklist members
app.get("/api/admin/redis-logs", authAdmin, (req, res) => {
  res.json({ logs: redis.getRedisLogs() });
});

app.get("/api/admin/redis-blacklist", authAdmin, (req, res) => {
  res.json({ blacklist: redis.smembers("blacklist:ips") });
});

app.post("/api/admin/redis-clear-blacklist", authAdmin, (req, res) => {
  const blacklisted = redis.smembers("blacklist:ips");
  blacklisted.forEach(ip => {
    redis.srem("blacklist:ips", ip);
  });
  res.json({ success: true, clearedCount: blacklisted.length });
});

// 3. Create config
app.post("/api/admin/configs", authAdmin, (req, res) => {
  const db = readDb();
  const newConfig: DynamicQRConfig = req.body;
  
  if (!newConfig.id || !newConfig.title) {
    return res.status(400).json({ error: "Unique routing key ID and title required." });
  }

  if (db.configs.some(c => c.id === newConfig.id)) {
    return res.status(400).json({ error: "Routing path ID is already in use by another campaign!" });
  }

  // Populate inline placeholder base64 SVG QR urls for any missing
  newConfig.items = (newConfig.items || []).map((item, idx) => {
    const color = idx % 3 === 0 ? "#07C160" : idx % 3 === 1 ? "#3182CE" : "#805AD5";
    return {
      ...item,
      id: item.id || `item_${Date.now()}_${idx}`,
      currentScans: item.currentScans || 0,
      qrcodeUrl: item.qrcodeUrl || getMockQRCodeUrl(newConfig.title, item.name, color)
    };
  });

  newConfig.createdAt = new Date().toISOString();
  db.configs.unshift(newConfig);
  writeDb(db);
  redis.refreshCache();

  return res.json({ success: true, config: newConfig });
});

// 4. Update configuration
app.put("/api/admin/configs/:id", authAdmin, (req, res) => {
  const targetId = req.params.id;
  const db = readDb();
  const configIdx = db.configs.findIndex(c => c.id === targetId);
  
  if (configIdx === -1) {
    return res.status(404).json({ error: "Config database node not found." });
  }

  const updatedConfig: DynamicQRConfig = req.body;
  
  // Keep original create date
  updatedConfig.createdAt = db.configs[configIdx].createdAt;

  // Process items
  updatedConfig.items = (updatedConfig.items || []).map((item, idx) => {
    const color = idx % 3 === 0 ? "#07C160" : idx % 3 === 1 ? "#3182CE" : "#805AD5";
    const qrcodeUrl = item.qrcodeUrl && (item.qrcodeUrl.startsWith("data:") || item.qrcodeUrl.startsWith("http:") || item.qrcodeUrl.startsWith("https:") || item.qrcodeUrl.startsWith("/assets/")) 
      ? item.qrcodeUrl 
      : getMockQRCodeUrl(updatedConfig.title, item.name, color);

    return {
      ...item,
      qrcodeUrl
    };
  });

  db.configs[configIdx] = updatedConfig;
  writeDb(db);

  // Sync back state to Redis cache
  redis.refreshCache();
  updatedConfig.items.forEach(it => {
    redis.resetCounter(`scans:${updatedConfig.id}:${it.id}`, it.currentScans);
  });

  res.json({ success: true, config: updatedConfig });
});

// 5. Delete configuration
app.delete("/api/admin/configs/:id", authAdmin, (req, res) => {
  const targetId = req.params.id;
  const db = readDb();
  const originLength = db.configs.length;
  db.configs = db.configs.filter(c => c.id !== targetId);

  if (db.configs.length === originLength) {
    return res.status(404).json({ error: "Node not found." });
  }

  writeDb(db);
  redis.refreshCache();
  res.json({ success: true });
});

// 6. Fetch domains
app.get("/api/admin/domains", authAdmin, (req, res) => {
  const db = readDb();
  res.json({ domains: db.domains });
});

// 7. Add domain
app.post("/api/admin/domains", authAdmin, (req, res) => {
  const db = readDb();
  const { domain, type } = req.body;
  if (!domain || !type) {
    return res.status(400).json({ error: "Domain address and type configuration are required." });
  }

  const cleanDomain = domain.trim().toLowerCase();
  if (db.domains.some(d => d.domain === cleanDomain && d.type === type)) {
    return res.status(400).json({ error: "This domain has already been added to that pool!" });
  }

  const newDomain: DomainItem = {
    id: `dom_${Date.now()}`,
    domain: cleanDomain,
    type,
    status: "healthy",
    failCount: 0
  };

  db.domains.push(newDomain);
  writeDb(db);
  redis.refreshCache();

  res.json({ success: true, domain: newDomain });
});

// 8. Update domain status (toggle healthy/abnormal)
app.put("/api/admin/domains/:id", authAdmin, (req, res) => {
  const domainId = req.params.id;
  const { status } = req.body;
  const db = readDb();
  const domainNode = db.domains.find(d => d.id === domainId);

  if (!domainNode) {
    return res.status(404).json({ error: "Domain config node not found found." });
  }

  domainNode.status = status;
  if (status === "healthy") {
    domainNode.failCount = 0;
  } else {
    domainNode.failCount += 1;
  }

  writeDb(db);
  redis.refreshCache();
  res.json({ success: true, domain: domainNode });
});

// 9. Delete domain from pool
app.delete("/api/admin/domains/:id", authAdmin, (req, res) => {
  const domainId = req.params.id;
  const db = readDb();
  const originLength = db.domains.length;
  db.domains = db.domains.filter(d => d.id !== domainId);

  if (db.domains.length === originLength) {
    return res.status(404).json({ error: "Domain matching this ID was not in the database pool." });
  }

  writeDb(db);
  redis.refreshCache();
  res.json({ success: true });
});

// 10. Fetch Logs
app.get("/api/admin/logs", authAdmin, (req, res) => {
  const db = readDb();
  res.json({ logs: db.logs });
});

// 11. Clear Logs
app.post("/api/admin/logs/clear", authAdmin, (req, res) => {
  const db = readDb();
  db.logs = [];
  writeDb(db);
  res.json({ success: true });
});

// 12. Stats and aggregated dynamic chart trends
app.get("/api/admin/stats", authAdmin, (req, res) => {
  const db = readDb();
  
  // Aggregate coordinates for hourly trend scan graph (last 7 hours for charts representation)
  const last7Hours: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const time = new Date(Date.now() - i * 3600 * 1000);
    const hourStr = `${String(time.getHours()).padStart(2, "0")}:00`;
    last7Hours.push(hourStr);
  }

  // Create mock robust hourly counters reflecting recent scan activities and adding live logs
  const baseChartData = last7Hours.map((hour, idx) => {
    // Pick standard coefficients distribution
    const coeff = [14, 25, 42, 31, 10, 50, 68];
    const itemLogs = db.logs.filter(log => {
      const logHour = new Date(log.timestamp).getHours();
      const targetHourStr = `${String(logHour).padStart(2, "0")}:00`;
      return targetHourStr === hour;
    });

    return {
      hour,
      "微信扫码": coeff[idx % coeff.length] + itemLogs.filter(l => l.isWechat).length,
      "普通扫码(拦截)": Math.floor(coeff[idx % coeff.length] * 0.15) + itemLogs.filter(l => !l.isWechat).length
    };
  });

  return res.json({
    stats: db.stats,
    chartData: baseChartData
  });
});

// --- VITE DEV AND PROD ROUTING MIDDLEWARE MOUNT ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Live QR Code Full-Stack Server booted at: http://localhost:${PORT}`);
  });
}

startServer();
