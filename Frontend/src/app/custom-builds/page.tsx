import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomBuildSection } from "@/components/landing/CustomBuildSection";

export const metadata = {
  title: "Custom Builds & Bespoke Commerce | Akinbyte Technologies",
  description:
    "Request a custom e-commerce website, bespoke checkout integration, or dedicated brand platform from Akinbyte Technologies Limited.",
};

export default function CustomBuildsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4FC] text-[#090D16]">
      <header className="border-b border-[#DADDD4] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <img
              src="/krediblyrevamped.png"
              alt="Kredibly"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2e1065] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Kredibly</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <CustomBuildSection />
      </main>

      <footer className="border-t border-[#DADDD4] bg-[#F3F4EF] py-6 text-center text-[11.5px] text-[#525B6C]">
        © {new Date().getFullYear()} Akinbyte Technologies Limited (RC: 9466327). All rights reserved.
      </footer>
    </div>
  );
}
