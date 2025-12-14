export interface MagicCategory {
    id: string;
    name: string;
    prompts: string[];
}

export const magicCategories: MagicCategory[] = [
    {
        id: 'quality',
        name: '画质增强',
        prompts: [
            'masterpiece',
            'best quality',
            'ultra high resolution',
            '8k wallpaper',
            'perfect lighting',
            'intricate details',
            'sharp focus',
            'hyperrealistic'
        ]
    },
    {
        id: 'lighting',
        name: '光影增强',
        prompts: [
            'cinematic lighting',
            'volumetric lighting',
            'ray tracing',
            'global illumination',
            'soft lighting',
            'dynamic lighting',
            'detailed shadows',
            'ambient occlusion'
        ]
    },
    {
        id: 'artistic',
        name: '艺术感',
        prompts: [
            'concept art',
            'digital art',
            'trending on artstation',
            'highly detailed',
            'vivid colors',
            'rich colors',
            'aesthetic',
            'composition'
        ]
    },
    {
        id: 'lens',
        name: '镜头感',
        prompts: [
            'depth of field',
            'bokeh',
            'wide angle',
            'telephoto',
            'macro shot',
            'rule of thirds'
        ]
    }
];

export function enhancePrompt(currentPrompt: string): string {
    // 1. 解析当前提示词，转为 Set 以便去重
    const currentTags = new Set(
        currentPrompt.split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0)
    );

    const newTags: string[] = [];

    // 2. 从每个分类中随机选取 1-2 个未使用的词
    magicCategories.forEach(category => {
        // 随机打乱当前分类的词汇
        const shuffled = [...category.prompts].sort(() => Math.random() - 0.5);

        // 选取前 1-2 个
        const count = Math.random() > 0.5 ? 2 : 1;
        let added = 0;

        for (const prompt of shuffled) {
            if (added >= count) break;

            const lowerPrompt = prompt.toLowerCase();
            // 检查是否已包含（简单模糊匹配）
            const isDuplicate = Array.from(currentTags).some(t =>
                t.includes(lowerPrompt) || lowerPrompt.includes(t)
            );

            if (!isDuplicate) {
                newTags.push(prompt);
                currentTags.add(lowerPrompt); // 防止同一次增强中添加重复语义
                added++;
            }
        }
    });

    // 3. 组合新旧提示词
    const originalPart = currentPrompt.trim();
    const enhancementPart = newTags.join(', ');

    if (!originalPart) return enhancementPart;
    if (!enhancementPart) return originalPart;

    return `${originalPart}, ${enhancementPart}`;
}
