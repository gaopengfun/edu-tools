#!/usr/bin/env node
// 交互式脚手架：生成一个新的小工具视图，并登记到 tool-list 与 router。

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const rl = createInterface({ input, output });
const lineQueue = [];
const waiters = [];
rl.on('line', (line) => {
  if (waiters.length) waiters.shift()(line);
  else lineQueue.push(line);
});
rl.on('close', () => {
  while (waiters.length) waiters.shift()(null);
});

const readLine = () =>
  new Promise((res) => {
    if (lineQueue.length) res(lineQueue.shift());
    else waiters.push(res);
  });

const ask = async (label, { defaultValue, validate, required = true } = {}) => {
  while (true) {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    output.write(`${label}${suffix}: `);
    const line = await readLine();
    if (line === null) throw new Error('输入提前结束');
    const raw = line.trim();
    const value = raw || defaultValue || '';
    if (!value && required) {
      console.log('  ! 此项必填');
      continue;
    }
    if (validate) {
      const err = validate(value);
      if (err) {
        console.log(`  ! ${err}`);
        continue;
      }
    }
    return value;
  }
};

const askYesNo = async (label, defaultNo = true) => {
  const hint = defaultNo ? 'y/N' : 'Y/n';
  output.write(`${label} (${hint}): `);
  const line = await readLine();
  if (line === null) return !defaultNo;
  const raw = line.trim().toLowerCase();
  if (!raw) return !defaultNo;
  return raw === 'y' || raw === 'yes';
};

const toPascal = (kebab) =>
  kebab
    .split('-')
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('');

const kebabRe = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const exists = async (p) => {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const vueTemplate = (pascal, title) => `<script setup lang="ts">
</script>

<template>
  <div class="${pascal}-page">
    <header class="page-header">
      <h1 class="headline">${title}</h1>
      <p class="subtitle">在这里描述这个工具做什么</p>
    </header>

    <section class="placeholder">
      <p>TODO: 在此实现 ${title}</p>
    </section>
  </div>
</template>

<style scoped>
.${pascal}-page {
  --md-primary: #1a73e8;
  --md-on-surface: #1a1c20;
  --md-on-surface-variant: #44474e;

  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  color: var(--md-on-surface);
}

.page-header {
  margin-bottom: 24px;
}

.headline {
  font-size: 28px;
  font-weight: 400;
  line-height: 36px;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--md-on-surface-variant);
  margin: 0;
}

.placeholder {
  padding: 24px;
  border-radius: 16px;
  border: 1px dashed var(--md-on-surface-variant);
  color: var(--md-on-surface-variant);
}
</style>
`;

const run = async () => {
  console.log('🛠  创建一个新的小工具\n');

  const name = await ask('工具标识 (kebab-case，用作目录名与路由 name)', {
    validate: (v) => (kebabRe.test(v) ? null : '需为 kebab-case，例如 my-tool'),
  });

  const pascal = toPascal(name);
  const viewDir = resolve(root, 'src/views', name);
  if (await exists(viewDir)) {
    console.error(`\n✗ 目录已存在：${viewDir}`);
    rl.close();
    process.exit(1);
  }

  const title = await ask('工具标题 (列表卡片显示)');
  const description = await ask('工具描述 (一句话)');
  const path = await ask('路由路径', {
    defaultValue: `/${name}`,
    validate: (v) => (v.startsWith('/') ? null : '需以 / 开头'),
  });
  const withComposables = await askYesNo('是否生成 composables/ 目录', true);

  // 1. 写视图文件
  await mkdir(viewDir, { recursive: true });
  const vuePath = resolve(viewDir, `${pascal}.vue`);
  await writeFile(vuePath, vueTemplate(pascal, title), 'utf8');

  if (withComposables) {
    const composablesDir = resolve(viewDir, 'composables');
    await mkdir(composablesDir, { recursive: true });
    await writeFile(resolve(composablesDir, '.gitkeep'), '', 'utf8');
  }

  // 2. 注入路由
  const routerFile = resolve(root, 'src/router/index.ts');
  const routerSrc = await readFile(routerFile, 'utf8');
  const routeEntry =
    `    {\n` +
    `      path: '${path}',\n` +
    `      name: '${name}',\n` +
    `      component: () => import('@/views/${name}/${pascal}.vue'),\n` +
    `    },`;
  const routerAnchor = '    // @tool-scaffold:routes';
  if (!routerSrc.includes(routerAnchor)) {
    throw new Error(`未找到路由锚点 "${routerAnchor}"，请先恢复。`);
  }
  const newRouterSrc = routerSrc.replace(routerAnchor, `${routeEntry}\n${routerAnchor}`);
  await writeFile(routerFile, newRouterSrc, 'utf8');

  // 3. 注入 tools.ts
  const toolsFile = resolve(root, 'src/views/tool-list/tools.ts');
  const toolsSrc = await readFile(toolsFile, 'utf8');
  const toolEntry =
    `  {\n` +
    `    name: '${name}',\n` +
    `    title: '${title.replace(/'/g, "\\'")}',\n` +
    `    description: '${description.replace(/'/g, "\\'")}',\n` +
    `    path: '${path}',\n` +
    `  },`;
  const toolsAnchor = '  // @tool-scaffold:tools';
  if (!toolsSrc.includes(toolsAnchor)) {
    throw new Error(`未找到 tools 锚点 "${toolsAnchor}"，请先恢复。`);
  }
  const newToolsSrc = toolsSrc.replace(toolsAnchor, `${toolEntry}\n${toolsAnchor}`);
  await writeFile(toolsFile, newToolsSrc, 'utf8');

  console.log(`\n✓ 已创建 ${name}`);
  console.log(`  - ${vuePath.replace(root + '\\', '').replace(root + '/', '')}`);
  console.log(`  - 路由：${path} (name=${name})`);
  console.log(`  - 已登记到 tool-list 卡片`);
  console.log(`\n运行 pnpm dev 查看效果。`);

  rl.close();
};

run().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
