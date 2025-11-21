
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Profile.css';

const API_BASE = "http://localhost:5000/api";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewPic, setPreviewPic] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiRequest('/auth/me', 'GET', null, true);
  setUser(userData);
  setBio(userData.bio || "");
  setSkills(userData.skills ? userData.skills.join(", ") : "");
  setPreviewPic(userData.profilePicture || "");
      } catch (err) {
        alert('❌ Failed to load profile. Please login.');
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };


  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setBio(user.bio || "");
    setSkills(user.skills ? user.skills.join(", ") : "");
    setPreviewPic(user.profilePicture || "");
    setProfilePicture(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Update bio and skills
      await apiRequest('/users/profile', 'PUT', { bio, skills }, true);

      // Update profile picture if changed
      if (profilePicture) {
        const formData = new FormData();
        formData.append('profilePicture', profilePicture);
        await fetch(`${API_BASE}/users/profile-picture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        });
      }
      // Refresh user info
      const userData = await apiRequest('/auth/me', 'GET', null, true);
      setUser(userData);
      setBio(userData.bio || "");
      setSkills(userData.skills ? userData.skills.join(", ") : "");
      setPreviewPic(userData.profilePicture || "");
      setProfilePicture(null);
      setEditMode(false);
      alert('Profile updated!');
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-container">
      <main>
        <h1>My Profile</h1>
        <section id="user-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <img
                src={previewPic ? (previewPic.startsWith('http') ? previewPic : `http://localhost:5000${previewPic}`) : '/default-profile.png'}
                alt="Profile"
                style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0eaff' }}
              />
            </div>
            <div>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
          {editMode ? (
            <form onSubmit={handleSave} style={{ marginTop: 24 }}>
              <label>Bio:</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
              <label>Skills (comma separated):</label>
              <input type="text" value={skills} onChange={e => setSkills(e.target.value)} />
              <label>Profile Picture:</label>
              <input type="file" accept="image/*" onChange={e => {
                setProfilePicture(e.target.files[0]);
                setPreviewPic(URL.createObjectURL(e.target.files[0]));
              }} />
              <div style={{ marginTop: 16 }}>
                <button type="submit">Save</button>
                <button type="button" onClick={handleCancel} style={{ marginLeft: 12 }}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <p><strong>Bio:</strong> {user.bio || <span style={{ color: '#aaa' }}>No bio</span>}</p>
              <p><strong>Skills:</strong> {user.skills && user.skills.length > 0 ? user.skills.join(", ") : <span style={{ color: '#aaa' }}>No skills</span>}</p>
              <button onClick={handleEdit}>Edit Profile</button>
            </>
          )}
        </section>

        <h2>My Enrolled Courses</h2>
        <ul id="enrolled-courses">
          {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
            user.enrolledCourses.map((course) => (
              <li key={course._id}>{course.title}</li>
            ))
          ) : (
            <li>No enrolled courses yet.</li>
          )}
        </ul>
      </main>
    </div>
  );
};

export default Profile;
