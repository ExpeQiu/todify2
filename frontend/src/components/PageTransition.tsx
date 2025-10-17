import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  direction?: 'fade' | 'slide-up' | 'slide-right' | 'scale' | 'rotate';
  duration?: number;
  delay?: number;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isVisible,
  direction = 'fade',
  duration = 300,
  delay = 0,
  className = ''
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setTimeout(() => {
        setAnimationClass(getEnterClass(direction));
      }, 10);
    } else {
      setAnimationClass(getExitClass(direction));
      setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
  }, [isVisible, direction, duration]);

  const getEnterClass = (dir: string) => {
    switch (dir) {
      case 'slide-up':
        return 'translate-y-0 opacity-100';
      case 'slide-right':
        return 'translate-x-0 opacity-100';
      case 'scale':
        return 'scale-100 opacity-100';
      case 'rotate':
        return 'rotate-0 opacity-100';
      default:
        return 'opacity-100';
    }
  };

  const getExitClass = (dir: string) => {
    switch (dir) {
      case 'slide-up':
        return 'translate-y-4 opacity-0';
      case 'slide-right':
        return 'translate-x-4 opacity-0';
      case 'scale':
        return 'scale-95 opacity-0';
      case 'rotate':
        return 'rotate-1 opacity-0';
      default:
        return 'opacity-0';
    }
  };

  const getInitialClass = (dir: string) => {
    switch (dir) {
      case 'slide-up':
        return 'translate-y-4 opacity-0';
      case 'slide-right':
        return 'translate-x-4 opacity-0';
      case 'scale':
        return 'scale-95 opacity-0';
      case 'rotate':
        return 'rotate-1 opacity-0';
      default:
        return 'opacity-0';
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`
        transition-all ease-out
        ${getInitialClass(direction)}
        ${animationClass}
        ${className}
      `}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// 页面容器组件，带有统一的过渡效果
interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <PageTransition
      isVisible={isVisible}
      direction="fade"
      duration={300}
      className={className}
    >
      {children}
    </PageTransition>
  );
};

// 步骤切换动画组件
interface StepTransitionProps {
  children: React.ReactNode;
  currentStep: number;
  direction?: 'forward' | 'backward';
  className?: string;
}

export const StepTransition: React.FC<StepTransitionProps> = ({
  children,
  currentStep,
  direction = 'forward',
  className = ''
}) => {
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (currentStep !== displayStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setDisplayStep(currentStep);
        setIsAnimating(false);
      }, 150);
    }
  }, [currentStep, displayStep]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isAnimating 
            ? direction === 'forward' 
              ? '-translate-x-full opacity-0' 
              : 'translate-x-full opacity-0'
            : 'translate-x-0 opacity-100'
          }
        `}
      >
        {children}
      </div>
    </div>
  );
};

// 卡片翻转动画组件
interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  className?: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  isFlipped,
  className = ''
}) => (
  <div className={`relative w-full h-full perspective-1000 ${className}`}>
    <div
      className={`
        relative w-full h-full transition-transform duration-600 transform-style-preserve-3d
        ${isFlipped ? 'rotate-y-180' : ''}
      `}
    >
      {/* 正面 */}
      <div className="absolute inset-0 w-full h-full backface-hidden">
        {front}
      </div>
      
      {/* 背面 */}
      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
        {back}
      </div>
    </div>
  </div>
);

// 悬浮动画组件
interface FloatingElementProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  direction?: 'vertical' | 'horizontal' | 'circular';
  duration?: number;
  className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  // intensity = 'medium',
  direction = 'vertical',
  duration = 3000,
  className = ''
}) => {
  const getAnimationClass = () => {
    // const intensityMap = {
    //   subtle: '2px',
    //   medium: '4px',
    //   strong: '8px'
    // };
    
    // const distance = intensityMap[intensity];
    
    switch (direction) {
      case 'horizontal':
        return `animate-float-horizontal`;
      case 'circular':
        return `animate-float-circular`;
      default:
        return `animate-float-vertical`;
    }
  };

  return (
    <div
      className={`${getAnimationClass()} ${className}`}
      style={{
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

// 脉冲动画组件
interface PulseElementProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  duration?: number;
  className?: string;
}

export const PulseElement: React.FC<PulseElementProps> = ({
  children,
  color = 'rgba(99, 102, 241, 0.4)',
  intensity = 1.05,
  duration = 2000,
  className = ''
}) => (
  <div
    className={`animate-pulse-custom ${className}`}
    style={{
      animationDuration: `${duration}ms`,
      '--pulse-color': color,
      '--pulse-scale': intensity
    } as React.CSSProperties}
  >
    {children}
  </div>
);

export default PageTransition;