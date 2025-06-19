
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, CheckCircle, Clock, Globe, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';
import type { Article as NewsArticle } from '@/services/newsService'; // Ensure this matches definition

interface NewsArticleCardProps {
  article: NewsArticle;
}

export default function NewsArticleCard({ article }: NewsArticleCardProps) {
  const { toast } = useToast();
  const { user, updateUser, incrementCategoryClick } = useAuth();

  const handleShare = () => {
    if (navigator.clipboard && article.url) {
      navigator.clipboard.writeText(article.url);
      toast({ title: "Link Copied!", description: "Article link copied to clipboard." });
    } else {
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy link." });
    }
  };

  const handleVerify = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "Please log in to verify articles." });
      return;
    }
    // Ensure user.points is initialized if it's undefined
    const currentPoints = user.points || 0;
    updateUser({ points: currentPoints + 10 });
    toast({ title: "Article Verified!", description: "You earned 10 points." });
  };

  const handleCardClick = () => {
    if (user && article.category) { 
      incrementCategoryClick(article.category);
    }
    if (article.url) {
      window.open(article.url, '_blank');
    }
  };

  // const displayImageUrl = article.imageUrl || "https://placehold.co/600x400.png";

  return (
    // Card with flex layout: md:flex-row for side-by-side on medium screens and up, flex-col for stacked on small screens
    <Card className="flex flex-col md:flex-row overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg h-full">
      {/* Image Section - Temporarily Disabled
      <div 
        className="relative w-full md:w-48 lg:w-56 xl:w-64 h-48 md:h-auto flex-shrink-0 cursor-pointer" // md:h-auto ensures image height can grow with card if needed, flex-shrink-0 prevents image from shrinking
        onClick={handleCardClick}
      >
        <Image 
          src={displayImageUrl} 
          alt={article.title} 
          layout="fill" 
          objectFit="cover" 
          className="md:rounded-l-lg md:rounded-r-none rounded-t-lg" // Adjust rounding for side-by-side layout
          data-ai-hint={article.aiHint || "news article"}
        />
      </div>
      */}

      {/* Content Section */}
      {/* flex-grow allows this section to take remaining space, p-4 for padding, justify-between for vertical spacing */}
      <div className="flex flex-col flex-grow p-4 justify-between">
        <div>
          <CardHeader className="p-0 cursor-pointer" onClick={handleCardClick}>
            <CardTitle className="text-xl font-headline leading-tight hover:text-primary transition-colors">{article.title}</CardTitle>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
              {article.publishedAt && <span className="flex items-center"><Clock size={12} className="mr-1" /> {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>}
              {article.category && <span className="flex items-center"><Tag size={12} className="mr-1" /> {article.category}</span>}
              {article.country && <span className="flex items-center"><Globe size={12} className="mr-1" /> {article.country}</span>}
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0 mt-3 cursor-pointer" onClick={handleCardClick}>
            {/* line-clamp ensures summary doesn't overflow, adjust md:line-clamp-4 as needed */}
            <CardDescription className="line-clamp-3 md:line-clamp-4">{article.summary}</CardDescription>
          </CardContent>
        </div>
        <CardFooter className="flex justify-between items-center p-0 mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share article" disabled={!article.url}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleVerify} aria-label="Verify article accuracy">
            <CheckCircle className="mr-2 h-4 w-4" /> Verify
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

