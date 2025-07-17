import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp Dashboard",
  description: "Modern WhatsApp messaging dashboard with multi-session support",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-github-canvas text-github-fg-default antialiased">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 border-b border-github-border-default bg-github-canvas-subtle/80 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-lg flex items-center justify-center text-white font-bold text-xl logo-glow">
                    W
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#238636] to-[#2ea043] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-semibold bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] bg-clip-text text-transparent">
                    WhatsApp Dashboard
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-github-fg-muted">
                    <div className="w-2 h-2 bg-[#238636] rounded-full status-pulse"></div>
                    API Connected
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:space-x-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>🏠</span>
                  Dashboard
                </Link>
                <a
                  href="/realtime"
                  className="px-4 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>⚡</span>
                  Real-time
                </a>
                <a
                  href="/messaging"
                  className="px-4 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>💬</span>
                  Messaging
                </a>
               
                <a
                  href="/setup"
                  className="px-4 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>➕</span>
                  Setup
                </a>
                <a
                  href="/send"
                  className="px-4 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>💬</span>
                  Send
                </a>
                <a
                  href="/status"
                  className="px-4 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>📊</span>
                  Status
                </a>
                <a
                  href="http://localhost:3001/api-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>📚</span>
                  API Docs
                  <span className="text-xs">↗</span>
                </a>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1f6feb] transition-all duration-200"
                  aria-controls="mobile-menu"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  <span className="text-xl">☰</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-github-border-muted bg-github-canvas-inset/50 backdrop-blur-sm">
              <Link
                href="/"
                className="block px-3 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>🏠</span>
                Dashboard
              </Link>
              <a
                href="/realtime"
                className="block px-3 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>⚡</span>
                Real-time
              </a>
              <a
                href="/messaging"
                className="block px-3 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>💬</span>
                Messaging
              </a>
              <a
                href="/socket-test"
                className="block px-3 py-2 text-sm font-medium text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>🔌</span>
                Socket Test
              </a>
              <a
                href="/setup"
                className="block px-3 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>➕</span>
                Setup
              </a>
              <a
                href="/send"
                className="block px-3 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>💬</span>
                Send
              </a>
              <a
                href="/status"
                className="block px-3 py-2 text-sm font-medium text-github-fg-default hover:text-[#1f6feb] hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>📊</span>
                Status
              </a>
              <a
                href="http://localhost:3001/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-sm font-medium text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset rounded-md transition-all duration-200 flex items-center gap-2"
              >
                <span>📚</span>
                API Documentation
                <span className="text-xs">↗</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-github-border-default bg-github-canvas-inset">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-github-fg-default mb-4">
                  WhatsApp Dashboard
                </h3>
                <p className="text-sm text-github-fg-muted mb-4">
                  Modern multi-session WhatsApp messaging interface built with
                  Next.js and whatsapp-web.js
                </p>
                <div className="flex items-center gap-2 text-xs text-github-fg-subtle">
                  <div className="w-2 h-2 bg-[#238636] rounded-full animate-pulse"></div>
                  <span>v1.0.0 • Ready to use</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-github-fg-default mb-4">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <a
                    href="/setup"
                    className="block text-sm text-github-fg-muted hover:text-[#1f6feb] transition-colors duration-200"
                  >
                    Create Session
                  </a>
                  <a
                    href="/send"
                    className="block text-sm text-github-fg-muted hover:text-[#1f6feb] transition-colors duration-200"
                  >
                    Send Messages
                  </a>
                  <a
                    href="/status"
                    className="block text-sm text-github-fg-muted hover:text-[#1f6feb] transition-colors duration-200"
                  >
                    Monitor Sessions
                  </a>
                  <a
                    href="http://localhost:3001/api-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-github-fg-muted hover:text-[#1f6feb] transition-colors duration-200"
                  >
                    API Documentation ↗
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-github-fg-default mb-4">
                  Technical Stack
                </h3>
                <div className="space-y-2 text-sm text-github-fg-muted">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#1f6feb] rounded-full"></span>
                    <span>Next.js 15 + TypeScript</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#238636] rounded-full"></span>
                    <span>Node.js + Express</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#f85149] rounded-full"></span>
                    <span>whatsapp-web.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#8b5cf6] rounded-full"></span>
                    <span>Tailwind CSS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-github-border-muted">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs text-github-fg-subtle">
                  Built with modern technologies and best practices •
                  GitHub-inspired design
                </p>
                <div className="flex items-center gap-4 text-xs text-github-fg-subtle">
                  <span>Backend: :3001</span>
                  <span>•</span>
                  <span>Frontend: :3000</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
