import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Check, X, Coffee } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  tag?: string;
}

interface AttendanceRecord {
  member_id: string;
  status: 'present' | 'absent';
  communion: boolean;
}

interface AttendanceTotals {
  present: number;
  absent: number;
  communion: number;
}

function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [totals, setTotals] = useState<AttendanceTotals>({
    present: 0,
    absent: 0,
    communion: 0
  });

  useEffect(() => {
    fetchMembers();
    fetchAttendance();
    fetchMarkedDates();
  }, [date]);

  useEffect(() => {
    // Calculate totals whenever attendance changes
    const newTotals = Object.values(attendance).reduce(
      (acc, record) => ({
        present: acc.present + (record.status === 'present' ? 1 : 0),
        absent: acc.absent + (record.status === 'absent' ? 1 : 0),
        communion: acc.communion + (record.communion ? 1 : 0)
      }),
      { present: 0, absent: 0, communion: 0 }
    );
    setTotals(newTotals);
  }, [attendance]);

  const fetchMarkedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('date')
        .eq('status', 'present')
        .order('date');
      
      if (error) throw error;
      
      const dates = [...new Set((data || []).map(record => record.date))];
      setMarkedDates(dates);
    } catch (error) {
      console.error('Error fetching marked dates:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, tag')
        .order('name');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);
      
      if (error) throw error;
      
      const attendanceMap = (data || []).reduce((acc: Record<string, AttendanceRecord>, record) => {
        acc[record.member_id] = {
          member_id: record.member_id,
          status: record.status,
          communion: record.communion || false,
        };
        return acc;
      }, {});
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAttendanceChange = async (memberId: string, type: 'status' | 'communion', value: 'present' | 'absent' | boolean) => {
    setLoading(true);
    try {
      const existingRecord = attendance[memberId];
      const newRecord = {
        ...existingRecord,
        [type]: value,
      };
      
      if (existingRecord) {
        const { error } = await supabase
          .from('attendance')
          .update(newRecord)
          .eq('member_id', memberId)
          .eq('date', date);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert([{
            member_id: memberId,
            date,
            status: type === 'status' ? value : 'absent',
            communion: type === 'communion' ? value : false,
          }]);
        
        if (error) throw error;
      }
      
      setAttendance(prev => ({
        ...prev,
        [memberId]: {
          member_id: memberId,
          status: type === 'status' ? value as 'present' | 'absent' : (existingRecord?.status || 'absent'),
          communion: type === 'communion' ? value as boolean : (existingRecord?.communion || false),
        },
      }));
      
      fetchMarkedDates();
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Tracking</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Present: {totals.present}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Absent: {totals.absent}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              Communion: {totals.communion}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              markedDates.includes(date) ? 'bg-green-100' : ''
            }`}
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {members.map((member) => {
            const record = attendance[member.id];
            return (
              <li key={member.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      {member.tag && (
                        <p className="text-sm text-gray-500">{member.tag}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={loading}
                      onClick={() => handleAttendanceChange(member.id, 'status', 'present')}
                      className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                        record?.status === 'present'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Present
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => handleAttendanceChange(member.id, 'status', 'absent')}
                      className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                        record?.status === 'absent'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Absent
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => handleAttendanceChange(member.id, 'communion', !record?.communion)}
                      className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                        record?.communion
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Coffee className="h-4 w-4 mr-1" />
                      Communion
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default Attendance;