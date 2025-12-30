import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

// 根据环境变量创建可选代理，避免默认强绑本地代理导致请求失败
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

export const http = axios.create({
  httpAgent: agent,
  httpsAgent: agent,
  proxy: false, // 使用自定义 agent，关闭 axios 自带代理
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default http;
