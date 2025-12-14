// 简化的代理方案 - 依赖环境变量
export async function fetchWithProxy(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 直接使用 fetch，Node.js 会自动使用环境变量中的代理设置
  console.log('发起请求:', {
    url: url.replace(/key=[^&]+/, 'key=***'),
    method: options.method || 'GET',
    proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || '未设置'
  });

  return fetch(url, options);
}