"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HealthScoreDataPoint {
  date: string;
  score: number;
  diagnosis: string;
  doctor: string;
  analysis?: string;
}

interface HealthScoreGraphProps {
  healthScores: HealthScoreDataPoint[];
  isLoading?: boolean;
}

export default function HealthScoreGraph({
  healthScores,
  isLoading = false,
}: HealthScoreGraphProps) {
  const [chartData, setChartData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  });

  const [selectedPoint, setSelectedPoint] =
    useState<HealthScoreDataPoint | null>(null);

  useEffect(() => {
    if (healthScores && healthScores.length > 0) {
      // Sort data points by date - CHRONOLOGICALLY from oldest to newest
      const sortedScores = [...healthScores].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Prepare data for chart
      const data = {
        labels: sortedScores.map((item) =>
          format(new Date(item.date), "MMM d, yyyy")
        ),
        datasets: [
          {
            label: "Health Score",
            data: sortedScores.map((item) => item.score),
            fill: false,
            backgroundColor: "rgba(37, 99, 235, 0.8)",
            borderColor: "rgba(37, 99, 235, 0.8)",
            tension: 0.3,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      };

      setChartData(data);
    }
  }, [healthScores]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const pointIndex = context.dataIndex;
            const sortedScores = [...healthScores].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            const data = sortedScores[pointIndex];

            return [
              `Score: ${data.score}`,
              `Diagnosis: ${data.diagnosis}`,
              `Date: ${format(new Date(data.date), "PP")}`,
            ];
          },
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const sortedScores = [...healthScores].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setSelectedPoint(sortedScores[index]);
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Health Score",
        },
        ticks: {
          stepSize: 20,
        },
      },
      x: {
        title: {
          display: true,
          text: "Visit Date",
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Health Score Progression</h3>

      {healthScores.length > 0 ? (
        <>
          <div className="h-80">
            <Line data={chartData} options={options as any} />
          </div>

          {selectedPoint && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">
                Dr. {selectedPoint.doctor} -{" "}
                {format(new Date(selectedPoint.date), "PPP")}
              </h4>
              <p className="text-sm mt-1">
                Diagnosis: {selectedPoint.diagnosis}
              </p>
              <div className="flex items-center mt-2">
                <div className="mr-4">
                  <span className="text-sm text-gray-500">Health Score</span>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedPoint.score}
                  </p>
                </div>
                {selectedPoint.analysis && (
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      {selectedPoint.analysis}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No health score data available</p>
        </div>
      )}
    </div>
  );
}
