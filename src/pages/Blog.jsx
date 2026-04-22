import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHero from "@/components/layout/PageHero";
import { apiClient } from "@/services/api/client";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export default function Blog() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => apiClient.entities.BlogPost.filter({ published: true }, "-created_date", 50),
    initialData: [],
  });

  const featuredPost = posts[0] || null;
  const secondaryPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div>
      <PageHero
        eyebrow="Блог"
        title="Экспертные материалы о формулах, уходе и профессиональной эстетике"
        description="Здесь мы собираем статьи, которые поддерживают доверие к бренду и помогают клиенту понимать, что именно он выбирает."
      />

      <section className="page-section py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          {isLoading ? (
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="premium-card animate-pulse p-4">
                <div className="aspect-[1.35] rounded-[1.7rem] bg-[#F4EEE7]" />
              </div>
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="premium-card animate-pulse p-4">
                    <div className="h-28 rounded-[1.2rem] bg-[#F4EEE7]" />
                  </div>
                ))}
              </div>
            </div>
          ) : featuredPost ? (
            <>
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <motion.article {...reveal} className="premium-card overflow-hidden p-4">
                  <Link to={`/blog/${featuredPost.id}`} className="group block">
                    <div className="aspect-[1.35] overflow-hidden rounded-[1.8rem] bg-[#F5EEE6]">
                      {featuredPost.cover_image ? (
                        <img
                          src={featuredPost.cover_image}
                          alt={featuredPost.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-serif text-6xl text-muted-foreground/20">
                          Y
                        </div>
                      )}
                    </div>
                    <div className="px-2 pb-2 pt-5">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {featuredPost.created_date &&
                            format(new Date(featuredPost.created_date), "dd.MM.yyyy")}
                        </span>
                        {featuredPost.category && (
                          <span className="rounded-full border border-[#E5D0B1] bg-[#FBF1E4] px-3 py-1 text-[#7A613E]">
                            {featuredPost.category}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-4 font-serif text-[2.3rem] leading-[0.98] text-stone">
                        {featuredPost.title}
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground">
                        {featuredPost.excerpt}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm text-[#8A6B48] transition-all group-hover:gap-3">
                        Читать статью
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.article>

                <div className="grid gap-4">
                  {secondaryPosts.slice(0, 3).map((post, index) => (
                    <motion.article
                      key={post.id}
                      {...reveal}
                      transition={{ ...reveal.transition, delay: index * 0.06 }}
                      className="premium-card p-4"
                    >
                      <Link to={`/blog/${post.id}`} className="grid gap-4 md:grid-cols-[140px_1fr]">
                        <div className="overflow-hidden rounded-[1.2rem] bg-[#F5EEE6]">
                          {post.cover_image ? (
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              className="h-full min-h-[120px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[120px] w-full items-center justify-center font-serif text-4xl text-muted-foreground/20">
                              Y
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5" />
                              {post.created_date &&
                                format(new Date(post.created_date), "dd.MM.yyyy")}
                            </span>
                            {post.category && <span>{post.category}</span>}
                          </div>
                          <h3 className="mt-3 font-serif text-[1.55rem] leading-[1.02] text-stone">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {post.excerpt}
                          </p>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              </div>

              {secondaryPosts.length > 3 && (
                <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {secondaryPosts.slice(3).map((post, index) => (
                    <motion.article
                      key={post.id}
                      {...reveal}
                      transition={{ ...reveal.transition, delay: index * 0.05 }}
                      className="premium-card p-4"
                    >
                      <Link to={`/blog/${post.id}`} className="group block">
                        <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#F5EEE6]">
                          {post.cover_image ? (
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-serif text-5xl text-muted-foreground/20">
                              Y
                            </div>
                          )}
                        </div>
                        <div className="pt-4">
                          <p className="text-xs text-muted-foreground">
                            {post.created_date &&
                              format(new Date(post.created_date), "dd.MM.yyyy")}
                          </p>
                          <h3 className="mt-3 font-serif text-[1.5rem] leading-[1.04] text-stone">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {post.excerpt}
                          </p>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="premium-panel px-8 py-14 text-center">
              <p className="font-serif text-[2rem] text-stone">Статьи скоро появятся</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Когда контент будет опубликован, блог станет ещё одной точкой доверия к бренду и
                его экспертности.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
