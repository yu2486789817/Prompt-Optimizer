import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

// 创建代理代理
const agent = new HttpsProxyAgent("http://127.0.0.1:10808");

// 创建带代理的axios实例
export const http = axios.create({
  httpAgent: agent,
  httpsAgent: agent,
  proxy: false,  // 禁用axios内置的proxy逻辑，使用我们的agent
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 导出axios实例以便直接使用
export default http;