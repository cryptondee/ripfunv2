import React from 'react';

interface Props {
  text: string;
}

export default function CommunityAnalysis({ text }: Props) {
  if (!text) return null;
  return (
    <section className="mt-12 max-w-2xl mx-auto animate-fadeInSlow">
      <h2 className="text-xl text-rip-green font-bold mb-4">Community Vibe Check</h2>
      <p className="leading-relaxed text-gray-200 whitespace-pre-wrap">{text}</p>
    </section>
  );
}
