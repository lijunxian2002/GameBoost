#!/usr/bin/env node
/**
 * 生成 GameBoost 发布签名密钥（ed25519），只运行一次。
 *
 * 用法：
 *   node scripts/release-keygen.mjs          # 生成密钥对（已有密钥时拒绝覆盖）
 *   node scripts/release-keygen.mjs --force  # 强制重新生成（旧版本签名全部作废！）
 *
 * 生成后：
 * 1. 把输出里的 RELEASE_SIGNING_KEY（base64 的 PKCS8 私钥）配置到控制平面环境值，
 *    只放在服务端，绝不进代码仓库。
 * 2. 把 RELEASE_PUBLIC_KEY 交给 EXE 更新客户端，用于校验发布签名。
 * 私钥文件保存在 release-keys/ 并已被 .gitignore 排除。
 */
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const keysDir = resolve(root, 'release-keys');
const privatePath = resolve(keysDir, 'release-signing-private.pem');
const publicPath = resolve(keysDir, 'release-signing-public.pem');

const force = process.argv.includes('--force');
if (existsSync(privatePath) && !force) {
  console.error('已存在签名密钥，拒绝覆盖。确定要作废旧签名再运行：node scripts/release-keygen.mjs --force');
  process.exit(1);
}

mkdirSync(keysDir, { recursive: true });
const { privateKey, publicKey } = generateKeyPairSync('ed25519');

writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
writeFileSync(publicPath, publicKey.export({ type: 'spki', format: 'pem' }));

const privateBase64 = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
const publicBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

console.log('✓ 已生成 ed25519 发布签名密钥对');
console.log(`私钥文件：${privatePath}（已被 .gitignore 排除，请勿提交）`);
console.log(`公钥文件：${publicPath}`);
console.log('');
console.log('下一步：');
console.log(`1. 在控制平面把环境值 RELEASE_SIGNING_KEY 设置为：`);
console.log(`   ${privateBase64}`);
console.log('');
console.log(`2. 把公钥交给 EXE 更新客户端（烘焙进安装包）：`);
console.log(`   RELEASE_PUBLIC_KEY=${publicBase64}`);
console.log('');
console.log('密钥只生成一次；重新生成会使已发布版本的签名全部失效。');
