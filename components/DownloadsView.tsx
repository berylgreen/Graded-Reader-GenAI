import React, { useState, useEffect } from 'react';

interface DownloadFile {
  name: string;
  size: number;
  time: number;
}

interface DownloadsViewProps {
  onBack: () => void;
}

const DownloadsView: React.FC<DownloadsViewProps> = ({ onBack }) => {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/list-downloads');
      if (!res.ok) throw new Error('Failed to fetch downloads');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-4 p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors"
          title="Back to Home"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Local Downloads</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error: {error}
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500">
          No files found in the downloads folder.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {files.map(file => (
              <li key={file.name} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-4 p-2 bg-brand-50 text-brand-600 rounded-lg">
                    {file.name.endsWith('.zip') ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="truncate pr-4">
                    <p className="text-sm font-semibold text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatSize(file.size)} • {formatDate(file.time)}
                    </p>
                  </div>
                </div>
                <div>
                  <a 
                    href={`/api/download/${encodeURIComponent(file.name)}`}
                    download={file.name}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-50 hover:border-brand-200 transition-colors whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DownloadsView;
