import { Router } from 'express';
import supabase from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmail, getAdminEmail } from '../lib/email.js';

const router = Router();

// ─── Automatic Emails ────────────────────────────────────────────────

async function sendThankYouEmail(app) {
  try {
    const interests = (() => {
      try { return JSON.parse(app.interests).join(', '); } catch { return app.interests || 'N/A'; }
    })();

    await sendEmail({
      to: app.email,
      subject: 'Thank You for Applying to Volunteer with Step of Hope!',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1B2A4A, #2C3E6B); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Step of Hope</h1>
            <p style="color: #7EAED3; margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">VOLUNTEER APPLICATION RECEIVED</p>
          </div>
          <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1B2A4A; font-size: 20px; margin-top: 0;">Dear ${app.first_name},</h2>
            <p style="font-size: 15px; line-height: 1.7; color: #374151;">
              Thank you for your generous willingness to volunteer with <strong>Step of Hope Foundation</strong>.
              Your application has been received and is currently under review.
            </p>
            <div style="background: #f0f7ff; border-left: 4px solid #5B8DBE; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #1B2A4A;"><strong>Application Status:</strong> Pending Review</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #374151;"><strong>Areas of Interest:</strong> ${interests}</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #374151;"><strong>Location:</strong> ${app.city || ''}${app.state ? ', ' + app.state : ''}</p>
            </div>
            <p style="font-size: 15px; line-height: 1.7; color: #374151;">
              Our team will review your application and reach out to you soon with next steps.
              Together, we can make a difference in the lives of children and families in need.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #1B2A4A; font-weight: 600; font-style: italic; margin-top: 24px;">
              Never lose hope. Keep on fighting.
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Step of Hope Foundation &bull; Bringing smiles to children and families</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send thank-you email:', err.message);
  }
}

async function sendAdminApplicationNotification(app) {
  try {
    const interests = (() => {
      try { return JSON.parse(app.interests).join(', '); } catch { return app.interests || 'N/A'; }
    })();

    await sendEmail({
      to: getAdminEmail(),
      subject: `New Volunteer Application - ${app.first_name} ${app.last_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B2A4A;">New Volunteer Application</h2>
          <p><strong>Status:</strong> Pending Review</p>
          <hr/>
          <h3>Personal Information</h3>
          <p><strong>Name:</strong> ${app.first_name} ${app.last_name}</p>
          <p><strong>Email:</strong> ${app.email}</p>
          <p><strong>Phone:</strong> ${app.phone || 'N/A'}</p>
          <p><strong>Age:</strong> ${app.age || 'N/A'} &bull; <strong>Gender:</strong> ${app.gender || 'N/A'}</p>
          <p><strong>Location:</strong> ${app.city || ''}${app.state ? ', ' + app.state : ''} ${app.zip_code || ''} ${app.country || ''}</p>
          <hr/>
          <h3>Emergency Contact</h3>
          <p><strong>Name:</strong> ${app.emergency_contact_name || 'N/A'} (${app.emergency_contact_relationship || 'N/A'})</p>
          <p><strong>Phone:</strong> ${app.emergency_contact_phone || 'N/A'}</p>
          <hr/>
          <h3>Professional Info</h3>
          <p><strong>Profession:</strong> ${app.profession || 'N/A'}</p>
          <p><strong>Skills:</strong> ${app.skills || 'N/A'}</p>
          <p><strong>Languages:</strong> ${app.languages || 'N/A'}</p>
          <hr/>
          <h3>Volunteer Details</h3>
          <p><strong>Interests:</strong> ${interests}</p>
          <p><strong>Why Volunteer:</strong> ${app.why_volunteer || 'N/A'}</p>
          <p><strong>Volunteered Before:</strong> ${app.volunteered_before ? 'Yes' : 'No'}</p>
          <p><strong>Days Available:</strong> ${(() => { try { return JSON.parse(app.days_available).join(', '); } catch { return app.days_available || 'N/A'; } })()}</p>
          <p><strong>Can Travel:</strong> ${app.can_travel ? 'Yes' : 'No'}</p>
          <p><strong>Preferred Location:</strong> ${app.preferred_location || 'N/A'}</p>
          <hr/>
          <h3>Background & Safety</h3>
          <p><strong>Experience with Children:</strong> ${app.experience_with_children ? 'Yes' : 'No'}</p>
          <p><strong>Comfortable with Medical Conditions:</strong> ${app.comfortable_medical_conditions ? 'Yes' : 'No'}</p>
          <p><strong>Driver License:</strong> ${app.has_driver_license ? 'Yes' : 'No'}</p>
          <p><strong>Can Lift Equipment:</strong> ${app.can_lift_equipment ? 'Yes' : 'No'}</p>
          <p><strong>Background Check Consent:</strong> ${app.consent_background_check ? 'Yes' : 'No'}</p>
          <p><strong>Agreed to Policies:</strong> ${app.agree_to_policies ? 'Yes' : 'No'}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin notification:', err.message);
  }
}

// ─── Public: Submit Application ──────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const {
      firstName, lastName, dateOfBirth, age, gender, profilePhotoUrl,
      address, city, state, zipCode, country, phone, email,
      emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
      profession, companyName, skills, languages,
      whyVolunteer, volunteeredBefore, interests,
      daysAvailable, timeAvailable, canTravel, preferredLocation,
      experienceWithChildren, comfortableMedicalConditions, medicalLimitations,
      hasDriverLicense, canLiftEquipment,
      consentBackgroundCheck, agreeToPolicies, digitalSignature, idDocumentUrl,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }
    if (!agreeToPolicies || !digitalSignature) {
      return res.status(400).json({ error: 'You must agree to the policies and provide a digital signature.' });
    }

    const record = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth || null,
      age: age || null,
      gender: gender || null,
      profile_photo_url: profilePhotoUrl || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      country: country || null,
      phone: phone || null,
      email,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_relationship: emergencyContactRelationship || null,
      emergency_contact_phone: emergencyContactPhone || null,
      profession: profession || null,
      company_name: companyName || null,
      skills: skills || null,
      languages: languages || null,
      why_volunteer: whyVolunteer || null,
      volunteered_before: volunteeredBefore || false,
      interests: JSON.stringify(interests || []),
      days_available: JSON.stringify(daysAvailable || []),
      time_available: timeAvailable || null,
      can_travel: canTravel || false,
      preferred_location: preferredLocation || null,
      experience_with_children: experienceWithChildren || false,
      comfortable_medical_conditions: comfortableMedicalConditions || false,
      medical_limitations: medicalLimitations || null,
      has_driver_license: hasDriverLicense || false,
      can_lift_equipment: canLiftEquipment || false,
      consent_background_check: consentBackgroundCheck || false,
      agree_to_policies: agreeToPolicies || false,
      digital_signature: digitalSignature || false,
      id_document_url: idDocumentUrl || null,
    };

    const { data, error } = await supabase
      .from('volunteer_applications')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Volunteer application insert error:', error.message);
      return res.status(500).json({ error: 'Failed to submit application.' });
    }

    // Send emails asynchronously (don't block the response)
    sendThankYouEmail(data);
    sendAdminApplicationNotification(data);

    res.json({ message: 'Your volunteer application has been submitted successfully!' });
  } catch (err) {
    console.error('Volunteer application submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

// ─── Admin: Get All Applications ─────────────────────────────────────

router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search, city, interest } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('volunteer_applications')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (city) query = query.ilike('city', `%${city}%`);
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,skills.ilike.%${search}%`);
    }
    if (interest) {
      query = query.ilike('interests', `%${interest}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: applications, count: total, error } = await query;

    if (error) {
      console.error('Fetch applications error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch applications.' });
    }

    res.json({
      applications: applications || [],
      total: total || 0,
      page: Number(page),
      totalPages: Math.ceil((total || 0) / limit),
    });
  } catch (err) {
    console.error('Admin applications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// ─── Admin: Get Single Application ───────────────────────────────────

router.get('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('volunteer_applications')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get application error:', err.message);
    res.status(500).json({ error: 'Failed to fetch application.' });
  }
});

// ─── Admin: Update Application ───────────────────────────────────────

router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    const { error } = await supabase
      .from('volunteer_applications')
      .update(updates)
      .eq('id', req.params.id);

    if (error) {
      console.error('Update application error:', error.message);
      return res.status(500).json({ error: 'Failed to update application.' });
    }

    res.json({ message: 'Application updated.' });
  } catch (err) {
    console.error('Update application error:', err.message);
    res.status(500).json({ error: 'Failed to update application.' });
  }
});

// ─── Admin: Delete Application ───────────────────────────────────────

router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('volunteer_applications')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete application error:', error.message);
      return res.status(500).json({ error: 'Failed to delete application.' });
    }

    res.json({ message: 'Application deleted.' });
  } catch (err) {
    console.error('Delete application error:', err.message);
    res.status(500).json({ error: 'Failed to delete application.' });
  }
});

// ─── Admin: Stats ────────────────────────────────────────────────────

router.get('/admin-stats/overview', authenticateToken, async (req, res) => {
  try {
    const counts = {};
    for (const s of ['pending', 'approved', 'active', 'inactive', 'rejected']) {
      const { count } = await supabase
        .from('volunteer_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', s);
      counts[s] = count || 0;
    }

    const { count: total } = await supabase
      .from('volunteer_applications')
      .select('*', { count: 'exact', head: true });

    res.json({ total: total || 0, ...counts });
  } catch (err) {
    console.error('Application stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ─── Admin: Export CSV ───────────────────────────────────────────────

router.get('/admin/export', authenticateToken, async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('volunteer_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to export applications.' });
    }

    const headers = [
      'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Age', 'Gender',
      'Address', 'City', 'State', 'ZIP', 'Country',
      'Emergency Contact', 'Emergency Relationship', 'Emergency Phone',
      'Profession', 'Company', 'Skills', 'Languages',
      'Why Volunteer', 'Volunteered Before', 'Interests',
      'Days Available', 'Time Available', 'Can Travel', 'Preferred Location',
      'Experience with Children', 'Comfortable Medical', 'Medical Limitations',
      'Driver License', 'Can Lift Equipment',
      'Background Check Consent', 'Agreed Policies',
      'Status', 'Admin Notes', 'Applied Date',
    ];

    const rows = (applications || []).map((a) => [
      a.id, a.first_name, a.last_name, a.email, a.phone || '', a.date_of_birth || '', a.age || '', a.gender || '',
      a.address || '', a.city || '', a.state || '', a.zip_code || '', a.country || '',
      a.emergency_contact_name || '', a.emergency_contact_relationship || '', a.emergency_contact_phone || '',
      a.profession || '', a.company_name || '', a.skills || '', a.languages || '',
      a.why_volunteer || '', a.volunteered_before ? 'Yes' : 'No', (() => { try { return JSON.parse(a.interests).join('; '); } catch { return a.interests || ''; } })(),
      (() => { try { return JSON.parse(a.days_available).join('; '); } catch { return a.days_available || ''; } })(), a.time_available || '', a.can_travel ? 'Yes' : 'No', a.preferred_location || '',
      a.experience_with_children ? 'Yes' : 'No', a.comfortable_medical_conditions ? 'Yes' : 'No', a.medical_limitations || '',
      a.has_driver_license ? 'Yes' : 'No', a.can_lift_equipment ? 'Yes' : 'No',
      a.consent_background_check ? 'Yes' : 'No', a.agree_to_policies ? 'Yes' : 'No',
      a.status, a.admin_notes || '', new Date(a.created_at).toLocaleDateString(),
    ]);

    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteer-applications.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Failed to export.' });
  }
});

// ─── Admin: Bulk Email ───────────────────────────────────────────────

router.post('/admin/bulk-email', authenticateToken, async (req, res) => {
  try {
    const { subject, body, filterStatus, filterCity, filterInterest, recipientIds } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required.' });
    }

    let recipients;

    if (recipientIds && recipientIds.length > 0) {
      // Send to specific volunteers
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select('id, first_name, last_name, email')
        .in('id', recipientIds);

      if (error) throw error;
      recipients = data || [];
    } else {
      // Send based on filters
      let query = supabase
        .from('volunteer_applications')
        .select('id, first_name, last_name, email');

      if (filterStatus) query = query.eq('status', filterStatus);
      if (filterCity) query = query.ilike('city', `%${filterCity}%`);
      if (filterInterest) query = query.ilike('interests', `%${filterInterest}%`);

      const { data, error } = await query;
      if (error) throw error;
      recipients = data || [];
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No volunteers match the selected filters.' });
    }

    let sent = 0;
    let failed = 0;

    for (const vol of recipients) {
      try {
        const personalizedBody = body
          .replace(/\{first_name\}/g, vol.first_name)
          .replace(/\{last_name\}/g, vol.last_name)
          .replace(/\{full_name\}/g, `${vol.first_name} ${vol.last_name}`);

        await sendEmail({
          to: vol.email,
          subject,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: linear-gradient(135deg, #1B2A4A, #2C3E6B); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Step of Hope</h1>
              </div>
              <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <div style="font-size: 15px; line-height: 1.7; color: #374151; white-space: pre-wrap;">${personalizedBody}</div>
                <p style="font-size: 15px; line-height: 1.6; color: #1B2A4A; font-weight: 600; font-style: italic; margin-top: 24px;">
                  Never lose hope. Keep on fighting.
                </p>
              </div>
              <div style="background: #f3f4f6; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">Step of Hope Foundation</p>
              </div>
            </div>
          `,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    res.json({ message: `Email sent to ${sent} volunteer(s).${failed > 0 ? ` ${failed} failed.` : ''}`, sent, failed });
  } catch (err) {
    console.error('Bulk email error:', err.message);
    res.status(500).json({ error: 'Failed to send bulk emails.' });
  }
});

export default router;
