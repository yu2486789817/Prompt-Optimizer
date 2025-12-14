'use client';

import { AIModel } from '@/lib/models';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  models: AIModel[];
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  models
}: ModelSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
        选择 AI 模型
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => onModelChange(model)}
            className={`p-2 border rounded-lg text-left transition-all ${selectedModel.id === model.id
              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/40 shadow-sm backdrop-blur-sm'
              : 'border-gray-300 dark:border-white/10 bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 hover:border-gray-400 dark:hover:bg-gray-800/60 dark:hover:border-white/20 backdrop-blur-sm'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{model.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{model.provider}</p>
              </div>
              {selectedModel.id === model.id && (
                <div className="ml-1 flex-shrink-0">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            {model.description && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">{model.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}