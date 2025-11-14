import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle2, Package } from "lucide-react";

export interface Provider {
  id: number;
  brandName: string;
  about: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  logoUrl: string;
  featuredProducts?: number;
}

interface ProviderCardProps {
  provider: Provider;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border">
      <div className="relative h-48 bg-gradient-hero">
        <img 
          src={provider.logoUrl} 
          alt={provider.brandName}
          className="w-full h-full object-cover"
        />
        {provider.verified && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-display font-bold mb-2">{provider.brandName}</h3>
        
        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-medium text-foreground">{provider.rating}</span>
            <span>({provider.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{provider.city}, {provider.state}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {provider.about}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{provider.featuredProducts} products</span>
          </div>
          
          <Link to={`/marketplace/provider/${provider.id}`}>
            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;
