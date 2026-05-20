import React from "react";
import { Calendar, User, ArrowRight } from "lucide-react";

const posts = [
  {
    title: "The Future of Sustainable Aviation",
    excerpt: "Exploring the latest innovations in electric aircraft and sustainable aviation fuels.",
    author: "Capt. Sarah Johnson",
    date: "April 05, 2024",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Digital Transformation in Airport Operations",
    excerpt: "How AI and IoT are reshaping the passenger experience and operational efficiency.",
    author: "Mark Thompson",
    date: "March 28, 2024",
    image: "https://images.unsplash.com/photo-1473830394358-91588751b241?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Career Paths in Modern Aviation",
    excerpt: "A comprehensive guide to the diverse opportunities in today's aviation industry.",
    author: "Elena Rodriguez",
    date: "March 15, 2024",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800"
  }
];

export default function Blog() {
  return (
    <div className="pt-20">
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
              Latest <span className="text-purple-600">Insights</span> & Updates
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Stay informed with the latest trends, news, and expert perspectives from the aviation world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {posts.map((post, idx) => (
              <article 
                key={idx}
                className="group cursor-pointer"
              >
                <div className="relative h-64 rounded-4xl overflow-hidden mb-6">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      {post.date}
                    </div>
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1.5" />
                      {post.author}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                  <button className="text-purple-600 font-bold text-sm flex items-center space-x-2 group/btn uppercase tracking-widest">
                    <span>Read Article</span>
                    <ArrowRight className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

