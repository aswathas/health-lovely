'use client';

import { useState } from 'react';
import OralCameraAssessment from './components/OralCameraAssessment';
import DocumentUpload from './components/DocumentUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Camera, FileText } from 'lucide-react';

export default function AssessmentPage() {
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);

  const handleAssessmentComplete = (data: any) => {
    setAssessmentData(data);
  };

  const handleDocumentUpload = (documentInfo: { name: string; url: string }) => {
    setDocuments(prev => [...prev, documentInfo]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Surgical Assessment</h1>
      
      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Oral Assessment
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera">
          <Card className="p-6">
            <OralCameraAssessment onAssessmentComplete={handleAssessmentComplete} />
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Supporting Documents</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please upload any relevant medical documents, previous assessments, or test results.
              Accepted formats: PDF and images.
            </p>
            <DocumentUpload onUploadComplete={handleDocumentUpload} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
