import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BLOG_POSTS, getBlogPostBySlug } from "@/data/blogPosts";
import { EditorialCtaBanner } from "@/components/seo/EditorialCtaBanner";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    return {
      title: "Article Not Found — Kredibly Blog",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `https://usekredibly.com/blog/${post.slug}`;
  return {
    title: `${post.title} | Kredibly Blog`,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonical,
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const canonical = `https://usekredibly.com/blog/${post.slug}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://usekredibly.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://usekredibly.com/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      author: {
        "@type": "Organization",
        name: post.author,
      },
      publisher: {
        "@type": "Organization",
        name: "Kredibly",
        url: "https://usekredibly.com",
      },
      mainEntityOfPage: canonical,
    },
  ];

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#090D16] selection:bg-[#2e1065] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="sticky top-0 z-40 border-b border-[#DADDD4] bg-[#FAF9F5]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/krediblyrevamped.png"
              alt="Kredibly"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-[#5A6577]">
            <Link href="/blog" className="hover:text-[#090D16]">
              All Guides
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2e1065] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b0764] transition-colors"
            >
              Start Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A6577] hover:text-[#2e1065] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Kredibly Blog</span>
        </Link>

        <article className="mt-6">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#2e1065]">
            <span>{post.category}</span>
            <span className="text-[#DADDD4]">•</span>
            <span className="text-[#5A6577]">{post.readTime}</span>
            <span className="text-[#DADDD4]">•</span>
            <time dateTime={post.publishedAt} className="text-[#5A6577]">
              {post.publishedAt}
            </time>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#090D16] sm:text-4xl sm:leading-[1.15]">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#5A6577] sm:text-lg">
            {post.description}
          </p>

          <div className="mt-10 space-y-8 border-t border-[#DADDD4] pt-8">
            {post.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="text-xl font-bold text-[#090D16]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((p) => (
                  <p key={p} className="text-base leading-relaxed text-[#334155]">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#334155]">
                    {section.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

        <div className="mt-12">
          <EditorialCtaBanner
            heading="Put this into practice in 2 minutes."
            description="Create your free Kredibly storefront, upload 3 products, and start accepting online orders via Nomba."
            ctaLabel="Start Your Free Store"
            secondaryHref={post.relatedGuideHref}
            secondaryLabel={post.relatedGuideLabel}
          />
        </div>

        <section className="mt-14 border-t border-[#DADDD4] pt-10">
          <h2 className="text-base font-bold text-[#090D16]">
            More guides from Kredibly
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {otherPosts.map((other) => (
              <Link
                key={other.slug}
                href={`/blog/${other.slug}`}
                className="rounded-xl border border-[#DADDD4] bg-white p-4 hover:border-[#2e1065] transition-colors"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2e1065]">
                  {other.category}
                </p>
                <p className="mt-1.5 text-sm font-bold text-[#090D16]">
                  {other.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
