"use client";

import StickyNav from "@/components/sticky-nav";

export default function AboutPage() {
  return (
    <>
      <StickyNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400">SmolBoards</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Revolutionizing the way you interact with technology through innovative solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                At SmolBoards, we believe in creating powerful, intuitive experiences that bridge the gap between complex technology and everyday users. Our mission is to simplify without compromising functionality.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We're building the future of interactive platforms, one innovation at a time. Stay tuned for something extraordinary.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-white mb-4">Coming Soon</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  Revolutionary user interface
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                  Advanced customization options
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  Seamless integration capabilities
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                  Community-driven features
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}