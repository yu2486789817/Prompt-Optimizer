/**
 * 简单的 Token 估算工具
 * 
 * 这是一个粗略的估算，用于给用户一个大概的参考。
 * 不同的模型（如 BERT, GPT, Claude）有不同的分词方式。
 * 
 * 规则：
 * 1. 英文单词平均约为 1.3 tokens
 * 2. 中文字符平均约为 1.5 - 2 tokens (取决于分词器)
 * 3. 标点符号、数字通常算 1 token
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;

    let tokenCount = 0;

    // 1. 提取所有中文字符
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    tokenCount += chineseChars.length * 1.5;

    // 2. 移除中文字符，处理剩下的英文部分
    const nonChineseText = text.replace(/[\u4e00-\u9fa5]/g, ' ');

    // 3. 按空格分割单词
    const words = nonChineseText.trim().split(/\s+/).filter(w => w.length > 0);

    // 4. 计算英文Token (平均每个单词 1.3 token，加上标点)
    words.forEach(word => {
        // 简单的启发式：根据单词长度微调
        if (word.length > 6) {
            tokenCount += 1.5;
        } else {
            tokenCount += 1.1;
        }

        // 检查标点符号
        const punctuation = word.match(/[.,!?;:()\[\]{}"']/g);
        if (punctuation) {
            tokenCount += punctuation.length * 0.5;
        }
    });

    return Math.ceil(tokenCount);
}

/**
 * 格式化数字显示
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
}
