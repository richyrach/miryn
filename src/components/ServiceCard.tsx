import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";

interface ServiceCardProps {
  id: string;
  title: string;
  category: string;
  pricing_type: string;
  price_amount?: number;
  currency?: string;
  delivery_time?: number;
  description: string;
}

export const ServiceCard = ({
  id,
  title,
  category,
  pricing_type,
  price_amount,
  currency = 'USD',
  delivery_time,
  description,
}: ServiceCardProps) => {
  return (
    <Link to={`/services/${id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
            <Badge variant="secondary" className="shrink-0">{category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-primary">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">
                {pricing_type === 'fixed' && price_amount 
                  ? `${currency} ${price_amount}`
                  : pricing_type === 'hourly' && price_amount
                  ? `${currency} ${price_amount}/hr`
                  : 'Custom'}
              </span>
            </div>
            
            {delivery_time && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{delivery_time} days</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
