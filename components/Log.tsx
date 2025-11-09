
import React, { useRef, useEffect } from 'react';

interface LogProps {
  messages: string[];
}

const Log: React.FC<LogProps> = ({ messages }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg h-64 overflow-y-auto" ref={logContainerRef}>
      <h2 className="text-xl font-bold mb-4 text-center text-gray-300">وقایع بازی</h2>
      <div className="space-y-2 text-sm">
        {messages.map((msg, index) => (
          <p key={index} className="text-gray-300 border-b border-gray-700 pb-1 last:border-b-0" dangerouslySetInnerHTML={{ __html: msg }} />
        ))}
      </div>
    </div>
  );
};

export default Log;
