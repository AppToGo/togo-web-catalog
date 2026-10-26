import type { Metadata } from "next";
import { DirectoryLanding, landingMetadata } from "../landing";

type Params = Promise<{ city: string; category: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return landingMetadata(await params);
}

export default async function CityCategoryPage({ params }: { params: Params }) {
  return DirectoryLanding(await params);
}
