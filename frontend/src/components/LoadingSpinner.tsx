import React from 'react';
import '../styles/loading.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'wave' | 'pulse';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  text?: string;
  subtext?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  subtext,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // const colorClasses = {
  //   primary: 'border-primary-500',
  //   secondary: 'border-gray-500',
  //   success: 'border-green-500',
  //   warning: 'border-yellow-500',
  //   error: 'border-red-500'
  // };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div 
            className={`loading-spinner ${sizeClasses[size]} ${className}`}
            style={{
              borderColor: 'var(--gray-200)',
              borderTopColor: `var(--${color}-500)`
            }}
          />
        );

      case 'dots':
        return (
          <div className={`dots-loader ${className}`}>
            <div className="dot" style={{ backgroundColor: `var(--${color}-500)` }} />
            <div className="dot" style={{ backgroundColor: `var(--${color}-500)` }} />
            <div className="dot" style={{ backgroundColor: `var(--${color}-500)` }} />
          </div>
        );

      case 'wave':
        return (
          <div className={`wave-loader ${className}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className="wave-bar" 
                style={{ backgroundColor: `var(--${color}-500)` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div 
            className={`animate-pulse ${sizeClasses[size]} ${className}`}
            style={{
              backgroundColor: `var(--${color}-500)`,
              borderRadius: '50%'
            }}
          />
        );

      default:
        return null;
    }
  };

  if (text || subtext) {
    return (
      <div className="loading-content">
        {renderSpinner()}
        {text && <p className="loading-text">{text}</p>}
        {subtext && <p className="loading-subtext">{subtext}</p>}
      </div>
    );
  }

  return renderSpinner();
};

export default LoadingSpinner;

// 页面级加载覆盖层组件
interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  subtext?: string;
  variant?: 'spinner' | 'dots' | 'wave';
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = '加载中...',
  subtext,
  variant = 'spinner',
  onCancel
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <LoadingSpinner variant={variant} size="lg" />
        <p className="loading-text">{text}</p>
        {subtext && <p className="loading-subtext">{subtext}</p>}
        {onCancel && (
          <button 
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 'var(--spacing-2)' }}
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
};

// 内联加载状态组件
interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = '加载中...',
  // size = 'sm',
  className = ''
}) => {
  return (
    <div className={`loading-inline ${className}`}>
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
};

// 进度条组件
interface ProgressBarProps {
  progress?: number; // 0-100, undefined for indeterminate
  text?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  text,
  showPercentage = false,
  className = ''
}) => {
  const isIndeterminate = progress === undefined;

  return (
    <div className={`progress-container ${className}`}>
      {(text || showPercentage) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 'var(--spacing-2)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)'
        }}>
          {text && <span>{text}</span>}
          {showPercentage && !isIndeterminate && <span>{progress}%</span>}
        </div>
      )}
      <div className={`progress-bar ${isIndeterminate ? 'progress-indeterminate' : ''}`}>
        {!isIndeterminate && (
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
};

// 骨架屏组件
interface SkeletonProps {
  lines?: number;
  className?: string;
  avatar?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  lines = 3,
  className = '',
  avatar = false
}) => {
  const lineVariants = ['long', 'medium', 'short'];

  return (
    <div className={`skeleton-container ${className}`}>
      {avatar && <div className="skeleton-circle" style={{ marginBottom: 'var(--spacing-3)' }} />}
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`skeleton-line ${lineVariants[index % lineVariants.length]}`}
        />
      ))}
    </div>
  );
};