import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#171F2E] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* SVG Background Blur from Hero Section */}
      <div className="absolute hidden lg:block z-0 top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 opacity-60 pointer-events-none">
        <svg width="1300" height="1001" viewBox="0 0 1300 1001" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_f_9279_7148)">
            <circle cx="800" cy="500.03" r="300" fill="#4E6EFF" />
          </g>
          <g filter="url(#filter1_f_9279_7148)">
            <circle cx="500" cy="500.03" r="300" fill="#FF58D5" opacity="0.5" />
          </g>
          <defs>
            <filter id="filter0_f_9279_7148" x="300" y="0.029541" width="1000" height="1000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_9279_7148" />
            </filter>
            <filter id="filter1_f_9279_7148" x="0" y="0.029541" width="1000" height="1000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_9279_7148" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Fallback glow for mobile */}
      <div className="hero-glow-bg pointer-events-none w-full h-full absolute z-0 bottom-0 opacity-40"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Image
                src="/images/logo-white.png"
                alt="QbLog"
                width={40}
                height={40}
                className="dark:hidden"
              />
              <Image
                src="/images/logo-black.png"
                alt="QbLog"
                width={40}
                height={40}
                className="hidden dark:block"
              />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">
              QbLog
            </span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Votre Second Cerveau
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Connectez-vous pour accéder à vos notes, bugs et snippets.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="p-[1px] gradient-border rounded-2xl">
          <div className="bg-[#1A2231]/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
