import React, { useEffect, useState } from 'react';
import { Users, Scale as Male, Scale as Female, UserCheck, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, addDays } from 'date-fns';

interface DashboardStats {
  totalMembers: number;
  maleCount: number;
  femaleCount: number;
  teenagerCount: number;
  highestAttendanceDate: string;
  lowestAttendanceDate: string;
  highestAttendanceCount: number;
  lowestAttendanceCount: number;
}

interface AttendanceCount {
  date: string;
  count: number;
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    maleCount: 0,
    femaleCount: 0,
    teenagerCount: 0,
    highestAttendanceDate: '',
    lowestAttendanceDate: '',
    highestAttendanceCount: 0,
    lowestAttendanceCount: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch members data
      const { data: members } = await supabase.from('members').select('*');

      // Fetch attendance data grouped by date
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('status', 'present');

      if (members && attendanceData) {
        // Process attendance data
        const attendanceCounts = attendanceData.reduce((acc: Record<string, number>, record) => {
          acc[record.date] = (acc[record.date] || 0) + 1;
          return acc;
        }, {});

        const attendanceStats = Object.entries(attendanceCounts).map(([date, count]) => ({
          date,
          count,
        }));

        // Sort by count to find highest and lowest attendance
        attendanceStats.sort((a, b) => b.count - a.count);

        const highest = attendanceStats[0] || { date: '', count: 0 };
        const lowest = attendanceStats[attendanceStats.length - 1] || { date: '', count: 0 };

        // Add one day to fix the date offset
        const highestDate = highest.date ? addDays(new Date(highest.date), 1) : new Date();
        const lowestDate = lowest.date ? addDays(new Date(lowest.date), 1) : new Date();

        setStats({
          totalMembers: members.length,
          maleCount: members.filter(m => m.gender === 'male').length,
          femaleCount: members.filter(m => m.gender === 'female').length,
          teenagerCount: members.filter(m => m.isTeenager).length,
          highestAttendanceDate: highest.date ? format(highestDate, 'MMM dd, yyyy') : 'No data',
          lowestAttendanceDate: lowest.date ? format(lowestDate, 'MMM dd, yyyy') : 'No data',
          highestAttendanceCount: highest.count,
          lowestAttendanceCount: lowest.count,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.totalMembers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Male className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Male Members</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.maleCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Female className="h-6 w-6 text-pink-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Female Members</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.femaleCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Teenage Members</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.teenagerCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Highest Attendance</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.highestAttendanceDate}
                    <span className="text-sm text-gray-500 ml-2">({stats.highestAttendanceCount} members)</span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Lowest Attendance</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.lowestAttendanceDate}
                    <span className="text-sm text-gray-500 ml-2">({stats.lowestAttendanceCount} members)</span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;