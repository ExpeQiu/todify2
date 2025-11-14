import React from "react";

interface StudioToolItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

interface StudioToolsProps {
  items: StudioToolItem[];
  onTrigger: (id: string) => void;
  executingId?: string | null;
}

const StudioTools: React.FC<StudioToolsProps> = ({ items, onTrigger, executingId }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((tool) => {
        const Icon = tool.icon;
        const isExecuting = executingId === tool.id;
        const disabled = Boolean(executingId) && !isExecuting;

        return (
          <button
            key={tool.id}
            onClick={() => onTrigger(tool.id)}
            disabled={disabled}
            className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
              isExecuting
                ? "bg-blue-50 border-blue-400"
                : "bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            title={tool.description || tool.label}
          >
            <Icon className={`w-6 h-6 mb-2 ${isExecuting ? "text-blue-600" : "text-gray-600"}`} />
            <span className="text-xs text-gray-700 text-center">{tool.label}</span>
            {isExecuting && (
              <span className="mt-2 text-[10px] text-blue-500">执行中…</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StudioTools;

