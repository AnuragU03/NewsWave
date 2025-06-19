
"use client";

import React, { useState } from 'react'; // Ensured React and useState are imported
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ShieldQuestion, ShieldCheck, ExternalLink } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';
import type { Article as NewsArticle } from '@/services/newsService';

interface NewsArticleCardProps {
  article: NewsArticle;
}

export default function NewsArticleCard({ article }: NewsArticleCardProps) {
  const { toast } = useToast();
  const { user, updateUser, incrementCategoryClick } = useAuth();
  const [isVerified, setIsVerified] = useState(article.verified || false); 

  const handleShare = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "Please log in to share articles." });
      return;
    }
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
    const newVerificationStatus = !isVerified;
    setIsVerified(newVerificationStatus); 
    if (newVerificationStatus) { 
      updateUser({ points: (user.points || 0) + 10 });
      toast({ title: "Article Verified!", description: "You earned 10 points." });
    } else { 
       updateUser({ points: Math.max(0, (user.points || 0) - 10) }); 
       toast({ title: "Verification Removed", description: "Points adjusted." });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a[target="_blank"]')) {
      return;
    }
    if (user && article.category) { 
      incrementCategoryClick(article.category);
    }
    if (article.url) {
      window.open(article.url, '_blank');
    }
  };
  
  let displayDate = 'Unknown date';
  if (article.publishedAt) {
    try {
      displayDate = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
    } catch (e) {
      console.warn("Could not parse date:", article.publishedAt);
    }
  }

  return (
    <Card 
      className="neu-brutal bg-card text-card-foreground p-4 flex flex-col h-full cursor-pointer hover:shadow-neubrutal-hover active:shadow-neubrutal-active transition-all duration-100"
      onClick={handleCardClick}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="bg-newsmania-purple text-black neu-brutal text-xs px-2 py-1 font-medium">
          {article.category || 'General'}
        </span>
        <span className="bg-newsmania-blue text-black neu-brutal text-xs px-2 py-1 font-medium">
          {article.source || 'Unknown Source'}
        </span>
        {isVerified ? (
           <span className="bg-newsmania-green text-black neu-brutal text-xs px-2 py-1 font-medium flex items-center gap-1">
             <ShieldCheck size={14} /> Verified
           </span>
        ) : (
           <span className="bg-newsmania-yellow text-black neu-brutal text-xs px-2 py-1 font-medium flex items-center gap-1">
             <ShieldQuestion size={14} /> Unverified
           </span>
        )}
      </div>
      
      {/* 
      <div className="relative w-full h-48 mb-4 neu-brutal overflow-hidden">
        <Image 
          src={displayImageUrl} 
          alt={article.title} 
          layout="fill" 
          objectFit="cover"
          className="bg-muted"
          data-ai-hint={article.aiHint || "news media"}
        />
      </div>
      */}
      
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-lg md:text-xl font-bold leading-tight line-clamp-3">{article.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 mb-3 flex-grow">
        <CardDescription className="text-sm line-clamp-4">{article.summary}</CardDescription>
      </CardContent>
      
      <CardFooter className="p-0 flex flex-col sm:flex-row justify-between items-start sm:items-center mt-auto gap-3">
        <span className="text-xs text-muted-foreground">{displayDate}</span>
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleVerify(); }}
            className={`neu-brutal neu-brutal-hover neu-brutal-active px-3 py-1 text-xs font-semibold ${isVerified ? 'bg-newsmania-green text-black' : 'bg-newsmania-yellow text-black'}`}
          >
            {isVerified ? <ShieldCheck size={14} className="mr-1" /> : <ShieldQuestion size={14} className="mr-1" />}
            {isVerified ? 'Verified' : 'Verify'}
          </Button>
          
          <Button 
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="neu-brutal bg-newsmania-blue text-black neu-brutal-hover neu-brutal-active px-3 py-1 text-xs font-semibold"
            disabled={!article.url}
          >
            <Share2 size={14} className="mr-1" /> Share
          </Button>
          
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} 
            className="inline-flex items-center justify-center neu-brutal bg-newsmania-pink text-black neu-brutal-hover neu-brutal-active px-3 py-1 text-xs font-semibold rounded-md" 
          >
            Read <ExternalLink size={14} className="ml-1" />
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
