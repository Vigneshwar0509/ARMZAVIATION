/**
 * Enhanced Skeleton Loader Components
 * Provides shimmer loading states for better perceived performance
 */

import React from 'react';
import './skeleton.css';

const normalizeDimension = (value: string | number) =>
  typeof value === 'number' ? `${value}px` : value;

const widthClassMap: Record<string, string> = {
  '100%': 'sk-w-full',
  '80%': 'sk-w-80p',
  '70%': 'sk-w-70p',
  '60%': 'sk-w-60p',
  '50%': 'sk-w-50p',
  '40%': 'sk-w-40p',
  '30%': 'sk-w-30p',
  '200px': 'sk-w-200',
  '150px': 'sk-w-150',
  '120px': 'sk-w-120',
  '100px': 'sk-w-100',
  '80px': 'sk-w-80',
  '60px': 'sk-w-60',
  '48px': 'sk-w-48',
  '40px': 'sk-w-40',
  '32px': 'sk-w-32',
};

const heightClassMap: Record<string, string> = {
  '300px': 'sk-h-300',
  '200px': 'sk-h-200',
  '100px': 'sk-h-100',
  '80px': 'sk-h-80',
  '48px': 'sk-h-48',
  '40px': 'sk-h-40',
  '32px': 'sk-h-32',
  '24px': 'sk-h-24',
  '20px': 'sk-h-20',
  '16px': 'sk-h-16',
  '14px': 'sk-h-14',
};

const radiusClassMap: Record<string, string> = {
  '50%': 'sk-r-full',
  '8px': 'sk-r-8',
  '4px': 'sk-r-4',
};

// Base skeleton component
export const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  ...props
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  [key: string]: any;
}) => {
  const normalizedWidth = normalizeDimension(width);
  const normalizedHeight = normalizeDimension(height);
  const widthClass = widthClassMap[normalizedWidth] ?? '';
  const heightClass = heightClassMap[normalizedHeight] ?? '';
  const radiusClass = radiusClassMap[borderRadius] ?? '';

  return (
    <div
      className={`skeleton ${widthClass} ${heightClass} ${radiusClass} ${className}`.trim()}
      {...props}
    />
  );
};

// Text skeleton (multiple lines)
export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => {
  return (
    <div className="text-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="20px"
          width={i === lines - 1 ? '70%' : '100%'}
          className="mb-2"
        />
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton = () => {
  return (
    <div className="card-skeleton">
      <Skeleton height="200px" className="card-image" />
      <div className="card-content">
        <Skeleton height="24px" className="mb-2" />
        <Skeleton height="16px" className="mb-2" width="80%" />
        <Skeleton height="16px" width="60%" className="mb-4" />
        <div className="flex gap-2">
          <Skeleton height="40px" width="100px" borderRadius="8px" />
          <Skeleton height="40px" width="100px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
};

// List skeleton
export const ListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="list-item-skeleton">
          <div className="flex items-center gap-4 pb-4 border-b">
            <Skeleton width="48px" height="48px" borderRadius="50%" />
            <div className="list-item-content">
              <Skeleton height="16px" className="mb-2" width="60%" />
              <Skeleton height="14px" width="80%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="table-skeleton">
      <div className="table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="16px" className="table-cell" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="table-row">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={`${i}-${j}`}
              height="40px"
              className="table-cell"
              width={j === 0 ? '60%' : '100%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Button skeleton
export const ButtonSkeleton = ({
  width = '120px',
  size = 'md',
}: {
  width?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const heights = { sm: '32px', md: '40px', lg: '48px' };
  return <Skeleton height={heights[size]} width={width} borderRadius="8px" />;
};

// Avatar skeleton
export const AvatarSkeleton = ({ size = 48 }: { size?: number }) => {
  return (
    <Skeleton
      width={`${size}px`}
      height={`${size}px`}
      borderRadius="50%"
      className="avatar-skeleton"
    />
  );
};

// Form skeleton
export const FormSkeleton = () => {
  return (
    <div className="form-skeleton">
      <div className="form-group">
        <Skeleton height="16px" width="30%" className="mb-2" />
        <Skeleton height="40px" className="mb-4" />
      </div>
      <div className="form-group">
        <Skeleton height="16px" width="30%" className="mb-2" />
        <Skeleton height="40px" className="mb-4" />
      </div>
      <div className="form-group">
        <Skeleton height="16px" width="30%" className="mb-2" />
        <Skeleton height="100px" />
      </div>
      <div className="flex gap-2 mt-6">
        <Skeleton height="40px" width="100px" borderRadius="8px" />
        <Skeleton height="40px" width="100px" borderRadius="8px" />
      </div>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-header">
        <Skeleton height="32px" width="40%" className="mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card-skeleton">
              <Skeleton height="16px" width="60%" className="mb-2" />
              <Skeleton height="24px" width="80%" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Skeleton height="24px" width="40%" className="mb-4" />
          <Skeleton height="300px" />
        </div>
        <div>
          <Skeleton height="24px" width="40%" className="mb-4" />
          <Skeleton height="300px" />
        </div>
      </div>
    </div>
  );
};

// Profile skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="profile-skeleton">
      <div className="profile-header">
        <AvatarSkeleton size={80} />
        <div className="ml-4">
          <Skeleton height="24px" width="200px" className="mb-2" />
          <Skeleton height="16px" width="150px" />
        </div>
      </div>
      <FormSkeleton />
    </div>
  );
};

// Modal skeleton
export const ModalSkeleton = () => {
  return (
    <div className="modal-skeleton">
      <div className="modal-header">
        <Skeleton height="24px" width="60%" />
      </div>
      <div className="modal-body">
        <TextSkeleton lines={4} />
      </div>
      <div className="modal-footer flex gap-2 justify-end">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
};

// Conditional skeleton wrapper
export const SkeletonWrapper = ({
  isLoading,
  skeleton,
  children,
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) => {
  return isLoading ? <>{skeleton}</> : <>{children}</>;
};
