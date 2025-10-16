import { Badge } from "./ui/badge";
import { Shield, Star, Crown, FileCheck, AlertCircle, HeadphonesIcon, Handshake, BadgeCheck, Code, Heart, Sparkles } from "lucide-react";

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  if (role === 'user' || !role) return null;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Owner',
          icon: Crown,
          className: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0',
          description: 'Full site control'
        };
      case 'admin':
        return {
          label: 'Admin',
          icon: Shield,
          className: 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-0',
          description: 'Can ban users & manage content'
        };
      case 'moderator':
        return {
          label: 'Mod',
          icon: Star,
          className: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0',
          description: 'Can warn & moderate content'
        };
      case 'partner':
        return {
          label: 'Partner',
          icon: Handshake,
          className: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0',
          description: 'Official platform partner'
        };
      case 'verified':
        return {
          label: 'Verified',
          icon: BadgeCheck,
          className: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-0',
          description: 'Verified user'
        };
      case 'developer':
        return {
          label: 'Developer',
          icon: Code,
          className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
          description: 'Platform developer'
        };
      case 'early_supporter':
        return {
          label: 'Early Supporter',
          icon: Heart,
          className: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-0',
          description: 'Early supporter of the platform'
        };
      case 'vip':
        return {
          label: 'VIP',
          icon: Sparkles,
          className: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0',
          description: 'VIP member'
        };
      case 'content_mod':
        return {
          label: 'Content Mod',
          icon: FileCheck,
          className: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0',
          description: 'Can delete projects & services'
        };
      case 'junior_mod':
        return {
          label: 'Junior Mod',
          icon: AlertCircle,
          className: 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-0',
          description: 'Can issue warnings'
        };
      case 'support':
        return {
          label: 'Support',
          icon: HeadphonesIcon,
          className: 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-0',
          description: 'Can view reports & help users'
        };
      default:
        return null;
    }
  };

  const config = getRoleConfig(role);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge 
      className={`text-xs flex items-center gap-1 ${config.className}`}
      title={config.description}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};
