export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface CheckStep {
  name: string;
  status: StepStatus;
  duration?: number;
  error?: string;
}

export interface OssToken {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  bucket: string;
  endPoint: string;
  region: string;
  path: string;
}
