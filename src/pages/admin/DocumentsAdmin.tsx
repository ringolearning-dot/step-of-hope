import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import {
  HiArrowUpTray,
  HiTrash,
  HiDocumentText,
  HiPhoto,
  HiMagnifyingGlass,
  HiXMark,
  HiArrowDownTray,
  HiPencilSquare,
  HiCheck,
  HiFolderOpen,
  HiCalendarDays,
  HiExclamationTriangle,
  HiShieldCheck,
} from 'react-icons/hi2';

const CATEGORIES = [
  { value: 'receipt', label: 'Receipts' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'contract', label: 'Contracts' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'report', label: 'Reports' },
  { value: 'legal', label: 'Legal' },
  { value: 'general', label: 'General' },
];

interface Doc {
  id: number;
  title: string;
  category: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  public_url: string;
  storage_path: string;
  expiry_date: string | null;
  image_url: string | null;
  image_storage_path: string | null;
  created_at: string;
}

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string) {
  return mime?.startsWith('image/');
}

export default function DocumentsAdmin() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    try {
      const res = await api.get('/documents');
      setDocs(res.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    if (isImage(file.type)) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return toast.error('Please select a file');
    if (!title.trim()) return toast.error('Please enter a title');

    setUploading(true);
    setUploadProgress(0);

    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('title', title.trim());
      fd.append('category', category);
      if (expiryDate) fd.append('expiry_date', expiryDate);
      if (selectedImage) fd.append('image', selectedImage);

      const res = await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      setDocs((prev) => [res.data, ...prev]);
      toast.success('Document uploaded');
      resetUpload();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function resetUpload() {
    setShowUpload(false);
    setTitle('');
    setCategory('general');
    setSelectedFile(null);
    setPreview(null);
    setExpiryDate('');
    setSelectedImage(null);
    setImagePreview(null);
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = '';
    if (imageRef.current) imageRef.current.value = '';
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function getExpiryStatus(date: string | null) {
    if (!date) return null;
    const now = new Date();
    const expiry = new Date(date);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring-soon';
    return 'valid';
  }

  async function handleDelete(doc: Doc) {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  }

  async function handleSaveTitle(doc: Doc) {
    if (!editTitle.trim()) return;
    try {
      await api.patch(`/documents/${doc.id}`, { title: editTitle.trim() });
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, title: editTitle.trim() } : d)));
      setEditingId(null);
      toast.success('Title updated');
    } catch {
      toast.error('Failed to update title');
    }
  }

  const filtered = docs.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.original_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || d.category === filterCat;
    return matchSearch && matchCat;
  });

  const catLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label || val;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Documents & Files</h1>
          <p className="text-navy/60 text-sm mt-1">
            Upload and manage receipts, invoices, contracts, and other documents.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-hope hover:bg-hope-light text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <HiArrowUpTray className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Upload Panel */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-navy/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-navy text-lg">New Upload</h2>
                <button onClick={resetUpload} className="text-navy/40 hover:text-navy">
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. January Rent Receipt"
                    className="w-full px-4 py-2.5 rounded-xl border border-navy/20 focus:border-hope focus:ring-1 focus:ring-hope outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-navy/20 focus:border-hope focus:ring-1 focus:ring-hope outline-none text-sm bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy/70 mb-1">Expiry / Warranty Date (optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-navy/20 focus:border-hope focus:ring-1 focus:ring-hope outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy/70 mb-1">Picture (optional)</label>
                <div
                  onClick={() => imageRef.current?.click()}
                  className="border-2 border-dashed border-navy/20 rounded-xl p-4 text-center cursor-pointer hover:border-hope/50 transition-colors"
                >
                  {selectedImage ? (
                    <div className="flex items-center gap-3">
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                      )}
                      <div className="text-left">
                        <p className="text-sm text-navy font-medium">{selectedImage.name}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                            setImagePreview(null);
                            if (imageRef.current) imageRef.current.value = '';
                          }}
                          className="text-xs text-red-500 hover:text-red-700 mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <HiPhoto className="w-6 h-6 text-navy/30 mx-auto" />
                      <p className="text-xs text-navy/50">Click to add an optional picture</p>
                    </div>
                  )}
                </div>
                <input
                  ref={imageRef}
                  type="file"
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy/70 mb-1">File *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-navy/20 rounded-xl p-6 text-center cursor-pointer hover:border-hope/50 transition-colors"
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      {preview && (
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                        />
                      )}
                      <p className="text-sm text-navy font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-navy/50">{formatSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <HiArrowUpTray className="w-8 h-8 text-navy/30 mx-auto" />
                      <p className="text-sm text-navy/50">
                        Click to select a file (images, PDF, Word, Excel, TXT)
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                />
              </div>

              {uploading && (
                <div className="w-full bg-navy/10 rounded-full h-2">
                  <div
                    className="bg-hope h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full bg-hope hover:bg-hope-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {uploading ? `Uploading ${uploadProgress}%...` : 'Upload'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/20 focus:border-hope focus:ring-1 focus:ring-hope outline-none text-sm"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-navy/20 focus:border-hope outline-none text-sm bg-white"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-navy/10 p-4 text-center">
          <p className="text-2xl font-bold text-navy">{docs.length}</p>
          <p className="text-xs text-navy/50">Total Files</p>
        </div>
        <div className="bg-white rounded-xl border border-navy/10 p-4 text-center">
          <p className="text-2xl font-bold text-navy">
            {formatSize(docs.reduce((sum, d) => sum + (d.file_size || 0), 0))}
          </p>
          <p className="text-xs text-navy/50">Total Size</p>
        </div>
        <div className="bg-white rounded-xl border border-navy/10 p-4 text-center">
          <p className="text-2xl font-bold text-navy">
            {docs.filter((d) => d.category === 'receipt').length}
          </p>
          <p className="text-xs text-navy/50">Receipts</p>
        </div>
        <div className="bg-white rounded-xl border border-navy/10 p-4 text-center">
          <p className="text-2xl font-bold text-navy">
            {docs.filter((d) => d.category === 'warranty').length}
          </p>
          <p className="text-xs text-navy/50">Warranties</p>
        </div>
        <div className="bg-white rounded-xl border border-navy/10 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">
            {docs.filter((d) => d.expiry_date && getExpiryStatus(d.expiry_date) === 'expired').length}
          </p>
          <p className="text-xs text-navy/50">Expired</p>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-20 text-navy/40">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <HiFolderOpen className="w-16 h-16 text-navy/20 mx-auto mb-4" />
          <p className="text-navy/40">
            {docs.length === 0 ? 'No documents yet. Upload your first file!' : 'No documents match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border border-navy/10 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              {/* Thumbnail / Icon */}
              <div className="w-14 h-14 rounded-lg bg-navy/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {doc.image_url ? (
                  <img src={doc.image_url} alt={doc.title} className="w-full h-full object-cover rounded-lg" />
                ) : isImage(doc.mime_type) && doc.public_url ? (
                  <img src={doc.public_url} alt={doc.title} className="w-full h-full object-cover rounded-lg" />
                ) : doc.mime_type === 'application/pdf' ? (
                  <HiDocumentText className="w-7 h-7 text-red-400" />
                ) : (
                  <HiDocumentText className="w-7 h-7 text-navy/30" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingId === doc.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(doc)}
                      className="flex-1 px-3 py-1 rounded-lg border border-hope text-sm outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleSaveTitle(doc)} className="text-hope hover:text-hope-light">
                      <HiCheck className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-navy/40 hover:text-navy">
                      <HiXMark className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <p className="font-medium text-navy truncate">{doc.title}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs bg-navy/5 text-navy/60 px-2 py-0.5 rounded-full">
                    {catLabel(doc.category)}
                  </span>
                  <span className="text-xs text-navy/40">{formatSize(doc.file_size)}</span>
                  <span className="text-xs text-navy/40">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  {doc.expiry_date && (() => {
                    const status = getExpiryStatus(doc.expiry_date);
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        status === 'expired'
                          ? 'bg-red-100 text-red-700'
                          : status === 'expiring-soon'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {status === 'expired' ? (
                          <HiExclamationTriangle className="w-3 h-3" />
                        ) : status === 'expiring-soon' ? (
                          <HiCalendarDays className="w-3 h-3" />
                        ) : (
                          <HiShieldCheck className="w-3 h-3" />
                        )}
                        {status === 'expired' ? 'Expired' : 'Expires'} {new Date(doc.expiry_date).toLocaleDateString()}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingId(doc.id);
                    setEditTitle(doc.title);
                  }}
                  className="p-2 rounded-lg text-navy/40 hover:text-hope hover:bg-hope/10 transition-colors"
                  title="Rename"
                >
                  <HiPencilSquare className="w-5 h-5" />
                </button>
                {doc.public_url && (
                  <a
                    href={doc.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-navy/40 hover:text-hope hover:bg-hope/10 transition-colors"
                    title="Download / View"
                  >
                    <HiArrowDownTray className="w-5 h-5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 rounded-lg text-navy/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <HiTrash className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
