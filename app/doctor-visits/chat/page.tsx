"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DoctorVisit {
  id: string;
  doctor_name: string;
  specialty: string;
  visit_date: string;
  reason: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  follow_up_date: string | null;
}

export default function DoctorVisitsChat() {
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState("");
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your health assistant. I can answer questions about your doctor visits, medications, and general health questions. How can I help you today?",
    },
  ]);

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    fetchVisits();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("user_id", user?.id)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error("Error fetching visits:", error);
      showToast("Failed to load doctor visits for AI assistance", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput("");
    setIsProcessing(true);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      // Prepare context about doctor visits
      const visitsSummary = visits
        .map(
          (visit) =>
            `Visit on ${new Date(visit.visit_date).toLocaleDateString()} with ${
              visit.doctor_name
            } (${visit.specialty || "No specialty"}): 
         - Reason: ${visit.reason || "Not specified"}
         - Diagnosis: ${visit.diagnosis || "Not specified"}
         - Prescription: ${visit.prescription || "None"}
         - Follow-up: ${
           visit.follow_up_date
             ? new Date(visit.follow_up_date).toLocaleDateString()
             : "None"
         }
         - Notes: ${visit.notes || "None"}`
        )
        .join("\n\n");

      // Call Gemini API
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.concat({ role: "user", content: userMessage }),
          context: `The user has the following doctor visits in their health record:\n${visitsSummary}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (error: any) {
      console.error("Error:", error);
      showToast("Failed to get response", "error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split("\n").map((line, i) => (
      <p key={i} className={i > 0 ? "mt-2" : ""}>
        {line}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/doctor-visits" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Visits
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Doctor Visits Chat Assistant
          </h1>
        </div>

        <Card className="p-4 mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <p>
              This assistant has access to your doctor visits history and can
              help answer questions about:
            </p>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-0 pl-2">
            <li>Specific visits with doctors</li>
            <li>Your diagnoses and prescriptions</li>
            <li>Upcoming follow-up appointments</li>
            <li>General health questions related to your condition</li>
          </ul>
        </Card>

        <Card className="mb-4 p-6 h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 pr-2">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 ${
                    message.role === "assistant"
                      ? "bg-blue-50 p-3 rounded-lg"
                      : "bg-gray-100 p-3 rounded-lg ml-auto max-w-[80%]"
                  }`}
                  style={{ maxWidth: message.role === "user" ? "80%" : "100%" }}
                >
                  <div
                    className={`text-sm ${
                      message.role === "assistant"
                        ? "text-gray-800"
                        : "text-gray-700"
                    }`}
                  >
                    {formatMessageContent(message.content)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your doctor visits..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <Button type="submit" disabled={isProcessing || !input.trim()}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
