#!/usr/bin/env node
// 发版脚本：打 tag 并推送到 origin。用法：pnpm release <version>，例如 pnpm release 0.2.0

import { spawnSync } from 'node:child_process';
import { exit, argv } from 'node:process';

const raw = argv[2];
if (!raw) {
  console.error('用法：pnpm release <version>，例如 pnpm release 0.2.0');
  exit(1);
}

const version = raw.replace(/^v/, '');
if (!/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version)) {
  console.error(`版本号格式不合法：${raw}（期望形如 0.2.0 或 0.2.0-beta.1）`);
  exit(1);
}

const tag = `v${version}`;

const run = (cmd, args) => {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) exit(result.status ?? 1);
};

run('git', ['tag', tag]);
run('git', ['push', 'origin', tag]);

console.log(`\n已发布 ${tag}`);
