import { Eye, EyeOff } from 'lucide-react';
import { Button, InputField } from '../components/ui';
import { getUsers, saveUsers } from '../storage';
import { countriesWithCities, avatarOptions } from '../data';

type ModalsProps = {
  // Avatar picker
  showAvatarPicker: boolean;
  setShowAvatarPicker: (v: boolean) => void;
  selectedAvatar: string;
  setSelectedAvatar: (v: string) => void;

  // Logout
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (v: boolean) => void;
  handleLogout: () => void;

  // Forgot password
  showForgotPassword: boolean;
  setShowForgotPassword: (v: boolean) => void;
  forgotEmail: string;
  setForgotEmail: (v: string) => void;
  forgotSent: boolean;
  setForgotSent: (v: boolean) => void;

  // Edit profile
  isEditingProfile: boolean;
  setIsEditingProfile: (v: boolean) => void;
  editName: string; setEditName: (v: string) => void;
  editEmail: string; setEditEmail: (v: string) => void;
  editPhone: string; setEditPhone: (v: string) => void;
  editCountry: string; setEditCountry: (v: string) => void;
  editCity: string; setEditCity: (v: string) => void;
  editOldPassword: string; setEditOldPassword: (v: string) => void;
  editNewPassword: string; setEditNewPassword: (v: string) => void;
  editConfirmPassword: string; setEditConfirmPassword: (v: string) => void;
  editErrors: Record<string, string>; setEditErrors: (v: Record<string, string>) => void;
  editSuccess: string; setEditSuccess: (v: string) => void;
  showEditOldPass: boolean; setShowEditOldPass: (v: boolean) => void;
  showEditNewPass: boolean; setShowEditNewPass: (v: boolean) => void;
  showEditConfirmPass: boolean; setShowEditConfirmPass: (v: boolean) => void;
  user: any; setUser: (u: any) => void;
};

