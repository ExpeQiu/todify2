import React from "react";
import "../styles/loading.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "wave" | "pulse";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  text?: string;
  subtext?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "spinner",
  color = "primary",
  text,
  subtext,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
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
      case "spinner":
        return (
          <div
            className={`loading-spinner ${sizeClasses[size]} ${className}`}
            style={{
              borderColor: "var(--gray-200)",
              borderTopColor: `var(--${color}-500)`,
            }}
            data-oid="tdz0a2h"
          />
        );

      case "dots":
        return (
          <div className={`dots-loader ${className}`} data-oid="5ik3d9l">
            <div
              className="dot"
              style={{ backgroundColor: `var(--${color}-500)` }}
              data-oid="hg8i9j9"
            />

            <div
              className="dot"
              style={{ backgroundColor: `var(--${color}-500)` }}
              data-oid="a2ed:02"
            />

            <div
              className="dot"
              style={{ backgroundColor: `var(--${color}-500)` }}
              data-oid="7rh2_oh"
            />
          </div>
        );

      case "wave":
        return (
          <div className={`wave-loader ${className}`} data-oid="dnguqhz">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="wave-bar"
                style={{ backgroundColor: `var(--${color}-500)` }}
                data-oid="hc_nxga"
              />
            ))}
          </div>
        );

      case "pulse":
        return (
          <div
            className={`animate-pulse ${sizeClasses[size]} ${className}`}
            style={{
              backgroundColor: `var(--${color}-500)`,
              borderRadius: "50%",
            }}
            data-oid="944dv:b"
          />
        );

      default:
        return null;
    }
  };

  if (text || subtext) {
    return (
      <div className="loading-content" data-oid="2rvup50">
        {renderSpinner()}
        {text && (
          <p className="loading-text" data-oid="f6i-vnz">
            {text}
          </p>
        )}
        {subtext && (
          <p className="loading-subtext" data-oid=".ktglwi">
            {subtext}
          </p>
        )}
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
  variant?: "spinner" | "dots" | "wave";
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = "加载中...",
  subtext,
  variant = "spinner",
  onCancel,
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay" data-oid="75cm5.c">
      <div className="loading-content" data-oid="2h.ba5.">
        <LoadingSpinner variant={variant} size="lg" data-oid="_zk32j1" />
        <p className="loading-text" data-oid="8j:mn9i">
          {text}
        </p>
        {subtext && (
          <p className="loading-subtext" data-oid="mi2mywq">
            {subtext}
          </p>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: "var(--spacing-2)" }}
            data-oid="z6wkst5"
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
  size?: "sm" | "md";
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = "加载中...",
  // size = 'sm',
  className = "",
}) => {
  return (
    <div className={`loading-inline ${className}`} data-oid="oz72j-g">
      <div className="spinner" data-oid="s08blf5" />
      <span data-oid="je79pax">{text}</span>
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
  className = "",
}) => {
  const isIndeterminate = progress === undefined;

  return (
    <div className={`progress-container ${className}`} data-oid="qutef43">
      {(text || showPercentage) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "var(--spacing-2)",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
          data-oid="t-g83p8"
        >
          {text && <span data-oid="wtxrj7u">{text}</span>}
          {showPercentage && !isIndeterminate && (
            <span data-oid="di2f13x">{progress}%</span>
          )}
        </div>
      )}
      <div
        className={`progress-bar ${isIndeterminate ? "progress-indeterminate" : ""}`}
        data-oid="de7yti0"
      >
        {!isIndeterminate && (
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
            data-oid="x76w:q9"
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
  className = "",
  avatar = false,
}) => {
  const lineVariants = ["long", "medium", "short"];

  return (
    <div className={`skeleton-container ${className}`} data-oid="q:agkiu">
      {avatar && (
        <div
          className="skeleton-circle"
          style={{ marginBottom: "var(--spacing-3)" }}
          data-oid="6-srwa2"
        />
      )}
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`skeleton-line ${lineVariants[index % lineVariants.length]}`}
          data-oid="ybqe7p-"
        />
      ))}
    </div>
  );
};
