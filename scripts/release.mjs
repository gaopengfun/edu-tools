#!/usr/bin/env node
// 发版脚本：更新 Android APK 版本号并提交推送，再打 tag 并推送到 origin。
// 用法：pnpm release <version>，例如 pnpm release 1.0.1001

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { exit, argv } from 'node:process';

const raw = argv[2];
if (!raw) {
  console.error('用法：pnpm release <version>，例如 pnpm release 1.0.1001');
  exit(1);
}

const version = raw.replace(/^v/, '');
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
if (!match) {
  console.error(`版本号格式不合法：${raw}（期望形如 1.0.1001）`);
  exit(1);
}

const versionCode = Number(match[3]);
const tag = `v${version}`;
const gradlePath = 'android/app/build.gradle';

const gradle = readFileSync(gradlePath, 'utf8');
const updated = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);

if (updated === gradle) {
  console.error(`未在 ${gradlePath} 中找到可替换的 versionCode/versionName 字段`);
  exit(1);
}

writeFileSync(gradlePath, updated);
console.log(`已更新 ${gradlePath}：versionName="${version}", versionCode=${versionCode}`);

const run = (cmd, args) => {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) exit(result.status ?? 1);
};

run('git', ['add', gradlePath]);
run('git', ['commit', '-m', `chore(release): 发布 ${tag}`]);
run('git', ['push']);
run('git', ['tag', tag]);
run('git', ['push', 'origin', tag]);

console.log(`\n已发布 ${tag}`);
