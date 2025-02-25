'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2, Brain, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

interface OralCameraAssessmentProps {
  onAssessmentComplete: (assessment: any) => void;
}

export default function OralCameraAssessment({ onAssessmentComplete }: OralCameraAssessmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      // First check if we have permissions
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (permissions.state === 'denied') {
        toast.error('Camera access is blocked. Please enable it in your browser settings.');
        setHasPermission(false);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: { exact: "environment" }, 
          frameRate: { ideal: 30 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasPermission(true);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      // If exact "environment" mode fails, try without exact constraint
      if (error.name === 'OverconstrainedError') {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "environment" 
            }
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setHasPermission(true);
          return;
        } catch (fallbackError) {
          console.error('Fallback camera access failed:', fallbackError);
        }
      }
      
      toast.error('Failed to access camera. Please check camera permissions.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setAnalyzing(true);
    try {
      // Try Gemini Vision first
      try {
        const geminiResponse = await fetch('/api/analyze-oral-image/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: capturedImage })
        });

        const geminiData = await geminiResponse.json();

        if (geminiResponse.ok && geminiData.findings) {
          setAssessmentResults(geminiData);
          onAssessmentComplete(geminiData);
          toast.success('Analysis completed with Gemini AI');
          return;
        } else {
          console.error('Gemini analysis failed:', geminiData.error || 'Unknown error');
          toast.info('Primary analysis failed, trying backup model...');
        }
      } catch (error) {
        console.error('Gemini analysis error:', error);
        toast.info('Primary analysis failed, trying backup model...');
      }

      // Try Groq as fallback
      try {
        const groqResponse = await fetch('/api/analyze-oral-image/groq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: capturedImage })
        });

        const groqData = await groqResponse.json();

        if (groqResponse.ok && groqData.findings) {
          setAssessmentResults(groqData);
          onAssessmentComplete(groqData);
          toast.success('Analysis completed with Groq AI');
          return;
        } else {
          console.error('Groq analysis failed:', groqData.error || 'Unknown error');
          throw new Error(groqData.error || 'Analysis failed with both models');
        }
      } catch (error) {
        console.error('Groq analysis error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setAssessmentResults(null);
    startCamera();
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          startCamera();
        }}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
      >
        <Camera className="h-5 w-5" />
        Oral Assessment
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Camera className="h-6 w-6 text-purple-600" />
                  Oral Assessment Camera
                </h2>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    stopCamera();
                    setCapturedImage(null);
                    setAssessmentResults(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {!hasPermission && (
                  <div className="text-center py-4 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-yellow-700">Camera access is required for this feature.</p>
                    <p className="text-sm text-yellow-600">Please allow camera access in your browser settings.</p>
                    <button
                      onClick={startCamera}
                      className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {hasPermission && (
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {!capturedImage ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                {analyzing && (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                    <p className="text-gray-600">Analyzing image...</p>
                  </div>
                )}

                {assessmentResults && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className={`p-4 rounded-lg mb-4 ${
                      assessmentResults.eligibility.status === 'eligible'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        {assessmentResults.eligibility.status === 'eligible' ? (
                          <>
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-green-900">Eligible for Surgery</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="text-red-900">Not Eligible for Surgery</span>
                          </>
                        )}
                      </h3>
                      <p className={`text-sm mb-3 ${
                        assessmentResults.eligibility.status === 'eligible'
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}>
                        {assessmentResults.eligibility.reason}
                      </p>
                      {assessmentResults.eligibility.recommendations.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {assessmentResults.eligibility.status === 'eligible'
                              ? 'Precautions:'
                              : 'Recommendations:'}
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {assessmentResults.eligibility.recommendations.map((rec, idx) => (
                              <li
                                key={idx}
                                className={
                                  assessmentResults.eligibility.status === 'eligible'
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }
                              >
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium flex items-center gap-2 mb-3">
                        <Brain className="h-5 w-5 text-purple-600" />
                        Detailed Assessment
                      </h3>
                      <div className="space-y-2">
                        {assessmentResults.findings.map((finding: any, index: number) => (
                          <div
                            key={index}
                            className={`flex items-start gap-2 p-2 rounded ${
                              finding.severity === 'normal'
                                ? 'bg-green-50 text-green-700'
                                : finding.severity === 'attention'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {finding.severity === 'normal' ? (
                              <Check className="h-5 w-5 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium">{finding.feature}</p>
                              <p className="text-sm opacity-90">{finding.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {hasPermission && (
                  <div className="flex justify-end gap-3">
                    {!capturedImage ? (
                      <button
                        onClick={captureImage}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
                      >
                        <Camera className="h-5 w-5" />
                        Capture
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={resetCapture}
                          className="text-gray-600 hover:text-gray-800 px-4 py-2"
                        >
                          Retake
                        </button>
                        <button
                          onClick={analyzeImage}
                          disabled={analyzing}
                          className={`
                            px-4 py-2 rounded-lg flex items-center gap-2
                            ${analyzing
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                            }
                          `}
                        >
                          {analyzing ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="h-5 w-5" />
                              Analyze
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
