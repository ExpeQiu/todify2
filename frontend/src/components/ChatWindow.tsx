import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, MessageSquare } from 'lucide-react';
import AIRoleChat from './AIRoleChat';
import { AIRoleConfig } from '../types/aiRole';

interface ChatWindowProps {
  role: AIRoleConfig;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  role,
  onClose,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 500, height: 600 }
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      if (isResizing) {
        const newWidth = Math.max(400, e.clientX - resizeStart.x);
        const newHeight = Math.max(300, e.clientY - resizeStart.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizeStart({
      x: size.width,
      y: size.height
    });
    setIsResizing(true);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg cursor-pointer z-50 border border-gray-200"
        onClick={handleMinimize}
      >
        <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
          {role.avatar ? (
            <img src={role.avatar} alt={role.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-800">{role.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col z-50"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: 400,
        minHeight: 300
      }}
    >
      {/* 窗口标题栏 */}
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 flex items-center justify-between cursor-move rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          {role.avatar ? (
            <img src={role.avatar} alt={role.name} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          )}
          <span className="font-medium">{role.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="最小化"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 对话内容区域 */}
      <div className="flex-1 overflow-hidden">
        <AIRoleChat roleConfig={role} compact={false} />
      </div>

      {/* 调整大小控件 */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={handleResizeMouseDown}
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #ccc 50%)',
          borderRadius: '0 0 0.5rem 0'
        }}
      />
    </div>
  );
};

export default ChatWindow;

