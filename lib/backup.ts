import { storage } from './utils';

const HISTORY_KEY = 'prompt_history';

// 备份数据接口
interface BackupData {
    version: string;
    timestamp: string;
    data: {
        apiKeys?: Record<string, string>;
        translationApiKeys?: Record<string, { apiKey: string; secretKey?: string }>;
        customVocabulary?: any[];
        loras?: any[];
        history?: any[];
        templates?: any[];
        favorites?: any[];
        selectedModel?: string;
    };
}

// 导出备份数据
export function downloadBackup(): void {
    const backup: BackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
            apiKeys: storage.getJSON('apiKeys', {}),
            translationApiKeys: storage.getJSON('translationApiKeys', {}),
            customVocabulary: storage.getJSON('customVocabulary', []),
            loras: storage.getJSON('loras', []),
            history: storage.getJSON(HISTORY_KEY, []),
            templates: storage.getJSON('templates', []),
            favorites: storage.getJSON('favorites', []),
            selectedModel: storage.get('selectedModel') || undefined,
        }
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-optimizer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 从文件导入备份
export async function importFromFile(file: File): Promise<{ success: boolean; message: string }> {
    try {
        const text = await file.text();
        const backup: BackupData = JSON.parse(text);

        // 验证备份文件格式
        if (!backup.version || !backup.data) {
            return {
                success: false,
                message: '无效的备份文件格式'
            };
        }

        // 恢复数据
        let restoredCount = 0;

        if (backup.data.apiKeys) {
            storage.setJSON('apiKeys', backup.data.apiKeys);
            restoredCount++;
        }

        if (backup.data.translationApiKeys) {
            storage.setJSON('translationApiKeys', backup.data.translationApiKeys);
            restoredCount++;
        }

        if (backup.data.customVocabulary) {
            storage.setJSON('customVocabulary', backup.data.customVocabulary);
            restoredCount++;
        }

        if (backup.data.loras) {
            storage.setJSON('loras', backup.data.loras);
            restoredCount++;
        }

        if (backup.data.history) {
            storage.setJSON(HISTORY_KEY, backup.data.history);
            restoredCount++;
        }

        if (backup.data.templates) {
            storage.setJSON('templates', backup.data.templates);
            restoredCount++;
        }

        if (backup.data.favorites) {
            storage.setJSON('favorites', backup.data.favorites);
            restoredCount++;
        }

        if (backup.data.selectedModel) {
            storage.set('selectedModel', backup.data.selectedModel);
            restoredCount++;
        }

        return {
            success: true,
            message: `成功恢复 ${restoredCount} 项配置数据`
        };
    } catch (error) {
        console.error('导入失败:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '未知错误'
        };
    }
}

// 清除所有配置
export function clearAllConfig(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove = [
        'apiKeys',
        'translationApiKeys',
        'customVocabulary',
        'loras',
        'prompt_history',
        'templates',
        'favorites',
        'selectedModel',
        'baiduTranslateApiKey',
        'baiduTranslateSecretKey'
    ];

    keysToRemove.forEach(key => {
        storage.remove(key);
    });
}
