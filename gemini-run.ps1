# --- 配置区域 ---
$ProxyPort = "7897"  # <--- 如果你的端口不一样，请改这里 (v2rayN通常是10809)
# ----------------

# 设置代理 (解决连接超时 ETIMEDOUT)
$env:HTTP_PROXY = "http://127.0.0.1:$ProxyPort"
$env:HTTPS_PROXY = "http://127.0.0.1:$ProxyPort"

# 禁用 SSL 严格验证 (解决 API Error: Premature close)
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

Write-Host "✅ 网络环境已配置 (端口: $ProxyPort, 忽略SSL证书)" -ForegroundColor Green
Write-Host "---------------------------------------------" -ForegroundColor Gray

