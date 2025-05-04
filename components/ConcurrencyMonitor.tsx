"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface ConcurrencyEvent {
  id: string;
  type: "attempt" | "success" | "conflict" | "resolution";
  timestamp: Date;
  resource: string;
  details: string;
}

export default function ConcurrencyMonitor() {
  const [events, setEvents] = useState<ConcurrencyEvent[]>([]);
  const [expanded, setExpanded] = useState(false);
  
  // Subscribe to concurrency events
  useEffect(() => {
    const handleConcurrencyEvent = (e: CustomEvent) => {
      setEvents(prev => [e.detail, ...prev].slice(0, 10));
    };
    
    window.addEventListener('concurrency-event', handleConcurrencyEvent as any);
    return () => {
      window.removeEventListener('concurrency-event', handleConcurrencyEvent as any);
    };
  }, []);
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all ${expanded ? "w-96" : "w-10 h-10"}`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="absolute top-2 right-2 z-10 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
      >
        {expanded ? "×" : "i"}
      </button>
      
      {expanded && (
        <Card className="p-4 bg-white shadow-lg max-h-80 overflow-auto">
          <h3 className="font-medium mb-2">Concurrency Monitor</h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">No concurrency events yet</p>
          ) : (
            <div className="space-y-2">
              {events.map((event, i) => (
                <div key={i} className={`text-xs p-2 rounded ${
                  event.type === 'conflict' ? 'bg-red-50 text-red-800' : 
                  event.type === 'resolution' ? 'bg-green-50 text-green-800' :
                  'bg-gray-50 text-gray-800'
                }`}>
                  <div className="flex justify-between">
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span className="font-medium">{event.type}</span>
                  </div>
                  <div>{event.resource}: {event.details}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}