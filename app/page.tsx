import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import HomePageContent from "@/components/home/HomePageContent";

export const metadata: Metadata = generatePageMetadata(
  "Home",
  "Transform city waste into a transparent, trackable resource stream. AI-powered circular waste management platform connecting citizens, collectors, recyclers, and administrators.",
  "/"
);

export default function HomePage() {
  return <HomePageContent />;
}
