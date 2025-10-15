"use client";

import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, CheckCircle2 } from "lucide-react";

interface WelcomeModalProps {
  userName: string;
  onDismiss: () => void;
}

export function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-12 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        {/* Welcome Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-6 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome, friend!
          </h2>
          <p className="text-xl text-gray-600 font-medium">
            Your Heritage Whisper Guided Interview
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-6 mb-10">
          <p className="text-lg text-gray-700 leading-relaxed text-center">
            Over the next 10-15 minutes, I'll ask you questions about your life.
            This conversation will help you capture your memories in a meaningful way.
          </p>

          {/* Features */}
          <div className="space-y-5 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Mic className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Record or Type</h3>
                <p className="text-lg text-gray-600 leading-relaxed">Answer with your voice or by typing - whichever feels natural</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Choose Your Path</h3>
                <p className="text-lg text-gray-600 leading-relaxed">Pick which follow-up questions interest you most</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Take Your Time</h3>
                <p className="text-lg text-gray-600 leading-relaxed">There's no rush - share as much or as little as you'd like</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onDismiss}
          className="premium-button w-full h-16 text-xl font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden cursor-pointer border-none outline-none"
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

        {/* Helper text */}
        <p className="text-center text-base text-gray-500 mt-5">
          This usually takes 10-15 minutes
        </p>
      </div>

      <style jsx>{`
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
