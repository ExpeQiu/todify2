import React from 'react';
import { NextStepRecommendation } from '../types/workflow';
import { getNodeById } from '../config/workflowNodes';
import './NextStepRecommendations.css';

interface NextStepRecommendationsProps {
  recommendations: NextStepRecommendation[];
  onSelectNext: (nodeId: string) => void;
  className?: string;
}

const NextStepRecommendations: React.FC<NextStepRecommendationsProps> = ({
  recommendations,
  onSelectNext,
  className = ''
}) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`next-step-recommendations empty ${className}`}>
        <h3>下一步推荐</h3>
        <p className="no-recommendations">暂无推荐的下一步操作</p>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return '强烈推荐';
    if (confidence >= 0.6) return '建议';
    return '可选';
  };

  return (
    <div className={`next-step-recommendations ${className}`}>
      <h3>下一步推荐</h3>
      <div className="recommendations-list">
        {recommendations.map((recommendation) => {
          const node = getNodeById(recommendation.nodeId);
          if (!node) return null;

          return (
            <div
              key={recommendation.nodeId}
              className={`recommendation-card confidence-${getConfidenceColor(recommendation.confidence)}`}
              onClick={() => onSelectNext(recommendation.nodeId)}
            >
              <div className="recommendation-header">
                <div className="node-info">
                  <span className="node-icon">
                    {React.createElement(node.icon as any)}
                  </span>
                  <span className="node-name">{node.name}</span>
                </div>
                <div className="confidence-badge">
                  <span className="confidence-text">
                    {getConfidenceText(recommendation.confidence)}
                  </span>
                  <span className="confidence-score">
                    {Math.round(recommendation.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="recommendation-content">
                <p className="recommendation-reason">{recommendation.reason}</p>
                <p className="node-description">{node.description}</p>
                
                {recommendation.requiredData && recommendation.requiredData.length > 0 && (
                  <div className="required-data">
                    <span className="required-label">需要数据：</span>
                    <span className="required-items">
                      {recommendation.requiredData.map(depId => {
                        const depNode = getNodeById(depId);
                        return depNode ? depNode.name : depId;
                      }).join(', ')}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="recommendation-actions">
                <button 
                  className="execute-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNext(recommendation.nodeId);
                  }}
                >
                  执行此步骤
                </button>
              </div>
            </div>
          );
        })}
      </div>
      

    </div>
  );
};

export default NextStepRecommendations;