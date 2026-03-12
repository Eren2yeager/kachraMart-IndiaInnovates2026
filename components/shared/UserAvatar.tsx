'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { USER_ROLES } from '@/config/constants';
import { UserRole } from '@/types';

interface UserAvatarProps {
  name: string;
  image?: string;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function UserAvatar({ name, image, role, size = 'md' }: UserAvatarProps) {
  const initials = getInitials(name);
  const roleColor = role ? USER_ROLES[role].color : '#3b82f6';

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={image} alt={name} />
      <AvatarFallback style={{ backgroundColor: `${roleColor}20`, color: roleColor }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
