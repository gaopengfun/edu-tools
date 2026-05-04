export interface ToolMeta {
  name: string;
  title: string;
  description: string;
  path: string;
  icon?: string;
}

export const tools: ToolMeta[] = [
  {
    name: 'dictation',
    title: '单词听写',
    description: '单词听写，根据输入单词，自动播报',
    path: '/dictation',
  },
  // @tool-scaffold:tools
];
