import React, { useEffect, useState } from "react";
import { Instagram, Heart, MessageCircle, ArrowRight, PlayCircle } from "lucide-react";
import apiClient from "../../services/apiClient";

type InstagramPost = {
  id: number;
  type: "post" | "reel";
  author: string;
  handle: string;
  date: string;
  caption: string;
  image: string;
  link: string;
  likes: number;
  comments: number;
};

const sampleFeed: InstagramPost[] = [
  {
    id: 1,
    type: "post",
    author: "ARMZ Aviation",
    handle: "armzaviation",
    date: "Jun 10, 2026",
    caption: "New batch of aviation trainees landed today! Excited to welcome the next generation of pilots and ground staff.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    link: "https://instagram.com/armzaviation",
    likes: 1424,
    comments: 78,
  },
  {
    id: 2,
    type: "reel",
    author: "ARMZ Aviation",
    handle: "armzaviation",
    date: "Jun 05, 2026",
    caption: "Reel drop: inside our runway briefing and student simulation session. The future of aviation careers starts here.",
    image: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1200&q=80",
    link: "https://instagram.com/armzaviation",
    likes: 1987,
    comments: 112,
  },
  {
    id: 3,
    type: "reel",
    author: "ARMZ Aviation",
    handle: "armzaviation",
    date: "May 28, 2026",
    caption: "A moment from our alumni meet-up: aviation mentors, recruiters, and students sharing real success stories.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    link: "https://instagram.com/armzaviation",
    likes: 875,
    comments: 54,
  },
];

export default function Blog() {
  const [posts, setPosts] = useState<InstagramPost[]>(sampleFeed);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    async function fetchInstagramFeed() {
      try {
        const response = await apiClient.get<InstagramPost[]>("/social/instagram-feed");
        if (Array.isArray(response.data) && response.data.length > 0) {
          setPosts(response.data);
        } else {
          setUsingSample(true);
        }
      } catch (error) {
        setUsingSample(true);
      } finally {
        setLoading(false);
      }
    }

    fetchInstagramFeed();
  }, []);

  return (
    <div className="pt-20">
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
              Latest <span className="text-purple-600">Instagram</span> Feed
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Sample feed for Instagram posts and reels. Replace the API endpoint with your real Instagram source later.
            </p>
          </div>

          {usingSample && !loading ? (
            <div className="mx-auto mb-12 max-w-3xl rounded-3xl border border-dashed border-slate-300/70 bg-slate-50 px-6 py-5 text-center text-sm text-slate-600">
              Using sample Instagram cards for now. The real feed will appear once the Instagram API is connected.
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(loading ? sampleFeed : posts).map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(15,23,42,0.12)]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      Instagram
                    </div>
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                  {post.type === "reel" ? (
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg">
                        <PlayCircle className="h-4 w-4" />
                        Reel
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{post.author}</p>
                      <p className="text-xs text-slate-500">@{post.handle} · {post.date}</p>
                    </div>
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 text-sm font-semibold hover:text-purple-800"
                    >
                      View
                    </a>
                  </div>
                  <p className="text-slate-600 leading-relaxed line-clamp-3">{post.caption}</p>
                  <div className="flex items-center justify-between text-slate-500 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-4 w-4 text-rose-500" /> {post.likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" /> {post.comments}
                      </span>
                    </div>
                    <button className="inline-flex items-center gap-2 text-purple-600 font-semibold">
                      <span>Open Post</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

