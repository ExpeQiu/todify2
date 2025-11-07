import { logger } from '@/shared/lib/logger';

export const formatAdditionalInformation = (inputs: any): string => {
  try {
    if (inputs?.searchResults) {
      const searchData = inputs.searchResults;
      let formattedInfo = '';

      if (searchData.query) {
        formattedInfo += `查询内容：${searchData.query}\n\n`;
      }

      if (Array.isArray(searchData.results)) {
        formattedInfo += '搜索结果：\n';
        searchData.results.forEach((result: any, index: number) => {
          formattedInfo += `${index + 1}. ${result.title || result.content || JSON.stringify(result)}\n`;
        });
        formattedInfo += '\n';
      }

      if (inputs.template) {
        formattedInfo += `包装模板：${inputs.template}\n\n`;
      }

      return formattedInfo.trim() || JSON.stringify(inputs);
    }

    if (inputs?.query || inputs?.selectedKnowledgePoints) {
      let formattedInfo = '';

      if (inputs.query) {
        formattedInfo += `查询内容：${inputs.query}\n\n`;
      }

      if (Array.isArray(inputs.selectedKnowledgePoints)) {
        formattedInfo += '相关知识点：\n';
        inputs.selectedKnowledgePoints.forEach((kp: any, index: number) => {
          formattedInfo += `${index + 1}. ${kp.title || kp.content || JSON.stringify(kp)}\n`;
        });
        formattedInfo += '\n';
      }

      return formattedInfo.trim() || JSON.stringify(inputs);
    }

    return JSON.stringify(inputs ?? {}, null, 2);
  } catch (error) {
    logger.error('格式化 Additional_information 时出错', { error, inputs });
    return JSON.stringify(inputs ?? {});
  }
};

