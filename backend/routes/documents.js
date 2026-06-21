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

const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

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
router.post('/', authenticateToken, (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50 MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload error.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const mainFile = req.files?.file?.[0];
    const imageFile = req.files?.image?.[0];

    if (!mainFile) return res.status(400).json({ error: 'No file uploaded.' });

    const { title, category, expiry_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const ext = extname(mainFile.originalname);
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `documents/${category || 'general'}/${filename}`;

    // Upload main file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('site-images')
      .upload(storagePath, mainFile.buffer, {
        contentType: mainFile.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', JSON.stringify(uploadError));
      return res.status(500).json({ error: `Failed to upload file to storage: ${uploadError.message}` });
    }

    // Get public URL for main file
    const { data: urlData } = supabase.storage
      .from('site-images')
      .getPublicUrl(storagePath);

    // Upload optional image
    let imageUrl = null;
    let imageStoragePath = null;
    if (imageFile) {
      const imgExt = extname(imageFile.originalname);
      const imgFilename = `${uuidv4()}${imgExt}`;
      imageStoragePath = `documents/${category || 'general'}/images/${imgFilename}`;

      const { error: imgUploadError } = await supabase.storage
        .from('site-images')
        .upload(imageStoragePath, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: true,
        });

      if (imgUploadError) {
        console.error('Image upload error:', imgUploadError.message);
      } else {
        const { data: imgUrlData } = supabase.storage
          .from('site-images')
          .getPublicUrl(imageStoragePath);
        imageUrl = imgUrlData?.publicUrl || null;
      }
    }

    const record = {
      title,
      category: category || 'general',
      filename,
      original_name: mainFile.originalname,
      mime_type: mainFile.mimetype,
      file_size: mainFile.size,
      public_url: urlData?.publicUrl || null,
      storage_path: storagePath,
      expiry_date: expiry_date || null,
      image_url: imageUrl,
      image_storage_path: imageStoragePath,
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Document insert error:', JSON.stringify(error));
      return res.status(500).json({ error: `Failed to save document record: ${error.message}` });
    }

    res.json(data);
  } catch (err) {
    console.error('Upload document error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to upload document: ${err.message}` });
  }
});

// Update document title/category (admin)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, category, expiry_date } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (expiry_date !== undefined) updates.expiry_date = expiry_date || null;

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
    const pathsToRemove = [];
    if (doc.storage_path) pathsToRemove.push(doc.storage_path);
    if (doc.image_storage_path) pathsToRemove.push(doc.image_storage_path);
    if (pathsToRemove.length) {
      await supabase.storage.from('site-images').remove(pathsToRemove);
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
