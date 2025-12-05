import React from 'react';
import { Plus } from 'lucide-react';

interface NewProjectCardProps {
  onClick: () => void;
}

const NewProjectCard: React.FC<NewProjectCardProps> = ({ onClick }) => {
  return (
    <div
      className="relative group cursor-pointer bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 overflow-hidden flex items-center justify-center min-h-[200px]"
      onClick={onClick}
    >
      <div className="text-center p-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
          <Plus className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
          新建项目
        </p>
      </div>
    </div>
  );
};

export default NewProjectCard;
