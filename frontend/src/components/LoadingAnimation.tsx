import React, { useState, useEffect } from 'react';
import { Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import './LoadingAnimation.css';

interface LoadingAnimationProps {
  type?: 'spinner' | 'pulse' | 'dots' | 'wave' | 'ai' | 'skeleton' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  progress?: number;
  className?: string;
  status?: 'loading' | 'success' | 'error';
  // duration?: number;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'spinner',
  size = 'md',
  text,
  progress,
  className = '',
  status = 'loading',
  // duration = 2000
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (type === 'progress' && status === 'loading') {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [type, status]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const renderSpinner = () => (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <Loader2 className="w-full h-full text-indigo-600" />
    </div>
  );

  // const renderPulse = () => (
  //   <div className={`${sizeClasses[size]} ${className}`}>
  //     <div className="w-full h-full bg-indigo-600 rounded-full animate-pulse"></div>
  //   </div>
  // );

  // const renderDots = () => (
  //   <div className={`flex space-x-1 ${className}`}>
  //     {[0, 1, 2].map((i) => (
  //       <div
  //         key={i}
  //         className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} 
  //                    bg-indigo-600 rounded-full animate-bounce`}
  //         style={{
  //           animationDelay: `${i * 0.1}s`,
  //           animationDuration: '0.6s'
  //         }}
  //       ></div>
  //     ))}
  //   </div>
  // );

  // const renderWave = () => (
  //   <div className={`flex items-end space-x-1 ${className}`}>
  //     {[0, 1, 2, 3, 4].map((i) => (
  //       <div
  //         key={i}
  //         className={`${size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2'} 
  //                    bg-indigo-600 rounded-t-sm animate-pulse`}
  //         style={{
  //           height: `${Math.random() * 20 + 10}px`,
  //           animationDelay: `${i * 0.1}s`,
  //           animationDuration: '1s'
  //         }}
  //       ></div>
  //     ))}
  //   </div>
  // );

  // const renderAI = () => (
  //   <div className={`relative ${sizeClasses[size]} ${className}`}>
  //     <div className="absolute inset-0 animate-spin">
  //       <Brain className="w-full h-full text-indigo-600" />
  //     </div>
  //     <div className="absolute inset-0 animate-ping">
  //       <Sparkles className="w-full h-full text-purple-500 opacity-75" />
  //     </div>
  //   </div>
  // );

  const renderSkeleton = () => (
    <div className="space-y-3">
      <div className="skeleton-line h-4 rounded w-3/4"></div>
      <div className="skeleton-line h-4 rounded w-1/2"></div>
      <div className="skeleton-line h-4 rounded w-5/6"></div>
      <div className="skeleton-line h-3 rounded w-2/3"></div>
    </div>
  );

  const renderProgress = () => (
    <div className="progress-circle relative w-16 h-16">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={animationPhase === i ? '#6366f1' : '#e5e7eb'}
            strokeWidth="8"
            strokeDasharray={`${60 + i * 10} ${200 - (60 + i * 10)}`}
            strokeDashoffset={i * -50}
            className={`progress-segment ${animationPhase === i ? 'active' : 'inactive'}`}
            transform={`rotate(${i * 60} 50 50)`}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-indigo-600">
          {Math.round(((animationPhase + 1) / 6) * 100)}%
        </span>
      </div>
    </div>
  );

  const renderStatusIcon = () => {
    if (status === 'success') {
      return <CheckCircle className={`status-icon ${sizeClasses[size]} text-green-500`} />;
    }
    if (status === 'error') {
      return <AlertCircle className={`status-icon ${sizeClasses[size]} text-red-500`} />;
    }
    return null;
  };

  const renderAnimation = () => {
    if (status !== 'loading') {
      return renderStatusIcon();
    }

    const sizeClass = sizeClasses[size];

    switch (type) {
      case 'spinner':
        return <Loader2 className={`animate-spin spinner-enhanced ${sizeClass}`} />;
      case 'pulse':
        return <div className={`bg-indigo-600 rounded-full pulse-glow ${sizeClass}`} />;
      case 'dots':
        return (
          <div className="dots-bounce flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`dot bg-indigo-600 rounded-full ${sizeClass}`} />
            ))}
          </div>
        );
      case 'wave':
        return (
          <div className="wave-gradient flex items-end space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`wave-bar w-1 bg-indigo-600 rounded-full ${sizeClass}`} />
            ))}
          </div>
        );
      case 'ai':
        return (
          <div className="ai-brain relative">
            <Brain className={`text-indigo-600 ${sizeClass}`} />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`brain-wave absolute inset-0 border-2 border-indigo-300 rounded-full ${sizeClass}`}
              />
            ))}
          </div>
        );
      case 'skeleton':
        return renderSkeleton();
      case 'progress':
        return renderProgress();
      default:
        return renderSpinner();
    }
  };

  const getStatusText = () => {
    if (status === 'success') return '完成';
    if (status === 'error') return '错误';
    return text;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {renderAnimation()}
      
      {getStatusText() && (
        <div className="text-center">
          <p className={`text-sm font-medium ${
             status === 'success' ? 'text-green-600' : 
             status === 'error' ? 'text-red-600' : 
             'text-gray-600'
           }`}>
             {getStatusText()}
           </p>
           {progress !== undefined && type !== 'progress' && (
             <div className="mt-2 w-32 bg-gray-200 rounded-full h-1">
               <div 
                 className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                 style={{ width: `${progress}%` }}
               />
             </div>
           )}
        </div>
      )}
      
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white opacity-30 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 全屏加载覆盖层组件
// interface LoadingOverlayProps {
//   isVisible: boolean;
//   text?: string;
//   progress?: number;
//   type?: LoadingAnimationProps['type'];
// }

export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  children?: React.ReactNode;
  className?: string;
  dark?: boolean;
}> = ({ isVisible, children, className = '', dark = false }) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center loading-overlay-enhanced ${dark ? 'dark' : ''} ${className}`}>
      {children || <LoadingAnimation type="spinner" size="lg" text="加载中..." />}
    </div>
  );
};

// 内联加载组件
interface InlineLoadingProps {
  text?: string;
  size?: LoadingAnimationProps['size'];
  type?: LoadingAnimationProps['type'];
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = '加载中...',
  size = 'sm',
  type = 'spinner'
}) => (
  <div className="flex items-center space-x-2 text-gray-600">
    <LoadingAnimation type={type} size={size} />
    <span className="text-sm">{text}</span>
  </div>
);

// 按钮加载状态组件
// interface LoadingButtonProps {
//   isLoading: boolean;
//   children: React.ReactNode;
//   onClick?: () => void;
//   disabled?: boolean;
//   className?: string;
//   loadingText?: string;
// }

export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  loadingText?: string;
}> = ({ 
  isLoading, 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  loadingText = '处理中...'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`loading-button-enhanced relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        isLoading || disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
      } ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <LoadingAnimation type="spinner" size="sm" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingAnimation;