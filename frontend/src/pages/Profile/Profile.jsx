import React, { useContext, useEffect, useMemo, useState } from 'react';
import './Profile.css';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-hot-toast';

const EyeIcon = ({ open }) => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='1.8' />
    {!open && <path d='M4 20L20 4' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />}
  </svg>
);

const Profile = () => {
  const { url, token } = useContext(StoreContext);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePopup, setShowChangePopup] = useState(false);
  const [isPopupShaking, setIsPopupShaking] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const getMaskedEmail = (inputEmail) => {
    if (!inputEmail || !inputEmail.includes('@')) return '';
    const [localPart, domain] = inputEmail.split('@');
    if (localPart.length <= 3) {
      return `${'*'.repeat(localPart.length)}@${domain}`;
    }

    const prefix = localPart.slice(0, 2);
    const suffix = localPart.slice(5);
    return `${prefix}***${suffix}@${domain}`;
  };

  const displayedPassword = useMemo(
    () => (showPassword ? 'your_password' : '********'),
    [showPassword]
  );
  const accountName = useMemo(
    () => (email?.includes('@') ? email.split('@')[0] : 'Guest'),
    [email]
  );
  const profileInitial = useMemo(
    () => (accountName ? accountName.charAt(0).toUpperCase() : 'G'),
    [accountName]
  );

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${url}/api/user/profile`, { headers: { token } });
      if (response.data.success) {
        setEmail(response.data.data.email || '');
      } else {
        toast.error(response.data.message || 'Cannot load profile');
      }
    } catch (error) {
      toast.error('Cannot load profile');
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const validateForm = () => {
    const errors = {};
    if (!passwordForm.oldPassword) errors.oldPassword = 'Please enter your old password';
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Please enter a new password';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Please enter a strong password (at least 8 characters)';
    }
    if (!passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = 'Confirm password does not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post(
        `${url}/api/user/change-password`,
        passwordForm,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Password changed successfully');
        setShowChangePopup(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
        setFieldErrors({});
      } else {
        if (response.data.message === 'Please enter a strong password') {
          setFieldErrors((prev) => ({ ...prev, newPassword: 'Please enter a strong password (at least 8 characters)' }));
        } else if (response.data.message === 'Confirm password does not match') {
          setFieldErrors((prev) => ({ ...prev, confirmNewPassword: 'Confirm password does not match' }));
        } else if (response.data.message === 'Old password is incorrect') {
          setFieldErrors((prev) => ({ ...prev, oldPassword: 'Old password is incorrect' }));
        } else {
          toast.error(response.data.message || 'Change password failed');
        }
      }
    } catch (error) {
      toast.error('Change password failed');
    }
  };

  const onInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleOverlayClick = () => {
    setIsPopupShaking(true);
    setTimeout(() => setIsPopupShaking(false), 350);
  };

  return (
    <div className='profile-page'>
      <div className='profile-hero'>
        <div className='profile-avatar'>{profileInitial}</div>
        <div className='profile-hero-content'>
          <p className='profile-kicker'>Account Center</p>
          <h1>My Profile</h1>
          <p className='profile-subtitle'>Manage your profile information to secure your account.</p>
        </div>
      </div>

      <div className='profile-card'>
        <div className='profile-main-grid'>
          <div className='profile-column'>
            <div className='profile-field'>
              <label>Email</label>
              <input type='text' value={getMaskedEmail(email)} readOnly />
            </div>
            <div className='profile-field'>
              <label>Password</label>
              <div className='password-view-box'>
                <input type='text' value={displayedPassword} readOnly />
                <button type='button' className='eye-btn' onClick={() => setShowPassword((prev) => !prev)}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
          </div>

          <div className='profile-column profile-security-panel'>
            <h3>Security Actions</h3>
            <p>Keep your account safe by changing your password regularly and using a strong password.</p>
            <ul className='profile-tips'>
              <li>At least 8 characters</li>
              <li>Avoid reusing old passwords</li>
            </ul>
            <button type='button' className='change-password-btn' onClick={() => setShowChangePopup(true)}>
              Change password
            </button>
          </div>
        </div>
      </div>

      {showChangePopup && (
        <div className='profile-popup-overlay' onClick={handleOverlayClick}>
          <div
            className={`profile-popup ${isPopupShaking ? 'popup-shake' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Change password</h2>
            <form onSubmit={handleChangePassword}>
              <div className='profile-field'>
                <label>Old password</label>
                <input
                  type='password'
                  name='oldPassword'
                  value={passwordForm.oldPassword}
                  onChange={onInputChange}
                />
                {fieldErrors.oldPassword && <span className='field-error'>{fieldErrors.oldPassword}</span>}
              </div>

              <div className='profile-field'>
                <label>New password</label>
                <input
                  type='password'
                  name='newPassword'
                  value={passwordForm.newPassword}
                  onChange={onInputChange}
                />
                {fieldErrors.newPassword && <span className='field-error'>{fieldErrors.newPassword}</span>}
              </div>

              <div className='profile-field'>
                <label>Confirm new password</label>
                <input
                  type='password'
                  name='confirmNewPassword'
                  value={passwordForm.confirmNewPassword}
                  onChange={onInputChange}
                />
                {fieldErrors.confirmNewPassword && (
                  <span className='field-error'>{fieldErrors.confirmNewPassword}</span>
                )}
              </div>

              <div className='popup-actions'>
                <button type='button' className='btn-outline' onClick={() => setShowChangePopup(false)}>
                  Cancel
                </button>
                <button type='submit' className='btn-primary'>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
