'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-gray-900">
          UniTranslator
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#" className="text-gray-600 hover:text-gray-900 font-medium">
            Features
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 font-medium">
            Pricing
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 font-medium">
            Docs
          </Link>
        </nav>

        {/* Desktop Auth Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-gray-900 font-medium hover:text-gray-700">
            Sign In
          </Link>
          <Link href="/signup" className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 py-4 px-4 space-y-3">
          <Link href="#" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
            Features
          </Link>
          <Link href="#" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
            Pricing
          </Link>
          <Link href="#" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
            Docs
          </Link>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <Link href="/login" className="block text-gray-900 font-medium py-2">
              Sign In
            </Link>
            <Link href="/signup" className="block px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition text-center">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}