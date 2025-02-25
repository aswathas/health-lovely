'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showToast } from '@/lib/toast';
import { Activity, Heart, FileText, Microscope, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import UploadAnalyze from './components/UploadAnalyze';
import OralCameraAssessment from '@/app/assessment/components/OralCameraAssessment';
import { Check, AlertTriangle } from 'lucide-react';

interface Report {
  id: string;
  specialization: string;
  date: string;
  title: string;
  summary: string;
  details: {
    findings: string[];
    recommendations: string[];
    metrics?: Record<string, number | string>;
    trends?: {
      metric: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      value: number | string;
      previousValue?: number | string;
    }[];
    risk_factors?: string[];
    normal_ranges?: Record<string, { min: number; max: number }>;
  };
  status: 'normal' | 'attention' | 'critical';
  ai_analysis?: {
    insights: string[];
    recommendations: string[];
    risk_assessment: string;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Record<string, Report[]>>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      fetchReports();
    };

    checkSession();
  }, [router, supabase.auth]);

  const fetchReports = async () => {
    try {
      // Sample reports data - In a real app, this would come from your database
      const sampleReports: Report[] = [
        // Hematology Reports
        {
          id: '1',
          specialization: 'Hematology',
          date: '2025-02-24',
          title: 'Complete Blood Count Analysis',
          summary: 'Routine blood work shows all parameters within normal range',
          details: {
            findings: [
              'Hemoglobin levels are optimal',
              'White blood cell count is normal',
              'Platelet count is within range'
            ],
            recommendations: [
              'Continue current health maintenance',
              'Next CBC recommended in 6 months'
            ],
            metrics: {
              'Hemoglobin': '14.2 g/dL',
              'WBC': '7.5 K/µL',
              'RBC': '4.8 M/µL',
              'Platelets': '250 K/µL'
            },
            normal_ranges: {
              'Hemoglobin': { min: 12, max: 16 },
              'WBC': { min: 4, max: 11 },
              'RBC': { min: 4.2, max: 5.8 },
              'Platelets': { min: 150, max: 450 }
            }
          },
          status: 'normal',
          ai_analysis: {
            insights: [
              'All blood parameters are within optimal ranges',
              'No significant changes from previous tests',
              'Blood cell morphology is normal'
            ],
            recommendations: [
              'Maintain current diet and exercise routine',
              'Stay hydrated',
              'Continue regular check-ups'
            ],
            risk_assessment: 'Low risk - All parameters are within normal ranges'
          }
        },
        // Cardiac Reports
        {
          id: '2',
          specialization: 'Cardiac',
          date: '2025-02-20',
          title: 'Cardiovascular Health Assessment',
          summary: 'Cardiac evaluation shows good heart health with minor recommendations',
          details: {
            findings: [
              'Normal heart rhythm',
              'Blood pressure slightly elevated',
              'Good heart rate variability'
            ],
            recommendations: [
              'Increase aerobic exercise',
              'Reduce sodium intake',
              'Monitor blood pressure weekly'
            ],
            metrics: {
              'Blood Pressure': '128/82 mmHg',
              'Heart Rate': '72 bpm',
              'ECG': 'Normal sinus rhythm'
            },
            trends: [
              {
                metric: 'Systolic BP',
                trend: 'increasing',
                value: 128,
                previousValue: 122
              }
            ]
          },
          status: 'attention',
          ai_analysis: {
            insights: [
              'Slight upward trend in blood pressure',
              'Heart rhythm remains stable',
              'Exercise tolerance is good'
            ],
            recommendations: [
              'Consider lifestyle modifications for BP management',
              'Schedule follow-up in 3 months',
              'Start BP monitoring log'
            ],
            risk_assessment: 'Moderate risk - Blood pressure trending upward'
          }
        },
        // Imaging Reports
        {
          id: '3',
          specialization: 'Imaging',
          date: '2025-02-15',
          title: 'Chest X-Ray Results',
          summary: 'Routine chest X-ray shows clear lung fields',
          details: {
            findings: [
              'Clear lung fields bilaterally',
              'Normal heart size',
              'No active disease process identified'
            ],
            recommendations: [
              'No immediate follow-up needed',
              'Continue annual screening'
            ]
          },
          status: 'normal',
          ai_analysis: {
            insights: [
              'Lung fields are clear of any abnormalities',
              'Heart size and shape are normal',
              'No signs of infection or inflammation'
            ],
            recommendations: [
              'Maintain regular check-ups',
              'Report any respiratory symptoms promptly'
            ],
            risk_assessment: 'Low risk - No abnormalities detected'
          }
        },
        // Biochemistry Reports
        {
          id: '4',
          specialization: 'Biochemistry',
          date: '2025-02-22',
          title: 'Metabolic Panel Analysis',
          summary: 'Comprehensive metabolic panel shows optimal liver and kidney function',
          details: {
            findings: [
              'Liver enzymes within normal range',
              'Kidney function markers optimal',
              'Electrolyte balance maintained'
            ],
            recommendations: [
              'Continue current medication regimen',
              'Maintain healthy diet',
              'Stay well hydrated'
            ],
            metrics: {
              'ALT': '25 U/L',
              'AST': '22 U/L',
              'Creatinine': '0.9 mg/dL',
              'BUN': '15 mg/dL'
            },
            normal_ranges: {
              'ALT': { min: 7, max: 55 },
              'AST': { min: 8, max: 48 },
              'Creatinine': { min: 0.6, max: 1.2 },
              'BUN': { min: 7, max: 20 }
            }
          },
          status: 'normal',
          ai_analysis: {
            insights: [
              'All metabolic parameters are within normal ranges',
              'Liver function tests show healthy liver function',
              'Kidney function markers indicate good kidney health'
            ],
            recommendations: [
              'Continue current lifestyle habits',
              'Regular follow-up in 6 months',
              'Maintain balanced diet'
            ],
            risk_assessment: 'Low risk - All parameters optimal'
          }
        }
      ];

      // Group reports by specialization
      const groupedReports = sampleReports.reduce((acc, report) => {
        if (!acc[report.specialization]) {
          acc[report.specialization] = [];
        }
        acc[report.specialization].push(report);
        return acc;
      }, {} as Record<string, Report[]>);

      setReports(groupedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast('error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisComplete = (analysis: any) => {
    // Store the analysis in local storage for now
    // In a real app, you might want to store this in your database
    localStorage.setItem('latestAnalysis', JSON.stringify(analysis));
    router.push('/reports/hematology');
  };

  const getSpecializationIcon = (specialization: string) => {
    switch (specialization) {
      case 'Hematology':
        return <Microscope className="h-6 w-6 text-red-500" />;
      case 'Cardiac':
        return <Heart className="h-6 w-6 text-pink-500" />;
      case 'Imaging':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'Biochemistry':
        return <Activity className="h-6 w-6 text-green-500" />;
      default:
        return <PieChart className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'attention':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="bottom-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
        <div className="flex gap-4">
          <OralCameraAssessment 
            onAssessmentComplete={(results) => {
              // Save assessment results to local storage
              const assessments = JSON.parse(localStorage.getItem('oralAssessments') || '[]');
              assessments.push({
                date: new Date().toISOString(),
                ...results
              });
              localStorage.setItem('oralAssessments', JSON.stringify(assessments));
              
              // Show success message
              showToast('success', 'Oral assessment completed and saved');
            }} 
          />
        </div>
      </div>

      <div className="space-y-8">
        <UploadAnalyze onAnalysisComplete={handleAnalysisComplete} />
        {Object.entries(reports).map(([specialization, specializationReports]) => (
          <div key={specialization} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              {getSpecializationIcon(specialization)}
              <h2 className="text-2xl font-semibold">{specialization}</h2>
            </div>

            <div className="space-y-4">
              {specializationReports.map((report) => (
                <Card key={report.id} className={`p-6 border ${getStatusColor(report.status)}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(report.date), 'PPP')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      report.status === 'normal' ? 'bg-green-100 text-green-800' :
                      report.status === 'attention' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{report.summary}</p>

                  <div className="space-y-4">
                    {report.details.metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(report.details.metrics).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-500">{key}</p>
                            <p className="font-medium">{value}</p>
                            {report.details.normal_ranges?.[key] && (
                              <p className="text-xs text-gray-400">
                                Range: {report.details.normal_ranges[key].min} - {report.details.normal_ranges[key].max}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium">Key Findings</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {report.details.findings.map((finding, index) => (
                          <li key={index} className="text-gray-600">{finding}</li>
                        ))}
                      </ul>
                    </div>

                    {report.details.trends && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Trends</h4>
                        <div className="space-y-2">
                          {report.details.trends.map((trend, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className={`${
                                trend.trend === 'increasing' ? 'text-red-500' :
                                trend.trend === 'decreasing' ? 'text-green-500' :
                                'text-blue-500'
                              }`}>
                                {trend.trend === 'increasing' ? '↑' :
                                 trend.trend === 'decreasing' ? '↓' : '→'}
                              </span>
                              <span>{trend.metric}: {trend.value}</span>
                              {trend.previousValue && (
                                <span className="text-gray-500 text-sm">
                                  (was {trend.previousValue})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.ai_analysis && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                        <h4 className="font-medium text-blue-800">AI Analysis</h4>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-800">Insights:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {report.ai_analysis.insights.map((insight, index) => (
                              <li key={index} className="text-blue-700 text-sm">{insight}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-800">Recommendations:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {report.ai_analysis.recommendations.map((rec, index) => (
                              <li key={index} className="text-blue-700 text-sm">{rec}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-blue-800">Risk Assessment:</p>
                          <p className="text-blue-700 text-sm">{report.ai_analysis.risk_assessment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Oral Assessments Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Oral Health Assessments</h2>
        <div className="grid gap-4">
          {JSON.parse(localStorage.getItem('oralAssessments') || '[]')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((assessment: any, index: number) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Assessment on {new Date(assessment.date).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Analyzed with {assessment.model} model
                    </p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {new Date(assessment.date).toLocaleTimeString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {assessment.findings.map((finding: any, idx: number) => (
                    <div
                      key={idx}
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
            ))}
        </div>
      </div>
    </div>
  );
}
