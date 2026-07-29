import React, { useState } from 'react';
import axios from 'axios';

const PRESET_AVATARS = [
  
];

export default function AvatarSelector({ onSelectAvatar }) {
  const [selectedId, setSelectedId] = useState('1');
  const [customAvatar, setCustomAvatar] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleSelectPreset = (avatar) => {
    setSelectedId(avatar.id);
    setUploadError('');
    if (onSelectAvatar) onSelectAvatar({ type: 'preset', data: avatar });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');

    const tempPreviewUrl = URL.createObjectURL(file);
    setCustomAvatar(tempPreviewUrl);
    setSelectedId('custom');

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const response = await axios.post('/api/v1/users/uploadfile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        withCredentials: true,
      });

      const uploadedUrl = response.data?.url || tempPreviewUrl;
      setCustomAvatar(uploadedUrl);

      if (onSelectAvatar) {
        onSelectAvatar({ type: 'custom', data: uploadedUrl });
      }
    } catch (error) {
      console.error('avatar upload failed:', error);
      setUploadError('upload failed, please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md w-[100px] h-[100px] shadow-lg">
      
      <span className="text-[10px] font-semibold text-slate-300 tracking-tight text-center leading-none">
        Upload Avatar
      </span>

      <label
        className={`
          relative flex flex-col items-center justify-center w-12 h-12 rounded-xl
          bg-slate-800/60 border border-dashed transition-all duration-300 cursor-pointer overflow-hidden
          hover:scale-105 active:scale-95 mt-0.5
          ${
            selectedId === 'custom'
              ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-105'
              : 'border-slate-600 hover:border-slate-400 opacity-80 hover:opacity-100'
          }
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-[8px] text-cyan-400">Uploading</span>
          </div>
        ) : customAvatar ? (
          <img
            src={customAvatar}
            alt="Custom Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <span className="text-base text-slate-400 leading-none">+</span>
            <span className="text-[8px] text-slate-400 font-medium">Upload</span>
          </>
        )}

        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={handleFileUpload}
          className="hidden"
        />

        {selectedId === 'custom' && !uploading && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 text-[8px] text-slate-950 font-bold">
            ✓
          </span>
        )}
      </label>

      {uploadError && (
        <span className="text-[8px] text-rose-400 text-center leading-none">
          {uploadError}
        </span>
      )}
    </div>
  );
}