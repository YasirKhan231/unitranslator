'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowRight, Globe, Zap, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Break Language Barriers Instantly
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Translate any language in seconds. Save your translations, manage notes, and communicate globally with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link href="/login" className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-gray-400 transition">
                Sign In
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <Globe size={40} className="text-gray-900 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">100+ Languages</h3>
              <p className="text-gray-600">Translate between 100+ languages with high accuracy</p>
            </div>

            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <Zap size={40} className="text-gray-900 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Get instant translations in milliseconds</p>
            </div>

            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <Lock size={40} className="text-gray-900 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your translations are encrypted and never shared</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:px-8 lg:px-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to connect with the world?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of users who translate daily with UniTranslator
          </p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition">
            Start Free Trial
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
