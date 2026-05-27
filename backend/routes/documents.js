import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: images, PDF, Word, Excel, TXT.'));
    }
  }
});

const router = Router();

// List all documents (admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Fetch documents error:', err.message);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});

// Upload a new document (admin)
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { title, category } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const ext = extname(req.file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `documents/${category || 'general'}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('site-images')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message);
      return res.status(500).json({ error: 'Failed to upload file to storage.' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('site-images')
      .getPublicUrl(storagePath);

    const record = {
      title,
      category: category || 'general',
      filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      public_url: urlData?.publicUrl || null,
      storage_path: storagePath,
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Document insert error:', error.message);
      return res.status(500).json({ error: 'Failed to save document record.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Upload document error:', err.message);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
});

// Update document title/category (admin)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, category } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update document error:', err.message);
    res.status(500).json({ error: 'Failed to update document.' });
  }
});

// Delete document (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !doc) return res.status(404).json({ error: 'Document not found.' });

    // Remove from storage
    if (doc.storage_path) {
      await supabase.storage.from('site-images').remove([doc.storage_path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Document deleted.' });
  } catch (err) {
    console.error('Delete document error:', err.message);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

export default router;
