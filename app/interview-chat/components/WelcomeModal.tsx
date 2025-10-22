"use client";

import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, CheckCircle2 } from "lucide-react";

interface WelcomeModalProps {
  userName: string;
  onDismiss: () => void;
}

export function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          height: 'calc(100vh - 80px)',
          maxHeight: '90vh',
        }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 pt-8 sm:pt-12 pb-4">
          {/* Welcome Header */}
          <div className="text-center mb-5 sm:mb-8">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <MessageSquare className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-2 sm:mb-3">
              Welcome, {userName.split(' ')[0]}!
            </h2>
          </div>

          {/* Instructions */}
          <div className="space-y-8 sm:space-y-10">
            <p className="text-2xl sm:text-3xl text-gray-700 leading-relaxed text-center">
              I'm <span className="shimmer-text">Pearl</span>, and I look forward to our conversation. I'll ask you questions about your life over the next 10-15 minutes.
            </p>

            {/* Features - larger text for seniors */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-10 h-10 sm:w-11 sm:h-11 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-0.5">Record or Type</h3>
                  <p className="text-xl sm:text-2xl text-gray-600 leading-tight">Answer with your voice or typing</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-10 h-10 sm:w-11 sm:h-11 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-0.5">Choose Your Path</h3>
                  <p className="text-xl sm:text-2xl text-gray-600 leading-tight">Pick questions that interest you</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-10 h-10 sm:w-11 sm:h-11 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-0.5">Take Your Time</h3>
                  <p className="text-xl sm:text-2xl text-gray-600 leading-tight">Share as much as you'd like</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Button Area - more breathing room */}
        <div className="bg-white border-t border-gray-100 px-6 sm:px-12 py-6 sm:py-8">
          <button
            onClick={onDismiss}
            className="premium-button w-full h-14 sm:h-16 text-lg sm:text-xl font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden cursor-pointer border-none outline-none"
          style={{
            background: 'radial-gradient(65.28% 65.28% at 50% 100%, rgba(251, 146, 60, 0.8) 0%, rgba(251, 146, 60, 0) 100%), linear-gradient(135deg, #D97706 0%, #DC2626 100%)',
          }}
        >
          <div className="points-wrapper absolute inset-0 pointer-events-none z-10">
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
            <i className="point"></i>
          </div>

          <span className="button-inner relative z-20 flex items-center justify-center gap-2">
            Let's Begin
            <svg
              className="arrow-icon"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </span>
        </button>
        </div>
      </div>

      <style jsx>{`
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #D97706 0%,
            #F59E0B 25%,
            #FBBF24 50%,
            #F59E0B 75%,
            #D97706 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
          font-weight: 600;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }

        .premium-button::before,
        .premium-button::after {
          content: "";
          position: absolute;
          transition: all 0.5s ease-in-out;
          z-index: 0;
        }

        .premium-button::before {
          inset: 1px;
          background: linear-gradient(177.95deg, rgba(255, 255, 255, 0.19) 0%, rgba(255, 255, 255, 0) 100%);
          border-radius: calc(0.75rem - 1px);
        }

        .premium-button::after {
          inset: 2px;
          background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(251, 146, 60, 0.8) 0%, rgba(251, 146, 60, 0) 100%), linear-gradient(135deg, #D97706 0%, #DC2626 100%);
          border-radius: calc(0.75rem - 2px);
        }

        .premium-button:active {
          transform: scale(0.95);
        }

        .points-wrapper .point {
          bottom: -10px;
          position: absolute;
          animation: floating-points infinite ease-in-out;
          pointer-events: none;
          width: 2px;
          height: 2px;
          background-color: #fff;
          border-radius: 9999px;
        }

        @keyframes floating-points {
          0% {
            transform: translateY(0);
          }
          85% {
            opacity: 0;
          }
          100% {
            transform: translateY(-55px);
            opacity: 0;
          }
        }

        .points-wrapper .point:nth-child(1) {
          left: 10%;
          opacity: 1;
          animation-duration: 2.35s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(2) {
          left: 30%;
          opacity: 0.7;
          animation-duration: 2.5s;
          animation-delay: 0.5s;
        }

        .points-wrapper .point:nth-child(3) {
          left: 25%;
          opacity: 0.8;
          animation-duration: 2.2s;
          animation-delay: 0.1s;
        }

        .points-wrapper .point:nth-child(4) {
          left: 44%;
          opacity: 0.6;
          animation-duration: 2.05s;
        }

        .points-wrapper .point:nth-child(5) {
          left: 50%;
          opacity: 1;
          animation-duration: 1.9s;
        }

        .points-wrapper .point:nth-child(6) {
          left: 75%;
          opacity: 0.5;
          animation-duration: 1.5s;
          animation-delay: 1.5s;
        }

        .points-wrapper .point:nth-child(7) {
          left: 88%;
          opacity: 0.9;
          animation-duration: 2.2s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(8) {
          left: 58%;
          opacity: 0.8;
          animation-duration: 2.25s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(9) {
          left: 98%;
          opacity: 0.6;
          animation-duration: 2.6s;
          animation-delay: 0.1s;
        }

        .points-wrapper .point:nth-child(10) {
          left: 65%;
          opacity: 1;
          animation-duration: 2.5s;
          animation-delay: 0.2s;
        }

        .arrow-icon {
          transition: transform 0.3s ease;
        }

        .premium-button:hover .arrow-icon {
          transform: translateX(4px);
        }

        .premium-button:hover .arrow-icon path {
          animation: dash 0.8s linear forwards;
        }

        @keyframes dash {
          0% {
            stroke-dasharray: 0, 20;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 10, 10;
            stroke-dashoffset: -5;
          }
          100% {
            stroke-dasharray: 20, 0;
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </div>
  );
}
