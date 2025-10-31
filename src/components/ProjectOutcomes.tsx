import { TrendingUp, Users, DollarSign, BarChart3, Target, Award } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface Outcome {
  label: string;
  value: string;
  icon?: string;
}

interface ProjectOutcomesProps {
  outcomes?: Outcome[];
}

const iconMap: Record<string, typeof TrendingUp> = {
  growth: TrendingUp,
  users: Users,
  revenue: DollarSign,
  metrics: BarChart3,
  target: Target,
  award: Award,
};

export const ProjectOutcomes = ({ outcomes = [] }: ProjectOutcomesProps) => {
  if (!outcomes || outcomes.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Outcomes & Impact</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outcomes.map((outcome, index) => {
          const IconComponent = outcome.icon ? iconMap[outcome.icon] || Target : Target;
          
          return (
            <Card key={index} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{outcome.label}</p>
                    <p className="text-2xl font-bold">{outcome.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
