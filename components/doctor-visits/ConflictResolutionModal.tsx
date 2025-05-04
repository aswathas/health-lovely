"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: any;
  serverData: any;
  onUseServer: () => void;
  onUseLocal: () => void;
}

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  currentData,
  serverData,
  onUseServer,
  onUseLocal,
}: ConflictResolutionModalProps) {
  const { showToast } = useToast();

  // Don't render the modal content if data is missing
  if (!currentData || !serverData) {
    return null;
  }

  // Format the data to be more user-friendly
  const formatData = (data: any) => {
    const { id, user_id, created_at, updated_at, version, ...rest } = data;
    return rest;
  };

  const currentFormatted = formatData(currentData);
  const serverFormatted = formatData(serverData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Data Conflict Detected</h2>

        <div className="bg-yellow-50 p-4 rounded-md mb-4">
          <p className="text-yellow-800">
            Another user has modified this record while you were making changes.
            Please choose which version you want to keep.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border rounded-md p-4 bg-white">
            <h3 className="font-medium mb-2">Your Changes</h3>
            <pre className="text-sm bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(currentFormatted, null, 2)}
            </pre>
          </div>

          <div className="border rounded-md p-4 bg-white">
            <h3 className="font-medium mb-2">Server Version</h3>
            <pre className="text-sm bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(serverFormatted, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onUseServer}>
            Use Server Version
          </Button>
          <Button onClick={onUseLocal}>Use My Version</Button>
        </div>
      </div>
    </Dialog>
  );
}
