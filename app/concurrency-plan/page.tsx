"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

export default function ConcurrencyPlan() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">
        Concurrency Control & Recovery Strategy
      </h1>
      <p className="text-gray-600 mb-6">
        Our approach to handling concurrent data access and system recovery
      </p>

      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === "overview"
              ? "border-b-2 border-blue-500 font-medium"
              : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "concurrency"
              ? "border-b-2 border-blue-500 font-medium"
              : ""
          }`}
          onClick={() => setActiveTab("concurrency")}
        >
          Concurrency Control
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "recovery"
              ? "border-b-2 border-blue-500 font-medium"
              : ""
          }`}
          onClick={() => setActiveTab("recovery")}
        >
          Recovery Plan
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "implementation"
              ? "border-b-2 border-blue-500 font-medium"
              : ""
          }`}
          onClick={() => setActiveTab("implementation")}
        >
          Implementation
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">System Overview</h2>
            <p className="mb-4">
              Our health tracking application handles concurrent access and
              system recovery through a combination of optimistic concurrency
              control, conflict resolution, and offline-first capabilities.
            </p>

            <h3 className="font-medium mt-4 mb-2">Key Components:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Version-based optimistic concurrency control</li>
              <li>Conflict detection and resolution UI</li>
              <li>Offline data persistence</li>
              <li>Automatic synchronization</li>
              <li>Transaction logging for recovery</li>
            </ul>
          </Card>
        </div>
      )}

      {activeTab === "concurrency" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              Optimistic Concurrency Control
            </h2>
            <p className="mb-4">
              We implement optimistic concurrency control using version numbers
              to track changes to records:
            </p>

            <div className="bg-gray-50 p-4 rounded mb-4">
              <pre className="text-sm overflow-x-auto">
                {`// When updating a record
await supabase
  .from("doctor_visits")
  .update({
    ...data,
    version: currentVersion + 1  // Increment version
  })
  .eq("id", recordId)
  .eq("version", currentVersion)  // Only update if version matches`}
              </pre>
            </div>

            <h3 className="font-medium mt-6 mb-2">
              Conflict Resolution Process
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>User attempts to update a record</li>
              <li>System checks if version matches expected version</li>
              <li>If version doesn't match, a conflict is detected</li>
              <li>
                User is presented with a conflict resolution UI showing both
                versions
              </li>
              <li>
                User can choose to keep their changes, use server version, or
                merge
              </li>
            </ol>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Multi-user Scenarios</h2>

            <div className="mb-6">
              <h3 className="font-medium mb-2">
                Scenario 1: Two users edit the same record
              </h3>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm">
                  User A and User B both open the same record. User A saves
                  changes first, incrementing the version from 1 to 2. When User
                  B attempts to save, the system detects the version mismatch
                  and shows a conflict resolution dialog.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">
                Scenario 2: Same user, different devices
              </h3>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm">
                  A user makes changes on their phone and saves them. Later,
                  they edit the same record on their laptop without refreshing.
                  When they try to save, the system detects that the record was
                  changed and prompts for resolution.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "recovery" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recovery Plan</h2>

            <h3 className="font-medium mb-2">Offline Capabilities</h3>
            <p className="mb-4">
              Our application implements offline-first capabilities:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Local storage for pending changes</li>
              <li>IndexedDB for larger offline data storage</li>
              <li>Automatic synchronization when connection is restored</li>
              <li>Conflict resolution for changes made while offline</li>
            </ul>

            <h3 className="font-medium mt-6 mb-2">Recovery Process</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Application detects network status changes</li>
              <li>When offline, changes are stored locally with timestamps</li>
              <li>Upon reconnection, system attempts to sync changes</li>
              <li>Version conflicts are resolved through the UI</li>
              <li>Transaction logs track all sync operations for audit</li>
            </ol>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Disaster Recovery</h2>

            <h3 className="font-medium mb-2">Data Protection</h3>
            <p className="mb-4">
              Our strategy for protecting user data includes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Regular database backups (daily, weekly, monthly)</li>
              <li>Point-in-time recovery through transaction logs</li>
              <li>Data replication across multiple regions</li>
              <li>Encrypted backups with secure access controls</li>
            </ul>

            <h3 className="font-medium mt-6 mb-2">Recovery Time Objectives</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="p-2 border">Scenario</th>
                    <th className="p-2 border">RTO</th>
                    <th className="p-2 border">RPO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border">Minor outage</td>
                    <td className="p-2 border">1 hour</td>
                    <td className="p-2 border">1 minute</td>
                  </tr>
                  <tr>
                    <td className="p-2 border">Major service disruption</td>
                    <td className="p-2 border">4 hours</td>
                    <td className="p-2 border">10 minutes</td>
                  </tr>
                  <tr>
                    <td className="p-2 border">Catastrophic failure</td>
                    <td className="p-2 border">24 hours</td>
                    <td className="p-2 border">1 hour</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "implementation" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Technical Implementation</h2>

            <div className="mb-6">
              <h3 className="font-medium mb-2">Database Schema</h3>
              <div className="bg-gray-50 p-3 rounded">
                <pre className="text-sm overflow-x-auto">
                  {`-- Version field for concurrency control
CREATE TABLE doctor_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  doctor_name TEXT NOT NULL,
  visit_date DATE NOT NULL,
  -- other fields
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Client-Side Implementation</h3>
              <div className="bg-gray-50 p-3 rounded">
                <pre className="text-sm overflow-x-auto">
                  {`// Offline storage hooks
function useOfflineStorage() {
  // Store pending changes
  const savePendingChanges = (id, data) => {
    localStorage.setItem(\`pending-\${id}\`, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  };
  
  // Process pending changes on reconnection
  const processPendingChanges = async () => {
    // Implementation details
  };
  
  return { savePendingChanges, processPendingChanges };
}`}
                </pre>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Testing Strategy</h2>

            <h3 className="font-medium mb-2">Test Scenarios</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Concurrent edits by multiple users</li>
              <li>Network disconnection during data submission</li>
              <li>Data synchronization after extended offline period</li>
              <li>Version conflict resolution</li>
              <li>Recovery from simulated database failures</li>
            </ul>

            <h3 className="font-medium mt-6 mb-2">Monitoring</h3>
            <p>We've implemented comprehensive monitoring to track:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Concurrency conflicts (frequency, resolution times)</li>
              <li>Offline operation duration</li>
              <li>Sync success/failure rates</li>
              <li>Client-side error rates</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
