import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { BLOG_POSTS } from "@/data/blogPosts";
import { EditorialCtaBanner } from "@/components/seo/EditorialCtaBanner";

export const metadata: Metadata = {
  title: "Kredibly Blog — Social Commerce & Online Store Guides for Nigeria",
  description:
    "Practical guides for Nigerian online sellers on WhatsApp selling, Instagram shops, accepting online payments, and growing organic traffic.",
  alternates: {
    canonical: "https://usekredibly.com/blog",
  },
  openGraph: {
    title: "Kredibly Blog — Social Commerce Guides for Nigerian Sellers",
    description:
      "Learn how to sell on Instagram and WhatsApp, accept online payments, and grow your online store in Nigeria.",
    url: "https://usekredibly.com/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const breadcrumbJsonLd = {
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
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#090D16] selection:bg-[#2e1065] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="sticky top-0 z-40 border-b border-[#DADDD4] bg-[#FAF9F5]/95 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/krediblyrevamped.png"
              alt="Kredibly"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-[#5A6577]">
            <Link href="/#pricing" className="hidden hover:text-[#090D16] sm:inline">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-[#090D16]">
              Log in
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

      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DADDD4] bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#2e1065]">
            <BookOpen className="h-3.5 w-3.5" />
            Kredibly Guides
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#090D16] sm:text-5xl">
            Grow your online store in Nigeria.
          </h1>
          <p className="mt-4 text-base text-[#5A6577] sm:text-lg">
            Practical playbooks for WhatsApp vendors, Instagram brands, and small businesses selling online.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-[#DADDD4] bg-white p-6 transition-colors hover:border-[#2e1065]"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#2e1065]">
                  <span>{post.category}</span>
                  <span className="text-[#5A6577]">{post.readTime}</span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-[#090D16] group-hover:text-[#2e1065] transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#5A6577]">
                  {post.description}
                </p>
              </div>
              <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#2e1065]">
                <span>Read article</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <EditorialCtaBanner />
        </div>
      </main>
    </div>
  );
}
