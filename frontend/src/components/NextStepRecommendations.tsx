import React from "react";
import { NextStepRecommendation } from "../types/workflow";
import { getNodeById } from "../config/workflowNodes";
import "./NextStepRecommendations.css";

interface NextStepRecommendationsProps {
  recommendations: NextStepRecommendation[];
  onSelectNext: (nodeId: string) => void;
  className?: string;
}

const NextStepRecommendations: React.FC<NextStepRecommendationsProps> = ({
  recommendations,
  onSelectNext,
  className = "",
}) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div
        className={`next-step-recommendations empty ${className}`}
        data-oid="21m_3__"
      >
        <h3 data-oid="s8r.s0r">下一步推荐</h3>
        <p className="no-recommendations" data-oid="bm0nbar">
          暂无推荐的下一步操作
        </p>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "high";
    if (confidence >= 0.6) return "medium";
    return "low";
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return "强烈推荐";
    if (confidence >= 0.6) return "建议";
    return "可选";
  };

  return (
    <div
      className={`next-step-recommendations ${className}`}
      data-oid="gt2fih7"
    >
      <h3 data-oid="l33774-">下一步推荐</h3>
      <div className="recommendations-list" data-oid="5:xz.6j">
        {recommendations.map((recommendation) => {
          const node = getNodeById(recommendation.nodeId);
          if (!node) return null;

          return (
            <div
              key={recommendation.nodeId}
              className={`recommendation-card confidence-${getConfidenceColor(recommendation.confidence)}`}
              onClick={() => onSelectNext(recommendation.nodeId)}
              data-oid="zg_epzt"
            >
              <div className="recommendation-header" data-oid="xf438l4">
                <div className="node-info" data-oid="3ezqtsp">
                  <span className="node-icon" data-oid="a9yy24i">
                    {React.createElement(node.icon as any)}
                  </span>
                  <span className="node-name" data-oid="7p6qtsk">
                    {node.name}
                  </span>
                </div>
                <div className="confidence-badge" data-oid="shcqqhn">
                  <span className="confidence-text" data-oid="sa639:k">
                    {getConfidenceText(recommendation.confidence)}
                  </span>
                  <span className="confidence-score" data-oid="-.:spow">
                    {Math.round(recommendation.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="recommendation-content" data-oid="r:dgcjf">
                <p className="recommendation-reason" data-oid="q45pxek">
                  {recommendation.reason}
                </p>
                <p className="node-description" data-oid="h_furfm">
                  {node.description}
                </p>

                {recommendation.requiredData &&
                  recommendation.requiredData.length > 0 && (
                    <div className="required-data" data-oid="iq4hmh9">
                      <span className="required-label" data-oid="wmzf1ml">
                        需要数据：
                      </span>
                      <span className="required-items" data-oid="ozx1m3o">
                        {recommendation.requiredData
                          .map((depId) => {
                            const depNode = getNodeById(depId);
                            return depNode ? depNode.name : depId;
                          })
                          .join(", ")}
                      </span>
                    </div>
                  )}
              </div>

              <div className="recommendation-actions" data-oid="_ytg4wt">
                <button
                  className="execute-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNext(recommendation.nodeId);
                  }}
                  data-oid="lolj-xf"
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
