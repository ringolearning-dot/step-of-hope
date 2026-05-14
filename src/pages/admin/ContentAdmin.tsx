import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { HiPencilSquare, HiCheckCircle, HiXCircle } from 'react-icons/hi2';

interface ContentField {
  page: string;
  key: string;
  label: string;
  type: 'text' | 'textarea';
}

const CONTENT_FIELDS: Record<string, ContentField[]> = {
  home: [
    { page: 'home', key: 'hero_title', label: 'Hero Title', type: 'text' },
    { page: 'home', key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { page: 'home', key: 'story_heading', label: 'Story Section Heading', type: 'text' },
    { page: 'home', key: 'story_text1', label: 'Story Paragraph 1', type: 'textarea' },
    { page: 'home', key: 'story_text2', label: 'Story Paragraph 2', type: 'textarea' },
    { page: 'home', key: 'photobooth_heading', label: 'Photobooth Heading', type: 'text' },
    { page: 'home', key: 'photobooth_text', label: 'Photobooth Text', type: 'textarea' },
    { page: 'home', key: 'yno_heading', label: 'YNO Section Heading', type: 'text' },
    { page: 'home', key: 'yno_text', label: 'YNO Section Text', type: 'textarea' },
    { page: 'home', key: 'cta_heading', label: 'Final CTA Heading', type: 'text' },
    { page: 'home', key: 'cta_text', label: 'Final CTA Text', type: 'textarea' },
  ],
  story: [
    { page: 'story', key: 'hero_quote', label: 'Hero Quote', type: 'text' },
    { page: 'story', key: 'section1_title', label: 'Section 1 Title', type: 'text' },
    { page: 'story', key: 'section1_text', label: 'Section 1 Text', type: 'textarea' },
    { page: 'story', key: 'section2_title', label: 'Section 2 Title', type: 'text' },
    { page: 'story', key: 'section2_text', label: 'Section 2 Text', type: 'textarea' },
    { page: 'story', key: 'section3_title', label: 'Section 3 Title', type: 'text' },
    { page: 'story', key: 'section3_text', label: 'Section 3 Text', type: 'textarea' },
    { page: 'story', key: 'section4_title', label: 'Section 4 Title', type: 'text' },
    { page: 'story', key: 'section4_text', label: 'Section 4 Text', type: 'textarea' },
    { page: 'story', key: 'section5_title', label: 'Section 5 Title', type: 'text' },
    { page: 'story', key: 'section5_text', label: 'Section 5 Text', type: 'textarea' },
    { page: 'story', key: 'section6_title', label: 'Section 6 Title', type: 'text' },
    { page: 'story', key: 'section6_text', label: 'Section 6 Text', type: 'textarea' },
    { page: 'story', key: 'section7_title', label: 'Section 7 Title', type: 'text' },
    { page: 'story', key: 'section7_text', label: 'Section 7 Text', type: 'textarea' },
  ],
  mission: [
    { page: 'mission', key: 'hero_title', label: 'Hero Title', type: 'text' },
    { page: 'mission', key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { page: 'mission', key: 'mission_title', label: 'Mission Title', type: 'text' },
    { page: 'mission', key: 'mission_text', label: 'Mission Text', type: 'textarea' },
    { page: 'mission', key: 'vision_title', label: 'Vision Title', type: 'text' },
    { page: 'mission', key: 'vision_text', label: 'Vision Text', type: 'textarea' },
  ],
  impact: [
    { page: 'impact', key: 'hero_title', label: 'Hero Title', type: 'text' },
    { page: 'impact', key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { page: 'impact', key: 'gallery_heading', label: 'Gallery Heading', type: 'text' },
  ],
  events: [
    { page: 'events', key: 'hero_title', label: 'Hero Title', type: 'text' },
    { page: 'events', key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { page: 'events', key: 'photobooth_title', label: 'Photobooth Title', type: 'text' },
    { page: 'events', key: 'photobooth_text', label: 'Photobooth Description', type: 'textarea' },
    { page: 'events', key: '360booth_title', label: '360 Booth Title', type: 'text' },
    { page: 'events', key: '360booth_text', label: '360 Booth Description', type: 'textarea' },
    { page: 'events', key: 'photography_title', label: 'Photography Title', type: 'text' },
    { page: 'events', key: 'photography_text', label: 'Photography Description', type: 'textarea' },
  ],
  donate: [
    { page: 'donate', key: 'hero_title', label: 'Hero Title', type: 'text' },
    { page: 'donate', key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
  ],
};

interface FieldState {
  value: string;
  saving: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
}

export default function ContentAdmin() {
  const [fields, setFields] = useState<Record<string, FieldState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await api.get('/content');
        const rows: any[] = res.data || [];
        const fieldMap: Record<string, FieldState> = {};

        rows.forEach((row: any) => {
          const key = `${row.page}/${row.field_key}`;
          fieldMap[key] = { value: row.field_value || '', saving: false, feedback: null };
        });

        setFields(fieldMap);
      } catch {
        // Content might be empty initially
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const getField = (page: string, key: string): FieldState => {
    return fields[`${page}/${key}`] || { value: '', saving: false, feedback: null };
  };

  const updateField = (page: string, key: string, update: Partial<FieldState>) => {
    const fk = `${page}/${key}`;
    setFields((prev) => ({
      ...prev,
      [fk]: { ...getField(page, key), ...update },
    }));
  };

  const handleSave = async (page: string, key: string) => {
    const state = getField(page, key);
    updateField(page, key, { saving: true, feedback: null });

    try {
      await api.put(`/content/${page}/${key}`, { value: state.value });
      updateField(page, key, {
        saving: false,
        feedback: { type: 'success', message: 'Saved' },
      });
      setTimeout(() => updateField(page, key, { feedback: null }), 3000);
    } catch {
      updateField(page, key, {
        saving: false,
        feedback: { type: 'error', message: 'Failed to save' },
      });
      setTimeout(() => updateField(page, key, { feedback: null }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Edit the text content for each page of the website.
        </p>
      </div>

      {Object.entries(CONTENT_FIELDS).map(([section, sectionFields]) => (
        <div key={section} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 capitalize border-b border-gray-200 pb-2">
            {section}
          </h2>

          <div className="space-y-3">
            {sectionFields.map((field) => {
              const state = getField(field.page, field.key);

              return (
                <div
                  key={`${field.page}/${field.key}`}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={state.value}
                          onChange={(e) =>
                            updateField(field.page, field.key, { value: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                     focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent
                                     resize-y"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={state.value}
                          onChange={(e) =>
                            updateField(field.page, field.key, { value: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                     focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 pt-6">
                      <button
                        onClick={() => handleSave(field.page, field.key)}
                        disabled={state.saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                   bg-slate-800 text-white rounded-lg hover:bg-slate-700
                                   disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <HiPencilSquare className="w-3.5 h-3.5" />
                        {state.saving ? 'Saving...' : 'Save'}
                      </button>

                      {state.feedback && (
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            state.feedback.type === 'success'
                              ? 'text-emerald-600'
                              : 'text-red-600'
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
