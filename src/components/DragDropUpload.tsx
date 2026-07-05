import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DragDropUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({ onUpload, accept = 'image/*', maxFiles = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const newFiles = [...files, ...droppedFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onUpload(newFiles);
    }
  }, [files, maxFiles, onUpload]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center gap-4 ${
          isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
        }`}
      >
        <div className={`p-4 rounded-full ${isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-500'}`}>
          <Upload size={32} />
        </div>
        <div className="text-center">
          <p className="text-stone-800 font-medium">點擊或拖曳檔案至此</p>
          <p className="text-stone-500 text-sm mt-1">支援 {accept} 格式，最多 {maxFiles} 個檔案</p>
        </div>
        <input
          type="file"
          multiple
          accept={accept}
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || []);
            const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
            setFiles(newFiles);
            onUpload(newFiles);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-2xl shadow-sm">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-500">
                  {file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{file.name}</p>
                  <p className="text-xs text-stone-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-stone-400"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
