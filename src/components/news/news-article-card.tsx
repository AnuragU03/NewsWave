"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, CheckCircle, Clock, Globe, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  category: string;
  country: string;
  publishedAt: string;
  url: string;
  aiHint?: string; // For placeholder images
}

interface NewsArticleCardProps {
  article: NewsArticle;
}

export default function NewsArticleCard({ article }: NewsArticleCardProps) {
  const { toast } = useToast();
  const { user, updateUser, incrementCategoryClick } = useAuth();

  const handleShare = () => {
    navigator.clipboard.writeText(article.url);
    toast({ title: "Link Copied!", description: "Article link copied to clipboard." });
  };

  const handleVerify = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "Please log in to verify articles." });
      return;
    }
    // Simulate verification
    updateUser({ points: (user.points || 0) + 10 });
    toast({ title: "Article Verified!", description: "You earned 10 points." });
  };

  const handleCardClick = () => {
    if (user) {
      incrementCategoryClick(article.category);
    }
    // Potentially navigate to article.url or an internal article view page
    window.open(article.url, '_blank');
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg h-full">
      <div className="relative w-full h-48 cursor-pointer" onClick={handleCardClick}>
        <Image 
          src={article.imageUrl} 
          alt={article.title} 
          layout="fill" 
          objectFit="cover" 
          data-ai-hint={article.aiHint || "news article"}
        />
      </div>
      <CardHeader className="cursor-pointer" onClick={handleCardClick}>
        <CardTitle className="text-xl font-headline leading-tight hover:text-primary transition-colors">{article.title}</CardTitle>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
          <span className="flex items-center"><Clock size={12} className="mr-1" /> {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
          <span className="flex items-center"><Tag size={12} className="mr-1" /> {article.category}</span>
          <span className="flex items-center"><Globe size={12} className="mr-1" /> {article.country}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow cursor-pointer" onClick={handleCardClick}>
        <CardDescription>{article.summary}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share article">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        <Button variant="outline" size="sm" onClick={handleVerify} aria-label="Verify article accuracy">
          <CheckCircle className="mr-2 h-4 w-4" /> Verify
        </Button>
      </CardFooter>
    </Card>
  );
}