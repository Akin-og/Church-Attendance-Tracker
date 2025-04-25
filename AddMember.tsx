import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Pencil, Trash2, UserPlus, Check, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';

interface Member {
  id: string;
  name: string;
  birthday: string | null;
  phone: string | null;
  email: string | null;
  tag: string | null;
  gender: string;
  isTeenager: boolean;
  isBaptized: boolean;
  hasTakenCommunion: boolean;
}

function AddMember() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    phone: '',
    email: '',
    tag: '',
    gender: 'male',
    isTeenager: false,
    isBaptized: false,
    hasTakenCommunion: false,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleExport = () => {
    const exportData = members.map(member => ({
      name: member.name,
      birthday: member.birthday || '',
      phone: member.phone || '',
      email: member.email || '',
      tag: member.tag || '',
      gender: member.gender,
      isTeenager: member.isTeenager ? 'true' : 'false',
      isBaptized: member.isBaptized ? 'true' : 'false',
      hasTakenCommunion: member.hasTakenCommunion ? 'true' : 'false'
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'members.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportError('');
    setImportSuccess('');

    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const importedMembers = results.data.map((row: any) => ({
            name: row.name,
            birthday: row.birthday || null,
            phone: row.phone || null,
            email: row.email || null,
            tag: row.tag || null,
            gender: row.gender || 'male',
            isTeenager: row.isTeenager === 'true',
            isBaptized: row.isBaptized === 'true',
            hasTakenCommunion: row.hasTakenCommunion === 'true'
          }));

          const { error } = await supabase
            .from('members')
            .insert(importedMembers);

          if (error) throw error;

          setImportSuccess(`Successfully imported ${importedMembers.length} members`);
          fetchMembers();
        } catch (error) {
          console.error('Error importing members:', error);
          setImportError('Error importing members. Please check the file format and try again.');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setImportError('Error parsing CSV file. Please check the file format and try again.');
      }
    });

    // Reset the input
    event.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...formData,
        birthday: formData.birthday !== "" ? formData.birthday : null,
        phone: formData.phone || null,
        email: formData.email || null,
        tag: formData.tag || null
      };

      if (isEditing && selectedMember) {
        const { error } = await supabase
          .from('members')
          .update(submissionData)
          .eq('id', selectedMember.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('members')
          .insert([submissionData]);
        
        if (error) throw error;
      }
      
      fetchMembers();
      resetForm();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Error saving member. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', selectedMember.id);
      
      if (error) throw error;
      
      fetchMembers();
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Error deleting member. Please try again.');
    }
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      birthday: member.birthday || '',
      phone: member.phone || '',
      email: member.email || '',
      tag: member.tag || '',
      gender: member.gender,
      isTeenager: member.isTeenager,
      isBaptized: member.isBaptized,
      hasTakenCommunion: member.hasTakenCommunion,
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birthday: '',
      phone: '',
      email: '',
      tag: '',
      gender: 'male',
      isTeenager: false,
      isBaptized: false,
      hasTakenCommunion: false,
    });
    setShowAddModal(false);
    setIsEditing(false);
    setSelectedMember(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Members Management</h1>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Members
          </button>
          <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import Members
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {importError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {importError}
        </div>
      )}

      {importSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {importSuccess}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-indigo-600">{member.name}</p>
                    {member.tag && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {member.tag}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <p>{member.email || 'No email'} • {member.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center p-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
                    Birthday
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    id="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="tag" className="block text-sm font-medium text-gray-700">
                    Tag
                  </label>
                  <input
                    type="text"
                    name="tag"
                    id="tag"
                    value={formData.tag}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isTeenager"
                      id="isTeenager"
                      checked={formData.isTeenager}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isTeenager" className="ml-2 block text-sm text-gray-900">
                      Is Teenager
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isBaptized"
                      id="isBaptized"
                      checked={formData.isBaptized}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isBaptized" className="ml-2 block text-sm text-gray-900">
                      Is Baptized
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasTakenCommunion"
                      id="hasTakenCommunion"
                      checked={formData.hasTakenCommunion}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="hasTakenCommunion" className="ml-2 block text-sm text-gray-900">
                      Has Taken Communion
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isEditing ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Member</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {selectedMember?.name}? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddMember;