import React from 'react';
import type { AIResponseBlock } from '../../types';
import { AIExplanationBlock } from './AIExplanationBlock';
import { AIChineseExample } from './AIChineseExample';
import { AICorrectionBlock } from './AICorrectionBlock';
import { AIPracticeBlock } from './AIPracticeBlock';

interface AIBlockRendererProps {
  block: AIResponseBlock;
}

export const AIBlockRenderer: React.FC<AIBlockRendererProps> = ({ block }) => {
  switch (block.type) {
    case 'explanation':
      return <AIExplanationBlock data={block} />;
    case 'chinese_example':
      return <AIChineseExample data={block} />;
    case 'correction':
      return <AICorrectionBlock data={block} />;
    case 'practice':
      return <AIPracticeBlock data={block} />;
    default:
      return null;
  }
};
