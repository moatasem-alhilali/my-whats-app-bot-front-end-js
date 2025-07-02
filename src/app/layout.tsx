import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhatsApp Dashboard",
  description:
    "Manage WhatsApp sessions and send messages with GitHub-inspired dark UI",
};

function Navigation() {
  return (
    <nav className="bg-[#161b22] border-b border-[#21262d] sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <h1 className="text-xl font-semibold text-white">
                WhatsApp Dashboard
              </h1>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              <Link
                href="/setup"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#21262d] transition-all duration-200"
              >
                🔗 Setup
              </Link>
              <Link
                href="/status"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#21262d] transition-all duration-200"
              >
                📊 Status
              </Link>
              <Link
                href="/send"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#21262d] transition-all duration-200"
              >
                💬 Messages
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* API Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400 font-mono">
                API: localhost:3001
              </span>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#21262d] transition-colors"
              aria-label="Open mobile navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#21262d] border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full animate-spin mx-auto"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <p className="text-gray-400 font-medium">Loading Dashboard...</p>
        <div className="mt-2 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-[#161b22] border-t border-[#21262d] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              WhatsApp Dashboard
            </h3>
            <p className="text-sm text-gray-400">
              Modern dashboard for managing WhatsApp sessions with
              GitHub-inspired design.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/setup"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Setup Session
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  View Status
                </Link>
              </li>
              <li>
                <Link
                  href="/send"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Send Messages
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">API Info</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-400">
                Backend: Node.js + Express
              </li>
              <li className="text-sm text-gray-400">
                Frontend: Next.js + TypeScript
              </li>
              <li className="text-sm text-gray-400">
                API: http://localhost:3001
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#21262d] mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400">
            Built with ❤️ using whatsapp-web.js and modern web technologies
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#0d1117] min-h-screen flex flex-col`}
      >
        <div className="grid-pattern flex-1">
          <Navigation />
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
