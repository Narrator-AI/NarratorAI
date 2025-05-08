import { LocalizationData, LocalizationEntity } from '../types/workflow.types';

export const generateSampleLocalizationData = (): LocalizationData => {
  return {
    角色: {
      "主角": [
        { id: "char1", 原文: "张三", 本土化: "John", 注释: "主角名字" },
        { id: "char2", 原文: "李四", 本土化: "Mike", 注释: "配角名字" }
      ]
    },
    地名: [
      { id: "loc1", 原文: "北京", 本土化: "Beijing", 注释: "中国首都" }
    ],
    组织名: [
      { id: "org1", 原文: "某科技公司", 本土化: "Tech Corp", 注释: "公司名称" }
    ],
    文化相关: [
      { id: "cult1", 原文: "春节", 本土化: "Spring Festival", 注释: "中国新年" }
    ]
  };
};

export const deepCloneWithNewIds = (entities: LocalizationEntity[]): LocalizationEntity[] => {
  return entities.map(entity => ({
    ...entity,
    id: `${entity.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }));
}; 