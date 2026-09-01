import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GameBoost · 玩家专属诊断报告',
  description: 'GameBoost 面向玩家的设备与游戏性能诊断报告预览',
};

export default function ReportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
