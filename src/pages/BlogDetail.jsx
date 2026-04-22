import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api/client";

export default function BlogDetail() {
  const { id: postId } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", postId],
    queryFn: async () => {
      const posts = await apiClient.entities.BlogPost.filter({ id: postId });
      return posts[0] || null;
    },
    enabled: Boolean(postId),
  });

  if (isLoading || !post) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-6 py-20 lg:px-12">
        <div className="mb-4 h-5 w-32 rounded bg-secondary" />
        <div className="mb-6 h-12 w-full rounded bg-secondary" />
        <div className="mb-10 aspect-[1.6] rounded-[2rem] bg-secondary" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FBF7F1] pb-16">
      <section className="border-b border-[#EEE2D6] bg-marble-light py-14">
        <div className="mx-auto max-w-4xl px-6 lg:px-12">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-stone"
          >
            <ChevronLeft className="h-4 w-4" />
            Вернуться в блог
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {post.created_date && format(new Date(post.created_date), "dd MMMM yyyy")}
            </span>
            {post.category && <Badge variant="outline">{post.category}</Badge>}
          </div>

          <h1 className="mt-6 font-serif text-[2.8rem] leading-[0.98] text-stone md:text-[4rem]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 max-w-2xl text-sm leading-8 text-muted-foreground md:text-[15px]">
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-10 lg:px-12">
        {post.cover_image && (
          <div className="premium-panel mb-8 overflow-hidden p-4">
            <div className="overflow-hidden rounded-[1.8rem] bg-[#F5EEE6]">
              <img
                src={post.cover_image}
                alt={post.title}
                className="h-full max-h-[520px] w-full object-cover"
              />
            </div>
          </div>
        )}

        <article className="premium-panel px-6 py-8 md:px-10 md:py-10">
          <div className="markdown-premium">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>
      </section>
    </div>
  );
}
