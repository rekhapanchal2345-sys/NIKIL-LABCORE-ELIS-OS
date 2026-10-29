"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, Clock, DollarSign, Users, Activity } from "lucide-react";

interface PerformanceData {
  testVolumeByDepartment: any[];
  revenueTrends: any[];
  turnaroundTime: any[];
  topReferringDoctors: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function LabPerformanceAnalytics() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from an analytics API
        // For now, we'll use mock data
        const mockData: PerformanceData = {
          testVolumeByDepartment: [
            { name: 'Hematology', volume: 450, percentage: 35 },
            { name: 'Biochemistry', volume: 380, percentage: 30 },
            { name: 'Microbiology', volume: 220, percentage: 17 },
            { name: 'Immunology', volume: 150, percentage: 12 },
            { name: 'Histopathology', volume: 80, percentage: 6 },
          ],
          revenueTrends: [
            { month: 'Jan', revenue: 45000 },
            { month: 'Feb', revenue: 52000 },
            { month: 'Mar', revenue: 48000 },
            { month: 'Apr', revenue: 61000 },
            { month: 'May', revenue: 55000 },
            { month: 'Jun', revenue: 67000 },
          ],
          turnaroundTime: [
            { test: 'CBC', avgTime: 2.5, target: 2 },
            { test: 'Lipid Profile', avgTime: 4.2, target: 4 },
            { test: 'Thyroid', avgTime: 3.8, target: 3 },
            { test: 'KFT', avgTime: 5.1, target: 5 },
            { test: 'LFT', avgTime: 4.5, target: 4 },
          ],
          topReferringDoctors: [
            { name: 'Dr. Smith', referrals: 45, revenue: 125000 },
            { name: 'Dr. Johnson', referrals: 38, revenue: 98000 },
            { name: 'Dr. Williams', referrals: 32, revenue: 85000 },
            { name: 'Dr. Brown', referrals: 28, revenue: 72000 },
            { name: 'Dr. Davis', referrals: 25, revenue: 68000 },
          ],
        };
        
        setData(mockData);
      } catch (err) {
        console.error("Error fetching performance data:", err);
        setError("Failed to load performance analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <Activity className="h-5 w-5" />
          <p className="text-sm font-medium">Failed to load performance analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Turnaround Time</p>
              <p className="text-2xl font-bold text-gray-900">3.8h</p>
              <p className="text-xs text-green-600 mt-1">↓ 12% vs last month</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹6.7L</p>
              <p className="text-xs text-green-600 mt-1">↑ 8% vs last month</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Doctors</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-xs text-green-600 mt-1">↑ 3 new this month</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Test Volume</p>
              <p className="text-2xl font-bold text-gray-900">1,280</p>
              <p className="text-xs text-green-600 mt-1">↑ 15% vs last month</p>
            </div>
            <Activity className="h-8 w-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Volume by Department */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Volume by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.testVolumeByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volume" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trends (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Turnaround Time Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Turnaround Time Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.turnaroundTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="test" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgTime" fill="#F59E0B" name="Actual Time" />
              <Bar dataKey="target" fill="#10B981" name="Target Time" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Referring Doctors */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Referring Doctors
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topReferringDoctors} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="referrals" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Department Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.testVolumeByDepartment}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="volume"
            >
              {data.testVolumeByDepartment.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}