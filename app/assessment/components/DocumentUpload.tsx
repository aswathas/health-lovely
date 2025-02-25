import { useState } from 'react';
import { Upload, X, FileText, Check } from 'lucide-react';
import { toast } from 'react-toastify';

interface DocumentUploadProps {
  onUploadComplete: (documentInfo: { name: string; url: string }) => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.match('application/pdf|image/*')) {
        toast.error('Only PDF and image files are allowed');
        continue;
      }

      try {
        setUploading(true);
        // Here you would normally upload to your backend/storage
        // For now, we'll create a temporary URL
        const url = URL.createObjectURL(file);
        const newFile = { name: file.name, url };
        setUploadedFiles(prev => [...prev, newFile]);
        onUploadComplete(newFile);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const removeFile = (fileToRemove: { name: string; url: string }) => {
    setUploadedFiles(prev => prev.filter(file => file.url !== fileToRemove.url));
    URL.revokeObjectURL(fileToRemove.url);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            <label className="relative cursor-pointer rounded-md font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500">
              <span>Upload documents</span>
              <input
                type="file"
                className="sr-only"
                multiple
                accept="application/pdf,image/*"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </label>{' '}
            or drag and drop
          </div>
          <p className="text-xs text-gray-500">PDF & Images up to 10MB</p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.url}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <button
                onClick={() => removeFile(file)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
