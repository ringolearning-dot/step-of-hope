import { useState, useEffect, useRef, useCallback } from 'react';
import api, { getImageUrl } from '../../lib/api';
import { HiPhoto, HiArrowUpTray, HiTrash, HiCheckCircle, HiXCircle, HiVideoCamera } from 'react-icons/hi2';

interface SlotDef {
  section: string;
  slot: string;
}

const IMAGE_SECTIONS: Record<string, string[]> = {
  home: ['hero', 'story-preview', 'yno-preview', 'cta'],
  story: ['section1', 'section2', 'section3', 'section4', 'section5', 'section6', 'section7'],
  impact: ['photo1', 'photo2', 'photo3', 'photo4', 'photo5', 'photo6'],
  events: [
    'photobooth',
    '360booth',
    'photography',
    'gallery1',
    'gallery2',
    'gallery3',
    'gallery4',
    'gallery5',
  ],
  mission: ['hero', 'vision'],
};

interface SlotState {
  uploading: boolean;
  deleting: boolean;
  filename: string | null;
  public_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  progress: number;
  feedback: { type: 'success' | 'error'; message: string } | null;
}

function slotKey(section: string, slot: string) {
  return `${section}/${slot}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImagesAdmin() {
  const [slots, setSlots] = useState<Record<string, SlotState>>({});
  const [loadedSections, setLoadedSections] = useState<Record<string, boolean>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch all current images on mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await api.get('/images');
        const images: any[] = res.data || [];
        const slotMap: Record<string, SlotState> = {};

        images.forEach((img: any) => {
          const key = slotKey(img.section, img.slot);
          slotMap[key] = {
            uploading: false,
            deleting: false,
            filename: img.filename,
            public_url: img.public_url || null,
            mime_type: img.mime_type || null,
            file_size: img.file_size || null,
            progress: 0,
            feedback: null,
          };
        });

        setSlots(slotMap);
      } catch {
        // Images endpoint may not return all, we'll handle gracefully
      } finally {
        setInitialLoading(false);
      }
    };
    fetchImages();
  }, []);

  const getSlotState = useCallback(
    (section: string, slot: string): SlotState => {
      return (
        slots[slotKey(section, slot)] || {
          uploading: false,
          deleting: false,
          filename: null,
          public_url: null,
          mime_type: null,
          file_size: null,
          progress: 0,
          feedback: null,
        }
      );
    },
    [slots]
  );

  const updateSlot = (section: string, slot: string, update: Partial<SlotState>) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey(section, slot)]: {
        ...getSlotState(section, slot),
        ...update,
      },
    }));
  };

  const clearFeedback = (section: string, slot: string) => {
    setTimeout(() => {
      updateSlot(section, slot, { feedback: null });
    }, 3000);
  };

  const handleUpload = async (section: string, slot: string, file: File) => {
    updateSlot(section, slot, { uploading: true, progress: 0, feedback: null });

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post(`/images/${section}/${slot}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            updateSlot(section, slot, { uploading: true, progress: pct });
          }
        },
      });

      updateSlot(section, slot, {
        uploading: false,
        filename: res.data.filename || res.data.image?.filename,
        public_url: res.data.public_url || null,
        mime_type: res.data.mime_type || null,
        file_size: res.data.file_size || null,
        progress: 100,
        feedback: { type: 'success', message: 'Uploaded' },
      });
      clearFeedback(section, slot);
    } catch (err: any) {
      updateSlot(section, slot, {
        uploading: false,
        progress: 0,
        feedback: {
          type: 'error',
          message: err.response?.data?.message || 'Upload failed',
        },
      });
      clearFeedback(section, slot);
    }
  };

  const handleDelete = async (section: string, slot: string) => {
    if (!confirm('Delete this image?')) return;

    updateSlot(section, slot, { deleting: true, feedback: null });

    try {
      await api.delete(`/images/${section}/${slot}`);
      updateSlot(section, slot, {
        deleting: false,
        filename: null,
        feedback: { type: 'success', message: 'Deleted' },
      });
      clearFeedback(section, slot);
    } catch (err: any) {
      updateSlot(section, slot, {
        deleting: false,
        feedback: {
          type: 'error',
          message: err.response?.data?.message || 'Delete failed',
        },
      });
      clearFeedback(section, slot);
    }
  };

  const onFileChange = (section: string, slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(section, slot, file);
    }
    e.target.value = '';
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Image Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload and manage images for each section of the website.
        </p>
      </div>

      {Object.entries(IMAGE_SECTIONS).map(([section, sectionSlots]) => (
        <div key={section} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 capitalize border-b border-gray-200 pb-2">
            {section}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sectionSlots.map((slot) => {
              const state = getSlotState(section, slot);
              const refKey = slotKey(section, slot);

              return (
                <div
                  key={refKey}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Image/Video Preview / Placeholder */}
                  <div className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden">
                    {state.filename ? (
                      state.mime_type?.startsWith('video/') ? (
                        <video
                          src={state.public_url || getImageUrl(state.filename!)}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={state.public_url || getImageUrl(state.filename!)}
                          alt={`${section} - ${slot}`}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center text-gray-300">
                        <HiPhoto className="w-10 h-10" />
                        <span className="text-xs mt-1">No media</span>
                      </div>
                    )}

                    {/* Upload progress overlay */}
                    {state.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <div className="w-3/4 h-2 bg-white/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${state.progress}%` }}
                          />
                        </div>
                        <span className="text-white text-xs mt-2">{state.progress}%</span>
                      </div>
                    )}

                    {/* Deleting overlay */}
                    {state.deleting && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Info & Actions */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1.5">
                      {slot}
                      {state.mime_type?.startsWith('video/') && (
                        <HiVideoCamera className="w-3.5 h-3.5 text-blue-500" title="Video" />
                      )}
                    </p>
                    {state.file_size && (
                      <p className="text-xs text-gray-400 mb-2">{formatFileSize(state.file_size)}</p>
                    )}

                    {/* Feedback */}
                    {state.feedback && (
                      <div
                        className={`flex items-center gap-1 text-xs mb-2 ${
                          state.feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {state.feedback.type === 'success' ? (
                          <HiCheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <HiXCircle className="w-3.5 h-3.5" />
                        )}
                        {state.feedback.message}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Hidden file input */}
                      <input
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        ref={(el) => {
                          fileInputRefs.current[refKey] = el;
                        }}
                        onChange={(e) => onFileChange(section, slot, e)}
                      />

                      <button
                        onClick={() => fileInputRefs.current[refKey]?.click()}
                        disabled={state.uploading || state.deleting}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5
                                   text-xs font-medium bg-slate-800 text-white rounded-lg
                                   hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <HiArrowUpTray className="w-3.5 h-3.5" />
                        Upload
                      </button>

                      {state.filename && (
                        <button
                          onClick={() => handleDelete(section, slot)}
                          disabled={state.uploading || state.deleting}
                          className="inline-flex items-center justify-center px-3 py-1.5
                                     text-xs font-medium text-red-600 border border-red-200 rounded-lg
                                     hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <HiTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
