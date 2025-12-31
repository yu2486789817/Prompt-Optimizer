'use client';

interface GeneratingLoaderProps {
  label: string;
}

const letters = ['G', 'e', 'n', 'e', 'r', 'a', 't', 'i', 'n', 'g'];

export default function GeneratingLoader({ label }: GeneratingLoaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-slate-900 dark:text-white">
      <div className="generating-loader" aria-hidden>
        <div className="generating-loader__wrapper">
          {letters.map((letter, index) => (
            <span key={`${letter}-${index}`} className="generating-loader__letter">
              {letter}
            </span>
          ))}
          <div className="generating-loader__beam" />
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
    </div>
  );
}
