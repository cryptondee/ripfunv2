import React from 'react';

interface LoaderProps {
  message?: string | null;
}

export default function Loader({ message }: LoaderProps) {
  return (
    <div className="flex flex-col items-center mt-8 gap-4 animate-fadeIn">
      <div className="w-12 h-12 border-4 border-rip-green border-t-transparent rounded-full animate-spin" />
      {message && <p className="text-rip-green text-sm md:text-base text-center max-w-xs">{message}</p>}
    </div>
  );
}
