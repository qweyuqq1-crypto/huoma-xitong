/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QRCodeType = 'group' | 'service';

export interface QRGroupItem {
  id: string;
  name: string;
  qrcodeUrl: string;
  maxScans: number;       // For 'group' type: limit before switching
  currentScans: number;   // Maintained by the core redirect counter
  weight: number;         // For 'service' type: rotation weight
  isActive: boolean;
  fgColor?: string;       // QR Code foreground color (e.g., "#000000")
  bgColor?: string;       // QR Code background color (e.g., "#ffffff")
  logoDataUrl?: string;   // Embedded center logo base64
  cornerRadius?: number;  // Rounded corners radius value (e.g., 0 to 24)
  subType?: 'wechat' | 'qq' | 'link'; // Target type: WeChat, QQ, or Direct Link
}

export interface TimeSplitRule {
  id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "18:00"
  redirectTarget: string; // "item_id" or absolute URL
}

export interface RegionSplitRule {
  id: string;
  province: string; // e.g. "Guangdong", "Beijing"
  redirectTarget: string;
}

export interface DynamicQRConfig {
  id: string;             // The key in routing path, e.g. "marketing2026"
  title: string;          // Name of the dynamic code
  type: QRCodeType;       // 'group' (threshold-based) or 'service' (weight-based)
  items: QRGroupItem[];   // Sub-QRs (e.g., multiple groups or customer service personal QRs)
  timeRules: TimeSplitRule[];
  regionRules: RegionSplitRule[];
  forceWechatBrowser: boolean; // Filter out non-WeChat browser queries
  isActive: boolean;
  createdAt: string;
}

export type DomainType = 'entrance' | 'transit' | 'landing';

export interface DomainItem {
  id: string;
  domain: string;        // e.g., "transit-1.wechatlive.com"
  type: DomainType;      // 'entrance' | 'transit' | 'landing'
  status: 'healthy' | 'abnormal';
  failCount: number;
}

export interface ScanLog {
  id: string;
  configId: string;
  configTitle: string;
  targetQrName: string;   // The specific QR code served
  targetQrUrl: string;    // Target QR code image Url
  timestamp: string;      // Event logging epoch
  ua: string;             // User Agent string
  isWechat: boolean;      // Opened inside micro-messenger
  ip: string;             // Request IP
  location: string;       // Extracted Location (e.g. Guangdong, Shanghai)
  referer: string;        // Referer header
  step: 'entrance' | 'transit' | 'landing'; // High-availability hop tracker
  domainUsed: string;     // The domain used at this step
  device?: string;        // Client Device Model
  network?: string;       // Network type (WiFi, 5G, 4G, Broadband)
  stayDuration?: number;  // Staying time in seconds on landing page
  isAttackBlocked?: boolean; // Rate limit or browser attack flagged status
}

export interface SystemStats {
  totalScans: number;
  wechatScans: number;
  nonWechatScans: number;
  failoversCount: number;
}
