import React from "react";
import { Edit, Eye, Target, Grid, Megaphone, Video, Languages, Presentation, FileText } from "lucide-react";

interface StudioToolsProps {
  onCreatePPT?: () => void;
  onCreateScript?: () => void;
  onCreateMindMap?: () => void;
}

const StudioTools: React.FC<StudioToolsProps> = ({
  onCreatePPT,
  onCreateScript,
  onCreateMindMap,
}) => {
  const tools = [
    {
      id: "audio",
      icon: Eye,
      label: "五看分析",
      onClick: () => {
        console.log("创建五看分析");
      },
    },
    {
      id: "video",
      icon: Target,
      label: "三定分析",
      onClick: () => {
        console.log("创建三定分析");
      },
    },
    {
      id: "mindmap",
      icon: Grid,
      label: "技术矩阵",
      onClick: onCreateMindMap || (() => {
        console.log("创建技术矩阵");
      }),
    },
    {
      id: "report",
      icon: Megaphone,
      label: "传播策略",
      onClick: () => {
        console.log("创建传播策略");
      },
    },
    {
      id: "flashcard",
      icon: Video,
      label: "展具与视频",
      onClick: () => {
        console.log("创建展具与视频");
      },
    },
    {
      id: "translate",
      icon: Languages,
      label: "翻译",
      onClick: () => {
        console.log("创建翻译");
      },
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT大纲",
      onClick: onCreatePPT || (() => {
        console.log("创建PPT大纲");
      }),
    },
    {
      id: "script",
      icon: FileText,
      label: "脚本",
      onClick: onCreateScript || (() => {
        console.log("创建脚本");
      }),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={tool.onClick}
            className="relative group flex flex-col items-center justify-center p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all"
          >
            <Icon className="w-6 h-6 text-gray-600 mb-2" />
            <span className="text-xs text-gray-700 text-center">{tool.label}</span>
            <button
              className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 bg-white rounded shadow-sm hover:bg-gray-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                console.log(`编辑${tool.label}`);
              }}
              title="编辑"
            >
              <Edit className="w-3 h-3 text-gray-600" />
            </button>
          </button>
        );
      })}
    </div>
  );
};

export default StudioTools;