export default function Modals({
  showAvatarPicker, setShowAvatarPicker, selectedAvatar, setSelectedAvatar,
  showLogoutConfirm, setShowLogoutConfirm, handleLogout,
  showForgotPassword, setShowForgotPassword, forgotEmail, setForgotEmail, forgotSent, setForgotSent,
  isEditingProfile, setIsEditingProfile,
  editName, setEditName, editEmail, setEditEmail,
  editPhone, setEditPhone, editCountry, setEditCountry,
  editCity, setEditCity, editOldPassword, setEditOldPassword,
  editNewPassword, setEditNewPassword, editConfirmPassword, setEditConfirmPassword,
  editErrors, setEditErrors, editSuccess, setEditSuccess,
  showEditOldPass, setShowEditOldPass,
  showEditNewPass, setShowEditNewPass,
  showEditConfirmPass, setShowEditConfirmPass,
  user, setUser,
}: ModalsProps) {
  return (
    <>
      {/* AVATAR PICKER */}
      {showAvatarPicker && (
        <div className="modal-overlay" onClick={() => setShowAvatarPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Choose profile icon</h3>
            <p className="muted">Pick an icon for your profile</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
              {avatarOptions.map((avatar, i) => (
                <button key={i} onClick={() => { setSelectedAvatar(avatar); setShowAvatarPicker(false); }}
                  style={{ border: selectedAvatar === avatar ? '2px solid #4f46e5' : '1px solid #ddd', borderRadius: '12px', padding: '4px', background: 'white', cursor: 'pointer' }}>
                  <img src={avatar} alt={`avatar-${i}`} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '10px' }} />
                </button>
              ))}
            </div>
            <div className="button-row mt-16">
              <Button variant="secondary" onClick={() => setShowAvatarPicker(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Log out?</h3>
            <p className="muted">Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button onClick={() => { handleLogout(); setShowLogoutConfirm(false); }}>Log Out</Button>
            </div>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reset Password</h3>
            {forgotSent ? (
              <>
                <p className="muted" style={{ marginTop: '12px' }}>
                  If an account with <strong>{forgotEmail}</strong> exists, a reset link has been sent.
                </p>
                <Button className="full-width" style={{ marginTop: '16px' }}
                  onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}>
                  Back to Login
                </Button>
              </>
            ) : (
              <>
                <p className="muted" style={{ marginTop: '8px' }}>Enter your email and we'll send a reset link.</p>
                <InputField placeholder="Email Address" value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)} style={{ marginTop: '16px' }} />
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <Button variant="secondary" onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}>Cancel</Button>
                  <Button onClick={() => {
                    if (!forgotEmail.includes('@')) { alert('Please enter a valid email with @'); return; }
                    setForgotSent(true);
                  }}>Send Reset Link</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* EDIT PROFILE */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
          <div className="modal" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <p className="muted" style={{ marginBottom: '16px' }}>Update your account information</p>

            {editSuccess && (
              <p style={{ color: 'green', fontSize: '14px', marginBottom: '12px', background: '#f0fdf4', padding: '10px', borderRadius: '8px' }}>
                ✅ {editSuccess}
              </p>
            )}

            <p className="field-label">Profile Avatar</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {avatarOptions.map((avatar, i) => (
                <button key={i} onClick={() => setSelectedAvatar(avatar)}
                  style={{ border: selectedAvatar === avatar ? '2px solid #4f46e5' : '1px solid #ddd', borderRadius: '50%', padding: '2px', background: 'white', cursor: 'pointer', width: '52px', height: '52px', overflow: 'hidden' }}>
                  <img src={avatar} alt={`avatar-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </button>
              ))}
            </div>

            <p className="field-label">Full Name</p>
            <InputField placeholder="Full Name" value={editName} onChange={e => setEditName(e.target.value)} style={{ marginBottom: '4px' }} />
            {editErrors.name && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.name}</p>}

            <p className="field-label" style={{ marginTop: '12px' }}>Email</p>
            <InputField placeholder="Email Address" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ marginBottom: '4px' }} />
            {editErrors.email && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.email}</p>}
            {editEmail !== user.email && editEmail.includes('@') && (
              <p style={{ color: '#4f46e5', fontSize: '12px', marginBottom: '8px' }}>📧 A confirmation will be sent to your new email</p>
            )}

            <p className="field-label" style={{ marginTop: '12px' }}>Phone</p>
            <InputField placeholder="Phone Number" value={editPhone} maxLength={16}
              onChange={e => { const val = e.target.value.replace(/[^\d+\s\-]/g, ''); setEditPhone(val); }}
              style={{ marginBottom: '4px' }} />
            {editErrors.phone && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.phone}</p>}

            <p className="field-label" style={{ marginTop: '12px' }}>Country</p>
            <select className="select" value={editCountry}
              onChange={e => { setEditCountry(e.target.value); setEditCity(''); }} style={{ marginBottom: '4px' }}>
              <option value="">Select Country</option>
              {Object.keys(countriesWithCities).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {editErrors.country && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.country}</p>}

            {editCountry && (
              <>
                <p className="field-label" style={{ marginTop: '12px' }}>City</p>
                <select className="select" value={editCity} onChange={e => setEditCity(e.target.value)} style={{ marginBottom: '4px' }}>
                  <option value="">Select City</option>
                  {(countriesWithCities[editCountry] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {editErrors.city && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.city}</p>}
              </>
            )}

            <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
              <p style={{ fontWeight: '600', marginBottom: '12px' }}>
                Change Password <span className="muted" style={{ fontWeight: 400, fontSize: '13px' }}>(optional)</span>
              </p>

              {[
                { label: 'Current Password', value: editOldPassword, set: setEditOldPassword, show: showEditOldPass, setShow: setShowEditOldPass, error: editErrors.oldPassword },
                { label: 'New Password', value: editNewPassword, set: setEditNewPassword, show: showEditNewPass, setShow: setShowEditNewPass, error: editErrors.newPassword },
                { label: 'Confirm New Password', value: editConfirmPassword, set: setEditConfirmPassword, show: showEditConfirmPass, setShow: setShowEditConfirmPass, error: editErrors.confirmPassword },
              ].map(field => (
                <div key={field.label}>
                  <p className="field-label" style={{ marginTop: '12px' }}>{field.label}</p>
                  <div style={{ position: 'relative', marginBottom: '4px' }}>
                    <InputField type={field.show ? 'text' : 'password'} placeholder={field.label}
                      value={field.value} onChange={e => field.set(e.target.value)} style={{ paddingRight: '42px' }} />
                    <button type="button" onClick={() => field.setShow(!field.show)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                      {field.show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {field.error && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{field.error}</p>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
              <Button onClick={() => {
                const errors: Record<string, string> = {};
                const nameParts = editName.trim().split(' ').filter(Boolean);
                if (!editName.trim()) errors.name = 'Full name is required';
                else if (nameParts.length < 2) errors.name = 'Enter first and last name';
                if (!editEmail.trim()) errors.email = 'Email is required';
                else if (!editEmail.includes('@')) errors.email = 'Email must contain @';
                if (!editPhone.trim()) errors.phone = 'Phone is required';
                else if (!editPhone.startsWith('+')) errors.phone = 'Phone must start with +';
                else if (editPhone.replace(/\D/g, '').length < 7) errors.phone = 'Phone is too short';
                if (!editCountry) errors.country = 'Please select a country';
                if (editCountry && !editCity) errors.city = 'Please select a city';

                if (editOldPassword || editNewPassword || editConfirmPassword) {
                  const users = getUsers();
                  const current = users.find(u => u.email === user.email);
                  if (!editOldPassword) errors.oldPassword = 'Enter your current password';
                  else if (current && current.password !== editOldPassword) errors.oldPassword = 'Current password is incorrect';
                  if (!editNewPassword) errors.newPassword = 'Enter new password';
                  else if (editNewPassword.length < 6) errors.newPassword = 'Min 6 characters';
                  else if (!/\d/.test(editNewPassword)) errors.newPassword = 'Must contain at least one number';
                  if (editNewPassword && editConfirmPassword && editNewPassword !== editConfirmPassword)
                    errors.confirmPassword = 'Passwords do not match';
                }

                setEditErrors(errors);
                if (Object.keys(errors).length > 0) return;

                const users = getUsers();
                const idx = users.findIndex(u => u.email === user.email);
                if (idx !== -1) {
                  users[idx].name = editName.trim();
                  users[idx].email = editEmail.trim();
                  users[idx].phone = editPhone.trim();
                  users[idx].country = editCountry;
                  users[idx].city = editCity;
                  if (editNewPassword) users[idx].password = editNewPassword;
                  saveUsers(users);
                }

                const updated = { ...user, name: editName.trim(), email: editEmail.trim(), phone: editPhone.trim(), country: editCountry, city: editCity };
                setUser(updated);
                localStorage.setItem('currentUser', JSON.stringify(updated));
                setEditSuccess('Profile updated successfully!');
                setTimeout(() => { setIsEditingProfile(false); setEditSuccess(''); }, 1500);
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}