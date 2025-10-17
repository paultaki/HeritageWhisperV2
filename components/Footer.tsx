import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 px-4 mt-8">
      <div className="max-w-7xl mx-auto">
        {/* Beta Badge and Links Container */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600">
            <Link
              href="/terms"
              className="hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/privacy"
              className="hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Beta Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              BETA
            </span>
            <span className="text-sm text-gray-500">Pilot Phase</span>
          </div>
        </div>

        {/* Copyright - subtle and small */}
        <div className="text-center text-xs text-gray-400 mt-4">
          © 2025 Heritage Whisper LLC
        </div>
      </div>
    </footer>
  );
}
