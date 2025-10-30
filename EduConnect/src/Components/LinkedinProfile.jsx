import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Mail, Phone, Calendar, Award, Briefcase, GraduationCap, Heart, MessageCircle, Share2, Edit2, Plus, X } from 'lucide-react';

const getProfileImageUrl = (profilePicUrl) =>
  profilePicUrl ? `https://neuraliftx.onrender.com${profilePicUrl}` : "https://via.placeholder.com/150";

export default function LinkedInProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [profileData, setProfileData] = useState({
    bio: '',
    percentage: '',
    className: '',
    internshipsDone: '',
    coursesCompleted: '',
    areaOfInterest: '',
    location: '',
    phone: '',
  });

  const token = localStorage.getItem('token_student');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('https://neuraliftx.onrender.com/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setUser(data.user);
      setProfileData({
        bio: data.user.bio || '',
        percentage: data.user.percentage || '',
        className: data.user.className || '',
        internshipsDone: (data.user.internshipsDone || []).join(', '),
        coursesCompleted: (data.user.coursesCompleted || []).join(', '),
        areaOfInterest: (data.user.areaOfInterest || []).join(', '),
        location: data.user.location || '',
        phone: data.user.phone || '',
      });
      setPreviewUrl(getProfileImageUrl(data.user.profilePicUrl));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePic', selectedFile);

    try {
      const res = await fetch('https://neuraliftx.onrender.com/api/profile/picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUser((prev) => ({ ...prev, profilePicUrl: data.profilePicUrl }));
      setPreviewUrl(getProfileImageUrl(data.profilePicUrl));
      setSelectedFile(null);
      alert('Profile picture updated successfully!');
    } catch (error) {
      alert('Error uploading profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    const body = {
      bio: profileData.bio,
      percentage: Number(profileData.percentage),
      className: profileData.className,
      internshipsDone: profileData.internshipsDone.split(',').map((s) => s.trim()).filter(Boolean),
      coursesCompleted: profileData.coursesCompleted.split(',').map((s) => s.trim()).filter(Boolean),
      areaOfInterest: profileData.areaOfInterest.split(',').map((s) => s.trim()).filter(Boolean),
      location: profileData.location,
      phone: profileData.phone,
    };

    try {
      const res = await fetch('https://neuraliftx.onrender.com/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setUser(data.user);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-600">Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">EduConnect</h1>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          {/* Profile Info Section */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-20 left-6">
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-40 h-40 rounded-full border-4 border-white shadow-xl object-cover"
                />
                <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera className="w-5 h-5 text-gray-700" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <button
                    onClick={handleUploadPicture}
                    disabled={uploading}
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white px-4 py-1 rounded-full text-sm hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {uploading ? 'Uploading...' : 'Save Photo'}
                  </button>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* Name and Title */}
            <div className="mt-12 space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-xl text-gray-600">{profileData.bio || 'Student at EduConnect'}</p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profileData.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{profileData.phone}</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                  {user.roleIdValue}
                </div>
                {profileData.percentage && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {profileData.percentage}% Average
                  </div>
                )}
                {profileData.className && (
                  <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {profileData.className}
                  </div>
                )}
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {user.coins || 0} Coins
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Connect
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-md p-2">
              <div className="flex flex-wrap gap-2">
                {['about', 'experience', 'education', 'skills'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* About Section */}
            {activeTab === 'about' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    rows={6}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {profileData.bio || 'No bio added yet.'}
                  </p>
                )}
              </div>
            )}

            {/* Experience Section */}
            {activeTab === 'experience' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Experience</h2>
                  {isEditing && (
                    <button className="text-blue-600 hover:text-blue-700">
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Internships (comma separated)
                    </label>
                    <input
                      type="text"
                      name="internshipsDone"
                      value={profileData.internshipsDone}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Software Developer Intern at XYZ Corp, Data Analyst at ABC Inc"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileData.internshipsDone ? (
                      profileData.internshipsDone.split(',').map((internship, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{internship.trim()}</h3>
                            <p className="text-sm text-gray-600">Internship</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No internships added yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Education Section */}
            {activeTab === 'education' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Education</h2>
                  {isEditing && (
                    <button className="text-blue-600 hover:text-blue-700">
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Class
                      </label>
                      <input
                        type="text"
                        name="className"
                        value={profileData.className}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Grade 12, B.Tech CSE"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Percentage
                      </label>
                      <input
                        type="number"
                        name="percentage"
                        value={profileData.percentage}
                        onChange={handleChange}
                        min={0}
                        max={100}
                        step={0.01}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., 85.5"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {profileData.className || 'Class not specified'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Average: {profileData.percentage || 'N/A'}%
                        </p>
                        <p className="text-sm text-gray-600">EduConnect Institute</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skills Section */}
            {activeTab === 'skills' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Skills & Interests</h2>
                  {isEditing && (
                    <button className="text-blue-600 hover:text-blue-700">
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Areas of Interest (comma separated)
                      </label>
                      <input
                        type="text"
                        name="areaOfInterest"
                        value={profileData.areaOfInterest}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Machine Learning, Web Development, Data Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Courses Completed (comma separated)
                      </label>
                      <input
                        type="text"
                        name="coursesCompleted"
                        value={profileData.coursesCompleted}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Python for Data Science, Full Stack Development"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Areas of Interest</h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.areaOfInterest ? (
                          profileData.areaOfInterest.split(',').map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {skill.trim()}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-600">No interests added yet.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Courses Completed</h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.coursesCompleted ? (
                          profileData.coursesCompleted.split(',').map((course, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                            >
                              {course.trim()}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-600">No courses added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            {isEditing && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Contact Information</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  {profileData.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-700">{profileData.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {profileData.location || 'Not specified'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Achievements Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-yellow-600" />
                    <span className="font-semibold text-gray-900">Total Coins</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">{user.coins || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-gray-900">Courses</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {profileData.coursesCompleted ? profileData.coursesCompleted.split(',').length : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-gray-900">Internships</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {profileData.internshipsDone ? profileData.internshipsDone.split(',').length : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Completed Quiz on Data Structures</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Earned 50 coins for perfect attendance</p>
                    <p className="text-xs text-gray-500">5 days ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Joined Web Development course</p>
                    <p className="text-xs text-gray-500">1 week ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}