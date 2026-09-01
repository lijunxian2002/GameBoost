#!/usr/bin/env bash
# P0 验收脚本：对固定下载入口、latest API、stable/beta 隔离、哈希与失败路径做最小验证。
# 用法：bash scripts/verify-p0.sh [BASE_URL] [TOKEN]
# 默认 BASE_URL=http://localhost:3000，TOKEN 从环境变量 RELEASE_TOKEN 读取。
set -u

BASE_URL="${1:-http://localhost:3000}"
TOKEN="${2:-${RELEASE_TOKEN:-}}"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    printf '  ✓ %s\n' "$name"
  else
    FAIL=$((FAIL + 1))
    printf '  ✗ %s\n    期望: %s\n    实际: %s\n' "$name" "$expected" "$actual"
  fi
}

# 造一个测试安装包（带随机内容，保证每次发布内容不同）
TEST_FILE="$(mktemp -d)/GameBoost-test-windows-x64.exe"
head -c 1048576 /dev/urandom > "$TEST_FILE"

echo "== 0. 空库失败路径（首次运行前 D1 应为空）=="
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/v1/releases/latest")
check "latest API 空库返回 404" "404" "$code"
body=$(curl -s "$BASE_URL/api/v1/releases/latest")
check "latest API 返回 release_not_found" 'release_not_found' "$(echo "$body" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).error)}catch{console.log("parse-fail")}})')"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/download/gameboost")
check "下载入口空库返回 404" "404" "$code"
check "下载入口 404 页面含联系方式" "true" "$(curl -s "$BASE_URL/download/gameboost" | grep -c '17695989770' | grep -q '[1-9]' && echo true || echo false)"

echo "== 1. 发布参数校验 =="
if [ -n "$TOKEN" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "x-release-token: wrong-token" --data-binary @"$TEST_FILE" "$BASE_URL/api/v1/admin/releases")
  check "错误令牌返回 401" "401" "$code"
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "x-release-token: $TOKEN" -H "x-channel: stable" -H "x-version: not-a-version" --data-binary @"$TEST_FILE" "$BASE_URL/api/v1/admin/releases")
  check "非法版本号返回 400" "400" "$code"
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "x-release-token: $TOKEN" -H "x-channel: nightly" -H "x-version: 0.2.0" --data-binary @"$TEST_FILE" "$BASE_URL/api/v1/admin/releases")
  check "非法通道返回 400" "400" "$code"
else
  echo "  （未提供 TOKEN，跳过发布相关检查。设置 RELEASE_TOKEN 后重跑。）"
fi

echo "== 2. 发布 stable 0.2.0 =="
if [ -n "$TOKEN" ]; then
  PUBLISH=$(curl -s -w '\n%{http_code}' -X POST \
    -H "x-release-token: $TOKEN" -H "x-product: gameboost" -H "x-channel: stable" \
    -H "x-platform: windows-x64" -H "x-version: 0.2.0" -H "x-mandatory: 0" \
    --data-binary @"$TEST_FILE" "$BASE_URL/api/v1/admin/releases")
  code=$(echo "$PUBLISH" | tail -1)
  check "发布返回 201" "201" "$code"
  body=$(echo "$PUBLISH" | head -1)
  api_sha=$(echo "$body" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).sha256)}catch{console.log("")}})')
  local_sha=$(sha256sum "$TEST_FILE" | cut -d' ' -f1)
  check "服务器 SHA-256 与本机一致" "$local_sha" "$api_sha"
  sig_len=$(echo "$body" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).signature.length)}catch{console.log(0)}})')
  check "响应包含 88 字符 base64 签名（ed25519）" "88" "$sig_len"

  echo "== 3. latest API 与固定下载入口 =="
  latest=$(curl -s "$BASE_URL/api/v1/releases/latest?product=gameboost&channel=stable&platform=windows-x64")
  check "latest 版本号" "0.2.0" "$(echo "$latest" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).version)}catch{console.log("")}})')"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/download/gameboost")
  check "下载入口返回 302" "302" "$code"
  dl=$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE_URL/download/gameboost")
  check "302 指向 /releases/ 下载地址" "true" "$(echo "$dl" | grep -q '^.*/releases/gameboost/stable/windows-x64/0.2.0/GameBoost-0.2.0-windows-x64.exe$' && echo true || echo false)"
  dl_sha=$(curl -sL "$BASE_URL/download/gameboost" | sha256sum | cut -d' ' -f1)
  check "下载内容哈希与本机一致" "$local_sha" "$dl_sha"

  echo "== 4. 重复发布与隔离 =="
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -H "x-release-token: $TOKEN" -H "x-channel: stable" -H "x-version: 0.2.0" \
    --data-binary @"$TEST_FILE" "$BASE_URL/api/v1/admin/releases")
  check "重复发布返回 409" "409" "$code"
  beta=$(curl -s "$BASE_URL/api/v1/releases/latest?channel=beta")
  check "stable 请求拿不到 beta（beta 空库 404）" "404" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/v1/releases/latest?channel=beta")"

  echo "== 5. 发布失败不影响当前最新版 =="
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -H "x-release-token: $TOKEN" -H "x-channel: stable" -H "x-version: bad.version!" \
    --data-binary @"$TEST_FILE" "$BASE_URL/api/v1/admin/releases")
  check "非法版本发布返回 400" "400" "$code"
  still=$(curl -s "$BASE_URL/api/v1/releases/latest?channel=stable")
  check "latest 仍是 0.2.0" "0.2.0" "$(echo "$still" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).version)}catch{console.log("")}})')"
else
  echo "  （跳过）"
fi

echo ""
echo "结果：$PASS 通过，$FAIL 失败"
[ "$FAIL" -eq 0 ] || exit 1
