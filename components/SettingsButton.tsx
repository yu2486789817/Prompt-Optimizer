'use client';

import { useState, useRef } from 'react';
import { Settings, X, Eye, EyeOff, Download, Upload, Trash2 } from 'lucide-react';
import { storage } from '@/lib/utils';
import { AIModel } from '@/lib/models';
import { downloadBackup, importFromFile, clearAllConfig } from '@/lib/backup';

interface SettingsButtonProps {
  showSettings: boolean;
  onToggle: (show: boolean) => void;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export default function SettingsButton({
  showSettings,
  onToggle,
  selectedModel,
  onModelChange
}: SettingsButtonProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    return storage.getJSON('apiKeys', {});
  });

  const [translationApiKeys, setTranslationApiKeys] = useState<Record<string, { apiKey: string; secretKey?: string }>>(() => {
    return storage.getJSON('translationApiKeys', {});
  });

  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const handleApiKeyChange = (modelId: string, value: string) => {
    const newKeys = { ...apiKeys, [modelId]: value };
    setApiKeys(newKeys);
    storage.setJSON('apiKeys', newKeys);
  };

  const handleTranslationApiKeyChange = (service: string, field: 'apiKey' | 'secretKey', value: string) => {
    const newKeys = {
      ...translationApiKeys,
      [service]: {
        ...translationApiKeys[service],
        [field]: value
      }
    };
    setTranslationApiKeys(newKeys);
    storage.setJSON('translationApiKeys', newKeys);

    // 同时保存到单独的键以保持兼容性
    if (field === 'apiKey') {
      storage.set(`${service}TranslateApiKey`, value);
    } else {
      storage.set(`${service}TranslateSecretKey`, value);
    }
  };

  const toggleApiKeyVisibility = (modelId: string) => {
    setShowApiKeys(prev => ({ ...prev, [modelId]: !prev[modelId] }));
  };

  // 备份相关
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadBackup();
    alert('配置已导出！');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromFile(file);
    if (result.success) {
      alert(result.message + '\n\n页面将刷新以应用新配置。');
      window.location.reload();
    } else {
      alert('导入失败：' + result.message);
    }

    // 清空 file input 以便再次选择同一文件
    e.target.value = '';
  };

  const handleClearConfig = () => {
    if (confirm('确定要清除所有配置吗？此操作不可恢复！\n\n建议先导出备份。')) {
      clearAllConfig();
      alert('配置已清除！页面将刷新。');
      window.location.reload();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => onToggle(!showSettings)}
        className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/50 rounded-lg transition-colors"
      >
        <Settings size={20} />
      </button>

      {showSettings && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">设置</h3>
              <button
                onClick={() => onToggle(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {/* API Keys 设置 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">API Keys 配置</h4>
                <div className="space-y-3">
                  {[
                    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
                    { id: 'grok-4-latest', name: 'Grok', provider: 'xAI' },
                    { id: 'deepseek-chat', name: 'DeepSeek', provider: 'DeepSeek' },
                    { id: 'qwen-max', name: 'Qwen3-235B', provider: 'Alibaba' }
                  ].map(model => (
                    <div key={model.id} className="space-y-1">
                      <label className="text-xs text-gray-600">
                        {model.name} ({model.provider})
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKeys[model.id] ? 'text' : 'password'}
                          value={apiKeys[model.id] || ''}
                          onChange={(e) => handleApiKeyChange(model.id, e.target.value)}
                          placeholder="输入 API Key"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility(model.id)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKeys[model.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 使用说明 */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">使用说明</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• 请在对应模型输入框中填写您的 API Key</li>
                  <li>• API Key 将安全保存在浏览器本地存储中</li>
                  <li>• Qwen3-235B 需要使用 ModelScope Access Token</li>
                  <li>• 如需获取 API Key，请访问对应模型官网</li>
                  <li>• 建议优先使用 Grok 或 Gemini 模型</li>
                </ul>
              </div>

              {/* 翻译服务 API Keys */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">翻译服务 API Keys</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">百度翻译 APP ID</label>
                    <div className="relative">
                      <input
                        type={showApiKeys['baidu-translation-key'] ? 'text' : 'password'}
                        value={translationApiKeys.baidu?.apiKey || ''}
                        onChange={(e) => handleTranslationApiKeyChange('baidu', 'apiKey', e.target.value)}
                        placeholder="输入百度翻译 APP ID"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => toggleApiKeyVisibility('baidu-translation-key')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKeys['baidu-translation-key'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">百度翻译 Secret Key</label>
                    <div className="relative">
                      <input
                        type={showApiKeys['baidu-translation-secret'] ? 'text' : 'password'}
                        value={translationApiKeys.baidu?.secretKey || ''}
                        onChange={(e) => handleTranslationApiKeyChange('baidu', 'secretKey', e.target.value)}
                        placeholder="输入百度翻译 Secret Key"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => toggleApiKeyVisibility('baidu-translation-secret')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKeys['baidu-translation-secret'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 当前模型 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-1">当前选中模型</h4>
                <p className="text-sm text-gray-600">{selectedModel.name} - {selectedModel.provider}</p>
              </div>

              {/* 数据备份与迁移 */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">数据备份与迁移</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} />
                    导出配置
                  </button>
                  <button
                    onClick={handleImportClick}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <Upload size={16} />
                    导入配置
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={handleClearConfig}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={16} />
                    清除所有配置
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  导出的配置包含 API Keys、词汇表、LoRA、历史记录等数据
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}