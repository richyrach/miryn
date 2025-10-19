import { BadgeCheck } from "lucide-react";

interface VerifiedCheckmarkProps {
  roles: string[];
  size?: 'sm' | 'md' | 'lg';
}

export const VerifiedCheckmark = ({ roles, size = 'md' }: VerifiedCheckmarkProps) => {
  const hasVerified = roles.includes('verified');
  const hasDeveloper = roles.includes('developer');
  
  if (!hasVerified && !hasDeveloper) return null;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span className="inline-flex items-center gap-1">
      {hasVerified && (
        <span title="Verified - 100+ followers">
          <BadgeCheck 
            className={`${sizeClasses[size]} text-blue-500`} 
            fill="currentColor"
          />
        </span>
      )}
      {hasDeveloper && (
        <span title="Developer">
          <BadgeCheck 
            className={`${sizeClasses[size]} text-yellow-500`} 
            fill="currentColor"
          />
        </span>
      )}
    </span>
  );
};
