import React from 'react';
import { motion } from 'motion/react';

interface FlashMessageProps {
  text: string;
  enabled: boolean;
}

export default function FlashMessage({ text, enabled }: FlashMessageProps) {
  if (!enabled || !text) return null;

  // Repeat the text to ensure it covers the screen width several times
  const repeatedText = Array(5).fill(text).join(' • ');

  return (
    <div className="bg-amber-500 text-slate-950 py-2 overflow-hidden whitespace-nowrap w-full">
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="inline-block text-xs font-black uppercase tracking-widest px-4 whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {repeatedText}
      </motion.div>
    </div>
  );
}
