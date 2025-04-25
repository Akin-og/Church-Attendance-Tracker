import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { format, subDays, startOfDay } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Trophy, Tag } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  communion: number;
}

interface DemographicData {
  male: number;
  female: number;
  teenager: number;
  adult: number;
}

interface TopAttender {
  name: string;
  attendance_count: number;
}

interface TagCount {
  tag: string;
  count: number;
}

function Insights() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [demographicData, setDemographicData] = useState<DemographicData>({
    male: 0,
    female: 0,
    teenager: 0,
    adult: 0,
  });
  const [topAttenders, setTopAttenders] = useState<TopAttender[]>([]);
  const [tagCounts, setTagCounts] = useState<TagCount[]>([]);

  useEffect(() => {
    fetchAttendanceData();
    fetchDemographicData();
    fetchTopAttenders();
    fetchTagCounts();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const endDate = startOfDay(new Date());
      const startDate = subDays(endDate, 7);
      
      const { data: attendanceRecords, error } = await supabase
        .from('attendance')
        .select('date, status, communion')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;

      const groupedData = (attendanceRecords || []).reduce((acc: Record<string, { present: number; absent: number; communion: number }>, record) => {
        if (!acc[record.date]) {
          acc[record.date] = { present: 0, absent: 0, communion: 0 };
        }
        if (record.status === 'present') acc[record.date].present++;
        if (record.status === 'absent') acc[record.date].absent++;
        if (record.communion) acc[record.date].communion++;
        return acc;
      }, {});

      const formattedData = Object.entries(groupedData).map(([date, counts]) => ({
        date: format(new Date(date), 'MMM dd'),
        ...counts,
      }));

      setAttendanceData(formattedData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchTagCounts = async () => {
    try {
      const { data: members, error } = await supabase
        .from('members')
        .select('isBaptized, hasTakenCommunion, isTeenager');

      if (error) throw error;

      const counts = {
        baptized: 0,
        communion: 0,
        teenager: 0
      };

      members?.forEach(member => {
        if (member.isBaptized) counts.baptized++;
        if (member.hasTakenCommunion) counts.communion++;
        if (member.isTeenager) counts.teenager++;
      });

      const tagCountsList = [
        { tag: 'Baptized', count: counts.baptized },
        { tag: 'Communion', count: counts.communion },
        { tag: 'Teenager', count: counts.teenager }
      ];

      setTagCounts(tagCountsList);
    } catch (error) {
      console.error('Error fetching tag counts:', error);
    }
  };

  const fetchTopAttenders = async () => {
    try {
      const { data: attendanceCounts, error } = await supabase
        .from('attendance')
        .select('member_id, status')
        .eq('status', 'present');

      if (error) throw error;

      const memberCounts = (attendanceCounts || []).reduce((acc: Record<string, number>, record) => {
        acc[record.member_id] = (acc[record.member_id] || 0) + 1;
        return acc;
      }, {});

      const { data: members } = await supabase
        .from('members')
        .select('id, name');

      if (members) {
        const topAttendersList = members
          .map(member => ({
            name: member.name,
            attendance_count: memberCounts[member.id] || 0,
          }))
          .sort((a, b) => b.attendance_count - a.attendance_count)
          .slice(0, 5);

        setTopAttenders(topAttendersList);
      }
    } catch (error) {
      console.error('Error fetching top attenders:', error);
    }
  };

  const fetchDemographicData = async () => {
    try {
      const { data: members, error } = await supabase
        .from('members')
        .select('gender, isTeenager');

      if (error) throw error;

      const demographics = (members || []).reduce(
        (acc: DemographicData, member) => {
          if (member.gender === 'male') acc.male++;
          if (member.gender === 'female') acc.female++;
          if (member.isTeenager) acc.teenager++;
          if (!member.isTeenager) acc.adult++;
          return acc;
        },
        { male: 0, female: 0, teenager: 0, adult: 0 }
      );

      setDemographicData(demographics);
    } catch (error) {
      console.error('Error fetching demographic data:', error);
    }
  };

  const attendanceChartData = {
    labels: attendanceData.map(d => d.date),
    datasets: [
      {
        label: 'Present',
        data: attendanceData.map(d => d.present),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Absent',
        data: attendanceData.map(d => d.absent),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Communion',
        data: attendanceData.map(d => d.communion),
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
    ],
  };

  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [demographicData.male, demographicData.female],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(236, 72, 153, 0.5)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const ageChartData = {
    labels: ['Teenagers', 'Adults'],
    datasets: [
      {
        data: [demographicData.teenager, demographicData.adult],
        backgroundColor: [
          'rgba(16, 185, 129, 0.5)',
          'rgba(99, 102, 241, 0.5)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(99, 102, 241)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Top Attenders</h2>
          </div>
          <div className="space-y-4">
            {topAttenders.map((attender, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg font-medium text-gray-900 w-6">{index + 1}.</span>
                  <span className="ml-2 text-gray-800">{attender.name}</span>
                </div>
                <span className="text-gray-600">{attender.attendance_count} times</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Tag className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Member Tags</h2>
          </div>
          <div className="space-y-4">
            {tagCounts.map((tagCount, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                  {tagCount.tag}
                </span>
                <span className="text-gray-600">{tagCount.count} members</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Attendance</h2>
        <div className="h-64">
          <Bar
            data={attendanceChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gender Distribution</h2>
          <div className="h-64">
            <Pie
              data={genderChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Age Distribution</h2>
          <div className="h-64">
            <Pie
              data={ageChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Insights;