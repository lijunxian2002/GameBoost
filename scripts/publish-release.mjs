#!/usr/bin/env node
/**
 * GameBoost 发布脚本（本机运行，只给李俊贤用）。
 *
 * 用法：
 *   node scripts/publish-release.mjs \
 *     --file "D:\\path\\GameBoost-0.2.0-windows-x64.exe" \
 *     --channel stable \
 *     --version 0.2.0 \
 *     [--minimum-supported-version 0.1.0] \
 *     [--mandatory] \
 *     [--notes-url https://xiaotongcn.mom/changelog/gameboost/0.2.0] \
 *     [--base-url https://xiaotongcn.mom] \
 *     [--token <发布令牌>]
 *
 * 令牌也可以放在环境变量 RELEASE_TOKEN 里，避免出现在命令行历史。
 * 发布前需要先运行 scripts/release-keygen.mjs 生成签名密钥，并把
 * RELEASE_SIGNING_KEY / RELEASE_TOKEN 配置到控制平面的环境值里。
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const CHANNELS = new Set(['stable', 'beta']);

function isWindowsPe(bytes) {
  if (bytes.length < 0x100 || bytes[0] !== 0x4d || bytes[1] !== 0x5a) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const peOffset = view.getUint32(0x3c, true);
  if (peOffset + 26 > bytes.length) return false;
  const isPe =
    bytes[peOffset] === 0x50 &&
    bytes[peOffset + 1] === 0x45 &&
    bytes[peOffset + 2] === 0 &&
    bytes[peOffset + 3] === 0;
  const machine = view.getUint16(peOffset + 4, true);
  const optionalHeaderMagic = view.getUint16(peOffset + 24, true);
  return isPe && ((machine === 0x8664 && optionalHeaderMagic === 0x20b) || (machine === 0x14c && optionalHeaderMagic === 0x10b));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`无法识别的参数：${key}`);
    const name = key.slice(2);
    if (name === 'mandatory') {
      args.mandatory = '1';
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`参数 --${name} 缺少值`);
    }
    args[name] = value;
    i += 1;
  }
  return args;
}

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const {
  file: filePath,
  channel,
  version,
  'minimum-supported-version': minimumSupportedVersion,
  mandatory: mandatoryArg,
  'notes-url': notesUrl,
  'base-url': baseUrl = 'https://xiaotongcn.mom',
  token: tokenArg,
} = args;
const mandatory = mandatoryArg ?? '0';

if (!filePath) fail('缺少 --file <安装包路径>');
if (!channel) fail('缺少 --channel stable|beta');
if (!CHANNELS.has(channel)) fail(`--channel 只支持 stable 或 beta，收到：${channel}`);
if (!version) fail('缺少 --version <语义版本号>');
if (!VERSION_RE.test(version)) fail(`版本号格式不正确：${version}`);
if (minimumSupportedVersion !== undefined && !VERSION_RE.test(minimumSupportedVersion)) {
  fail(`--minimum-supported-version 格式不正确：${minimumSupportedVersion}`);
}
if (mandatory !== '0' && mandatory !== '1') fail('--mandatory 只支持 0 或 1');

const token = tokenArg ?? process.env.RELEASE_TOKEN;
if (!token) fail('缺少发布令牌：用 --token 或设置环境变量 RELEASE_TOKEN');

const absolutePath = resolve(filePath);
const bytes = readFileSync(absolutePath);
if (bytes.length === 0) fail('安装包是空文件');
if (!isWindowsPe(bytes)) {
  fail('安装包不是有效 Windows PE EXE；拒绝上传。请检查文件路径，不能把压缩包、网页或测试数据当安装包发布。');
}

const sha256 = createHash('sha256').update(bytes).digest('hex');
console.log(`文件：${absolutePath}`);
console.log(`大小：${bytes.length} bytes`);
console.log(`SHA-256：${sha256}`);
console.log(`发布：${channel} / ${version} → ${baseUrl}`);

const headers = {
  'content-type': 'application/octet-stream',
  'x-release-token': token,
  'x-product': 'gameboost',
  'x-channel': channel,
  'x-platform': 'windows-x64',
  'x-version': version,
  'x-mandatory': mandatory,
};
if (minimumSupportedVersion) headers['x-minimum-supported-version'] = minimumSupportedVersion;
if (notesUrl) headers['x-notes-url'] = notesUrl;

console.log('\n正在上传并发布…');
const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/admin/releases`, {
  method: 'POST',
  headers,
  body: bytes,
});
const body = await response.json().catch(() => null);

if (!response.ok) {
  fail(`发布失败（HTTP ${response.status}）：${JSON.stringify(body ?? {})}`);
}

if (body?.sha256 && body.sha256 !== sha256) {
  fail('服务器返回的 SHA-256 与本机计算不一致，请停止使用该版本！');
}

console.log('\n✓ 发布完成');
console.log(JSON.stringify(body, null, 2));
console.log(`\n固定下载入口：${baseUrl}/download/gameboost`);
console.log(`下载地址：${body?.download_url ?? '(未知)'}`);
console.log('记得保留本机安装包：R2 对象不可变，不会覆盖任何旧版本。');
