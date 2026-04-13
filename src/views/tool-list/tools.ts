export interface ToolMeta {
  name: string;
  title: string;
  description: string;
  path: string;
  icon?: string;
}

export const tools: ToolMeta[] = [
  {
    name: 'oss-check',
    title: 'OSS 可用性检测',
    description: '分步检测公网与阿里云 OSS 上传链路的可用性',
    path: '/oss-check',
  },
];
