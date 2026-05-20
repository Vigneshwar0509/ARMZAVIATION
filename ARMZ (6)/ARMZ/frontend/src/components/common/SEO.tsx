import React, { useEffect } from "react";
import { ENV } from "@/src/config/env";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
}

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  const existing = document.head.querySelector(selector);
  if (existing) {
    existing.setAttribute('content', content);
    return;
  }

  const tag = document.createElement('meta');
  tag.setAttribute(attribute, key);
  tag.setAttribute('content', content);
  document.head.appendChild(tag);
};

export default function SEO({ title, description, image }: SEOProps) {
  useEffect(() => {
    const safeDescription = description || 'Premium Aviation Job Portal';
    const safeImage = image || '/src/assets/newlogo.png';
    const fullTitle = `${title} | ${ENV.APP_NAME}`;

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', 'name', 'description', safeDescription);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', safeDescription);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', safeImage);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  }, [title, description, image]);

  return null;
}
