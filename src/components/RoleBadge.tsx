import { Badge } from "./ui/badge";
import { Shield, Star, Crown } from "lucide-react";

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  if (role === 'user') return null;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Owner',
          icon: Crown,
          className: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0'
        };
      case 'admin':
        return {
          label: 'Admin',
          icon: Shield,
          className: 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-0'
        };
      case 'moderator':
        return {
          label: 'Mod',
          icon: Star,
          className: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0'
        };
      default:
        return null;
    }
  };

  const config = getRoleConfig(role);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge className={`text-xs flex items-center gap-1 ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};
