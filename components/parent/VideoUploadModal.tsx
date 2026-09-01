'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  FileVideo,
  Sparkles,
} from 'lucide-react';
import { TherapyActivity } from '@/lib/therapyActivities';
import { storageService, validateVideoFile } from '@/lib/storage';
import {
  TherapySubmission,
  createTherapySubmission,
} from '@/lib/therapySubmissions';

interface VideoUploadModalProps {
  goal: TherapyActivity;
  childName: string;
  onClose: () => void;
  onSuccess: (submission: TherapySubmission) => void;
}

type UploadStep = 'select' | 'uploading' | 'preview' | 'success';

export default function VideoUploadModal({
  goal,
  childName,
  onClose,
  onSuccess,
}: VideoUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSubmission, setCreatedSubmission] = useState<TherapySubmission | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid video file.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStep('preview');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setStep('uploading');
    setUploadProgress(0);

    // Smooth simulated progress up to 90%
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 120);

    try {
      const uploadResult = await storageService.uploadVideo(selectedFile);
      clearInterval(interval);
      setUploadProgress(100);

      // Create TherapySubmission row in storage & DB layer
      const submission = createTherapySubmission({
        therapyActivityId: goal.id,
        therapyActivityTitle: goal.title,
        childId: goal.childId,
        videoUrl: uploadResult.url,
        videoFileName: uploadResult.fileName,
        videoSizeBytes: uploadResult.sizeBytes,
      });

      setCreatedSubmission(submission);
      setTimeout(() => {
        setStep('success');
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(err?.message || 'Failed to upload video. Please try again.');
      setStep('preview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">
                Record & Upload Therapy Session
              </h3>
              <p className="text-[11px] text-slate-500">
                Context: <strong>{childName}</strong> • {goal.targetSkill}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Goal Context Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
              Selected Clinical Goal
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-200/60 font-bold text-indigo-900">
              {goal.targetSkill}
            </span>
          </div>
          <p className="text-xs font-black text-slate-900 leading-snug">
            "{goal.title}"
          </p>
          <p className="text-[11px] text-slate-600 line-clamp-2">
            {goal.instructions}
          </p>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: FILE SELECTION / DROPZONE */}
        {step === 'select' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,video/mp4,video/webm,video/quicktime"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">
                  Drag and drop your practice video here
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  or <span className="text-indigo-600 font-bold underline">browse files</span> from your phone or computer
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                <span>MP4, WebM, MOV supported</span>
                <span>•</span>
                <span>Max file size: 100 MB</span>
                <span>•</span>
                <span>1–2 min recommended</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & CONFIRMATION */}
        {step === 'preview' && previewUrl && selectedFile && (
          <div className="space-y-4 animate-fadeIn">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-56 flex items-center justify-center shadow-inner">
              <video
                src={previewUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileVideo className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-slate-800 truncate max-w-xs">
                  {selectedFile.name}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px] shrink-0">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setStep('select');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Choose Different Video
              </button>

              <button
                type="button"
                onClick={startUpload}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Video for This Goal →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: UPLOADING PROGRESS */}
        {step === 'uploading' && (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>

            <div>
              <h4 className="font-black text-base text-slate-900">
                Uploading Therapy Session...
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Encrypting and storing video for Dr. Vance's clinical review.
              </p>
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {uploadProgress}%
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS & CONFIRMATION */}
        {step === 'success' && createdSubmission && (
          <div className="p-6 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-black text-lg text-slate-900">
                Video Upload Complete!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Your practice recording has been submitted for <strong>{goal.title}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-950 font-bold">
                <span>Submission Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 text-[10px] uppercase tracking-wider">
                  SUBMITTED • ENQUEUED
                </span>
              </div>
              <p className="text-slate-700 text-[11px]">
                • Goal status updated to <strong>SUBMITTED</strong>.
              </p>
              <p className="text-slate-700 text-[11px]">
                • Automated analysis enqueued (Prompt 14 pipeline).
              </p>
              <p className="text-slate-700 text-[11px]">
                • Care Team notification dispatched to Dr. Marcus Vance.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onSuccess(createdSubmission);
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-98"
              >
                Done & Return to Dashboard ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
