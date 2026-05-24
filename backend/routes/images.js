import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

// Use memory storage so we get the file buffer for Supabase upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV) are allowed.'));
    }
  }
});

const router = Router();

// Get all images for a section
router.get('/:section', async (req, res) => {
  try {
    const { data: images, error } = await supabase
      .from('site_images')
      .select('*')
      .eq('section', req.params.section)
      .order('slot');

    if (error) {
      console.error('Fetch images error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch images.' });
    }

    res.json(images || []);
  } catch (err) {
    console.error('Get images error:', err.message);
    res.status(500).json({ error: 'Failed to fetch images.' });
  }
});

// Get a specific image by section and slot
router.get('/:section/:slot', async (req, res) => {
  try {
    const { data: image, error } = await supabase
      .from('site_images')
      .select('*')
      .eq('section', req.params.section)
      .eq('slot', req.params.slot)
      .single();

    if (error || !image) return res.status(404).json({ error: 'Image not found.' });
    res.json(image);
  } catch (err) {
    console.error('Get image error:', err.message);
    res.status(500).json({ error: 'Failed to fetch image.' });
  }
});

// Upload/replace image for a section slot (admin only)
router.post('/:section/:slot', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { section, slot } = req.params;
    const ext = extname(req.file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `${section}/${slot}/${filename}`;

    // Delete old file from storage if exists
    const { data: existing } = await supabase
      .from('site_images')
      .select('*')
      .eq('section', section)
      .eq('slot', slot)
      .single();

    if (existing) {
      const oldPath = `${existing.section}/${existing.slot}/${existing.filename}`;
      await supabase.storage.from('site-images').remove([oldPath]);
      await supabase
        .from('site_images')
        .delete()
        .eq('section', section)
        .eq('slot', slot);
    }

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

    const publicUrl = urlData?.publicUrl || null;

    // Insert into site_images table
    const record = {
      section,
      slot,
      filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      public_url: publicUrl,
    };

    // Try with file_size first, fall back without it if column doesn't exist
    let insertError;
    const { error: err1 } = await supabase.from('site_images').insert({ ...record, file_size: req.file.size });
    if (err1 && err1.message && err1.message.includes('file_size')) {
      const { error: err2 } = await supabase.from('site_images').insert(record);
      insertError = err2;
    } else {
      insertError = err1;
    }

    if (insertError) {
      console.error('Image insert error:', insertError.message);
      return res.status(500).json({ error: 'Failed to save image record.' });
    }

    // Return the newly created record
    const { data: image } = await supabase
      .from('site_images')
      .select('*')
      .eq('section', section)
      .eq('slot', slot)
      .single();

    res.json(image);
  } catch (err) {
    console.error('Upload image error:', err.message);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
});

// Delete image (admin only)
router.delete('/:section/:slot', authenticateToken, async (req, res) => {
  try {
    const { section, slot } = req.params;

    const { data: existing, error } = await supabase
      .from('site_images')
      .select('*')
      .eq('section', section)
      .eq('slot', slot)
      .single();

    if (error || !existing) return res.status(404).json({ error: 'Image not found.' });

    // Remove from Supabase Storage
    const storagePath = `${section}/${slot}/${existing.filename}`;
    await supabase.storage.from('site-images').remove([storagePath]);

    // Delete from database
    await supabase
      .from('site_images')
      .delete()
      .eq('section', section)
      .eq('slot', slot);

    res.json({ message: 'Image deleted.' });
  } catch (err) {
    console.error('Delete image error:', err.message);
    res.status(500).json({ error: 'Failed to delete image.' });
  }
});

// Get all images (admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: images, error } = await supabase
      .from('site_images')
      .select('*')
      .order('section')
      .order('slot');

    if (error) {
      console.error('Fetch all images error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch images.' });
    }

    res.json(images || []);
  } catch (err) {
    console.error('Get all images error:', err.message);
    res.status(500).json({ error: 'Failed to fetch images.' });
  }
});

export default router;
