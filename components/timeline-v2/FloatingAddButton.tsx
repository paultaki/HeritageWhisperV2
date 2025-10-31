'use client';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export default function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <>
      <button
        onClick={onClick}
        className="particle-button text-white font-semibold rounded-full transition-all z-50 hidden md:flex"
        aria-label="Add memory"
        style={{ 
          position: 'fixed',
          right: '40px',
          bottom: '40px',
          height: '56px',
          maxHeight: '56px',
          width: 'auto'
        }}
      >
        <div className="points-wrapper">
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

        <span className="button-inner">
          + Add Memory
        </span>
      </button>

      <style jsx>{`
        .particle-button {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.25s ease;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(245, 158, 11, 0.6) 0%,
              rgba(217, 119, 6, 0.3) 50%,
              rgba(245, 158, 11, 0) 100%),
            linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
          border-radius: 9999px;
          border: none;
          outline: none;
          padding: 16px 32px;
          height: 56px;
          min-height: 56px;
          max-height: 56px;
          min-width: 160px;
          max-width: 220px;
          box-shadow: 0 8px 25px -8px rgba(245, 158, 11, 0.6),
                      0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .particle-button::before,
        .particle-button::after {
          content: "";
          position: absolute;
          transition: all 0.5s ease-in-out;
          z-index: 0;
        }

        .particle-button::before {
          inset: 1px;
          background: linear-gradient(135deg,
              rgba(255, 255, 255, 0.2) 0%,
              rgba(255, 255, 255, 0.05) 50%,
              rgba(255, 255, 255, 0) 100%);
          border-radius: 9999px;
        }

        .particle-button::after {
          inset: 2px;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(245, 158, 11, 0.4) 0%,
              rgba(217, 119, 6, 0.2) 50%,
              rgba(245, 158, 11, 0) 100%),
            linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
          border-radius: 9999px;
        }

        .particle-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px -8px rgba(245, 158, 11, 0.8),
                      0 0 0 1px rgba(255, 255, 255, 0.2);
        }

        .particle-button:active {
          transform: translateY(-1px) scale(0.98);
        }

        .points-wrapper {
          overflow: hidden;
          width: 100%;
          height: 100%;
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        .points-wrapper .point {
          bottom: -10px;
          position: absolute;
          animation: floating-points infinite ease-in-out;
          pointer-events: none;
          width: 2px;
          height: 2px;
          background-color: #FDE68A;
          border-radius: 9999px;
          box-shadow: 0 0 4px rgba(253, 230, 138, 0.8);
        }

        @keyframes floating-points {
          0% {
            transform: translateY(0);
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          85% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-60px);
            opacity: 0;
          }
        }

        .points-wrapper .point:nth-child(1) {
          left: 15%;
          opacity: 0.9;
          animation-duration: 6.5s;
          animation-delay: 0.3s;
        }

        .points-wrapper .point:nth-child(2) {
          left: 25%;
          opacity: 0.7;
          animation-duration: 7.0s;
          animation-delay: 0.7s;
        }

        .points-wrapper .point:nth-child(3) {
          left: 35%;
          opacity: 0.8;
          animation-duration: 6.0s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(4) {
          left: 50%;
          opacity: 0.6;
          animation-duration: 5.5s;
          animation-delay: 0.1s;
        }

        .points-wrapper .point:nth-child(5) {
          left: 60%;
          opacity: 0.9;
          animation-duration: 5.0s;
          animation-delay: 0s;
        }

        .points-wrapper .point:nth-child(6) {
          left: 70%;
          opacity: 0.5;
          animation-duration: 6.8s;
          animation-delay: 1.2s;
        }

        .points-wrapper .point:nth-child(7) {
          left: 80%;
          opacity: 0.8;
          animation-duration: 6.2s;
          animation-delay: 0.4s;
        }

        .points-wrapper .point:nth-child(8) {
          left: 45%;
          opacity: 0.7;
          animation-duration: 7.2s;
          animation-delay: 0.6s;
        }

        .points-wrapper .point:nth-child(9) {
          left: 85%;
          opacity: 0.6;
          animation-duration: 5.2s;
          animation-delay: 0.8s;
        }

        .points-wrapper .point:nth-child(10) {
          left: 65%;
          opacity: 0.9;
          animation-duration: 5.8s;
          animation-delay: 0.5s;
        }

        .button-inner {
          z-index: 2;
          gap: 8px;
          position: relative;
          width: 100%;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          transition: all 0.2s ease-in-out;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

      `}</style>
    </>
  );
}

