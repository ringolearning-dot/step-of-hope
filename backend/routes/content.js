import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all content for a page (public)
router.get('/:page', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('page', req.params.page)
      .order('field_key');

    if (error) {
      console.error('Fetch content error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch content.' });
    }

    // Return as key-value map
    const content = {};
    (data || []).forEach((row) => {
      content[row.field_key] = row.field_value;
    });

    res.json(content);
  } catch (err) {
    console.error('Get content error:', err.message);
    res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

// Get all content (admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('page')
      .order('field_key');

    if (error) {
      console.error('Fetch all content error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch content.' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Get all content error:', err.message);
    res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

// Update or create content field (admin)
router.put('/:page/:fieldKey', authenticateToken, async (req, res) => {
  try {
    const { page, fieldKey } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required.' });
    }

    // Upsert
    const { error } = await supabase.from('site_content').upsert(
      { page, field_key: fieldKey, field_value: value },
      { onConflict: 'page,field_key' }
    );

    if (error) {
      console.error('Upsert content error:', error.message);
      return res.status(500).json({ error: 'Failed to save content.' });
    }

    res.json({ message: 'Content updated.' });
  } catch (err) {
    console.error('Update content error:', err.message);
    res.status(500).json({ error: 'Failed to update content.' });
  }
});

export default router;
