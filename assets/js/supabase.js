/**
 * MediTrack Pro - Supabase Client & Database Services
 * Module 02 & Module 03: Authentication, Profiles & Medication Schedule Management
 */

const SupabaseService = {
  client: null,
  isConfigured: false,

  /**
   * Initialize Supabase Client
   */
  init() {
    const config = window.ENV_CONFIG || {};
    const url = config.SUPABASE_URL;
    const key = config.SUPABASE_ANON_KEY;

    if (
      url &&
      key &&
      !url.includes('YOUR_SUPABASE') &&
      !key.includes('YOUR_SUPABASE') &&
      typeof window.supabase !== 'undefined'
    ) {
      try {
        this.client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        this.isConfigured = true;
        console.log('[SupabaseService] Connected to Supabase Project:', url);
      } catch (err) {
        console.error('[SupabaseService] Initialization Error:', err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.info(
        '[SupabaseService] Running in Local Storage Mode. To connect real Supabase, edit config/config.js with your project credentials.'
      );
    }

    this.ensureLocalSampleMedications();
  },

  hasActiveConfig() {
    return this.isConfigured && this.client !== null;
  },

  /**
   * Seed realistic sample medications for offline/demo if empty
   */
  ensureLocalSampleMedications() {
    const existing = StorageHelper.get('med_app_medicines', null);
    if (!existing || existing.length === 0) {
      const initialMedicines = [
        {
          id: 'med-sample-1',
          name: 'Vitamin D3',
          dosage: '1000 IU',
          form_type: 'tablet',
          instructions: 'Take after breakfast with water.',
          frequency: 'once_daily',
          timings: ['09:00'],
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          reminder_interval_mins: 10,
          confirmation_deadline_mins: 60,
          is_active: true
        },
        {
          id: 'med-sample-2',
          name: 'Metformin HCl',
          dosage: '500 mg',
          form_type: 'tablet',
          instructions: 'Take with meals to minimize gastrointestinal discomfort.',
          frequency: 'twice_daily',
          timings: ['08:00', '19:30'],
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          reminder_interval_mins: 10,
          confirmation_deadline_mins: 60,
          is_active: true
        },
        {
          id: 'med-sample-3',
          name: 'Thyroxine Sodium',
          dosage: '50 mcg',
          form_type: 'tablet',
          instructions: 'Take on empty stomach 30 mins before morning breakfast.',
          frequency: 'once_daily',
          timings: ['07:00'],
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          reminder_interval_mins: 15,
          confirmation_deadline_mins: 60,
          is_active: true
        },
        {
          id: 'med-sample-4',
          name: 'Atorvastatin',
          dosage: '10 mg',
          form_type: 'capsule',
          instructions: 'Take before bedtime.',
          frequency: 'once_daily',
          timings: ['21:00'],
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          reminder_interval_mins: 10,
          confirmation_deadline_mins: 60,
          is_active: true
        }
      ];
      StorageHelper.set('med_app_medicines', initialMedicines);
    }
  },

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  async signUp(email, password, role, fullName) {
    if (!this.hasActiveConfig()) {
      return {
        success: true,
        isSimulated: true,
        user: { email, role, fullName, id: 'simulated-' + Date.now() },
        message: 'Registered in local demo mode.'
      };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { role, full_name: fullName }
        }
      });
      if (error) throw error;
      return { success: true, isSimulated: false, user: data.user, session: data.session };
    } catch (err) {
      console.error('[SupabaseService] SignUp Error:', err);
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  async signIn(email, password) {
    if (!this.hasActiveConfig()) {
      return {
        success: true,
        isSimulated: true,
        user: { email, id: 'simulated-' + Date.now() },
        message: 'Signed in via local demo mode.'
      };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (error) throw error;
      return { success: true, isSimulated: false, user: data.user, session: data.session };
    } catch (err) {
      console.error('[SupabaseService] SignIn Error:', err);
      return { success: false, error: err.message || 'Invalid email or password' };
    }
  },

  async signOut() {
    if (this.hasActiveConfig()) {
      try {
        await this.client.auth.signOut();
      } catch (err) {
        console.warn('[SupabaseService] SignOut Error:', err);
      }
    }
    StorageHelper.remove('med_app_user');
  },

  async resetPassword(email) {
    if (!this.hasActiveConfig()) {
      return {
        success: true,
        isSimulated: true,
        message: `Password reset simulation: In production, Supabase sends recovery email to ${email}.`
      };
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login.html'
      });
      if (error) throw error;
      return { success: true, message: `Password reset link sent to ${email}. Check your inbox.` };
    } catch (err) {
      console.error('[SupabaseService] ResetPassword Error:', err);
      return { success: false, error: err.message || 'Password reset request failed' };
    }
  },

  async getSession() {
    if (!this.hasActiveConfig()) {
      return StorageHelper.get('med_app_user', null);
    }

    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    } catch (err) {
      console.warn('[SupabaseService] GetSession Error:', err);
      return null;
    }
  },

  async getProfile(userId) {
    if (!this.hasActiveConfig()) {
      return StorageHelper.get('med_app_user', null);
    }

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[SupabaseService] GetProfile Error:', err);
      return null;
    }
  },

  async updateProfile(userId, profileData) {
    if (!this.hasActiveConfig()) {
      const current = StorageHelper.get('med_app_user', {});
      const updated = { ...current, ...profileData };
      StorageHelper.set('med_app_user', updated);
      return { success: true, data: updated };
    }

    try {
      const { data, error } = await this.client
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('[SupabaseService] UpdateProfile Error:', err);
      return { success: false, error: err.message };
    }
  },

  // ==========================================
  // MODULE 03: MEDICATION CRUD METHODS
  // ==========================================

  /**
   * Fetch all medications with their schedules
   */
  async getMedications(userId) {
    if (!this.hasActiveConfig() || !userId) {
      return StorageHelper.get('med_app_medicines', []);
    }

    try {
      const { data, error } = await this.client
        .from('medications')
        .select(`
          id, name, dosage, form_type, instructions, is_active, created_at,
          medication_schedules (
            id, frequency, dose_time, reminder_interval_mins,
            confirmation_deadline_mins, start_date, end_date, is_active
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform into unified frontend representation
      return data.map(m => {
        const schedules = m.medication_schedules || [];
        const firstSched = schedules[0] || {};
        return {
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          form_type: m.form_type,
          instructions: m.instructions,
          is_active: m.is_active,
          frequency: firstSched.frequency || 'once_daily',
          timings: schedules.map(s => s.dose_time ? s.dose_time.substring(0, 5) : '08:00'),
          start_date: firstSched.start_date || '',
          end_date: firstSched.end_date || null,
          reminder_interval_mins: firstSched.reminder_interval_mins || 10,
          confirmation_deadline_mins: firstSched.confirmation_deadline_mins || 60,
          rawSchedules: schedules
        };
      });
    } catch (err) {
      console.warn('[SupabaseService] getMedications Error, falling back to local:', err);
      return StorageHelper.get('med_app_medicines', []);
    }
  },

  /**
   * Add a new medication and its dosing schedules
   */
  async addMedication(userId, med) {
    const localId = 'med-' + Date.now();
    const newRecord = {
      id: localId,
      name: med.name,
      dosage: med.dosage,
      form_type: med.form_type,
      instructions: med.instructions,
      frequency: med.frequency,
      timings: med.timings,
      start_date: med.start_date,
      end_date: med.end_date || null,
      reminder_interval_mins: parseInt(med.reminder_interval_mins, 10) || 10,
      confirmation_deadline_mins: parseInt(med.confirmation_deadline_mins, 10) || 60,
      is_active: true
    };

    // Update Local Storage
    const localList = StorageHelper.get('med_app_medicines', []);
    localList.unshift(newRecord);
    StorageHelper.set('med_app_medicines', localList);

    if (!this.hasActiveConfig() || !userId) {
      return { success: true, data: newRecord, isSimulated: true };
    }

    try {
      // 1. Insert into medications
      const { data: medData, error: medError } = await this.client
        .from('medications')
        .insert({
          user_id: userId,
          name: med.name,
          dosage: med.dosage,
          form_type: med.form_type,
          instructions: med.instructions,
          is_active: true
        })
        .select()
        .single();

      if (medError) throw medError;

      // 2. Insert into medication_schedules for each timing
      const scheduleRows = (med.timings || ['08:00']).map(t => ({
        medication_id: medData.id,
        user_id: userId,
        frequency: med.frequency,
        dose_time: t.length === 5 ? `${t}:00` : t,
        reminder_interval_mins: newRecord.reminder_interval_mins,
        confirmation_deadline_mins: newRecord.confirmation_deadline_mins,
        start_date: med.start_date,
        end_date: med.end_date || null,
        is_active: true
      }));

      const { error: schedError } = await this.client
        .from('medication_schedules')
        .insert(scheduleRows);

      if (schedError) throw schedError;

      newRecord.id = medData.id;
      return { success: true, data: newRecord, isSimulated: false };
    } catch (err) {
      console.error('[SupabaseService] addMedication Database Error:', err);
      // Returns true because local fallback succeeded
      return { success: true, data: newRecord, isSimulated: true, warning: err.message };
    }
  },

  /**
   * Update an existing medication
   */
  async updateMedication(userId, medId, med) {
    // 1. Update in Local Storage
    const localList = StorageHelper.get('med_app_medicines', []);
    const idx = localList.findIndex(m => m.id === medId);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...med };
      StorageHelper.set('med_app_medicines', localList);
    }

    if (!this.hasActiveConfig() || !userId) {
      return { success: true, isSimulated: true };
    }

    try {
      // Update medications table
      const { error: medError } = await this.client
        .from('medications')
        .update({
          name: med.name,
          dosage: med.dosage,
          form_type: med.form_type,
          instructions: med.instructions
        })
        .eq('id', medId)
        .eq('user_id', userId);

      if (medError) throw medError;

      // Re-sync schedules: delete old and re-insert new
      await this.client
        .from('medication_schedules')
        .delete()
        .eq('medication_id', medId)
        .eq('user_id', userId);

      const scheduleRows = (med.timings || ['08:00']).map(t => ({
        medication_id: medId,
        user_id: userId,
        frequency: med.frequency,
        dose_time: t.length === 5 ? `${t}:00` : t,
        reminder_interval_mins: parseInt(med.reminder_interval_mins, 10) || 10,
        confirmation_deadline_mins: parseInt(med.confirmation_deadline_mins, 10) || 60,
        start_date: med.start_date,
        end_date: med.end_date || null,
        is_active: true
      }));

      await this.client.from('medication_schedules').insert(scheduleRows);

      return { success: true, isSimulated: false };
    } catch (err) {
      console.error('[SupabaseService] updateMedication Database Error:', err);
      return { success: true, isSimulated: true, warning: err.message };
    }
  },

  /**
   * Delete a medication
   */
  async deleteMedication(userId, medId) {
    // 1. Remove from Local Storage
    let localList = StorageHelper.get('med_app_medicines', []);
    localList = localList.filter(m => m.id !== medId);
    StorageHelper.set('med_app_medicines', localList);

    if (!this.hasActiveConfig() || !userId) {
      return { success: true, isSimulated: true };
    }

    try {
      const { error } = await this.client
        .from('medications')
        .delete()
        .eq('id', medId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, isSimulated: false };
    } catch (err) {
      console.error('[SupabaseService] deleteMedication Database Error:', err);
      return { success: true, isSimulated: true, warning: err.message };
    }
  },

  // ==========================================
  // MODULE 04: MEDICATION EVENT ACKNOWLEDGEMENT
  // ==========================================

  /**
   * Save explicit dose acknowledgement or missed status to Supabase
   */
  async recordMedicationEvent(userId, eventObj) {
    const today = new Date().toISOString().split('T')[0];
    const key = `med_events_${today}`;
    const localEvents = StorageHelper.get(key, []);
    const filtered = localEvents.filter(e => !(e.medId === eventObj.medId && e.time === eventObj.time));
    filtered.push(eventObj);
    StorageHelper.set(key, filtered);

    if (!this.hasActiveConfig() || !userId) {
      return { success: true, isSimulated: true, data: eventObj };
    }

    try {
      const { data, error } = await this.client
        .from('medication_events')
        .upsert({
          medication_id: eventObj.medId,
          user_id: userId,
          scheduled_for: eventObj.scheduled_for,
          acknowledged_at: eventObj.acknowledged_at,
          status: eventObj.status,
          event_hash: eventObj.event_hash,
          blockchain_status: eventObj.blockchain_status || 'PENDING_VERIFICATION',
          notes: eventObj.notes || null
        }, {
          onConflict: 'schedule_id, scheduled_for'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, isSimulated: false };
    } catch (err) {
      console.warn('[SupabaseService] recordMedicationEvent Error (using local store):', err);
      return { success: true, isSimulated: true, warning: err.message };
    }
  },

  /**
   * Retrieve all recorded events for patient history
   */
  async getMedicationEvents(userId) {
    if (!this.hasActiveConfig() || !userId) {
      const today = new Date().toISOString().split('T')[0];
      return StorageHelper.get(`med_events_${today}`, []);
    }

    try {
      const { data, error } = await this.client
        .from('medication_events')
        .select(`
          id, scheduled_for, acknowledged_at, status, event_hash, blockchain_status, notes,
          medications ( name, dosage, form_type )
        `)
        .eq('user_id', userId)
        .order('scheduled_for', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[SupabaseService] getMedicationEvents Error, falling back to local:', err);
      const today = new Date().toISOString().split('T')[0];
      return StorageHelper.get(`med_events_${today}`, []);
    }
  },

  /**
   * Record Ethereum Sepolia Transaction Proof in Supabase
   */
  async recordBlockchainProof(proofData) {
    if (!this.hasActiveConfig() || !proofData) {
      return { success: true, isSimulated: true, data: proofData };
    }

    try {
      const user = StorageHelper.get('med_app_user', {});
      const { data, error } = await this.client
        .from('blockchain_records')
        .upsert({
          event_id: proofData.event_id,
          user_id: user.id,
          canonical_event_hash: proofData.event_hash,
          transaction_hash: proofData.transaction_hash,
          block_number: proofData.block_number,
          contract_address: proofData.contract_address || '0x71C2E6047192C2366A59a6869a25b290740B4800',
          wallet_address: proofData.wallet_address,
          verification_status: 'VERIFIED'
        }, {
          onConflict: 'event_id'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('[SupabaseService] recordBlockchainProof error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Caregiver Relationship Management
   */
  async updateCaregiverStatus(relId, status) {
    if (!this.hasActiveConfig()) return { success: true, isSimulated: true };

    try {
      const { data, error } = await this.client
        .from('caregiver_relationships')
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', relId);

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('[SupabaseService] updateCaregiverStatus error:', err);
      return { success: false, error: err.message };
    }
  },

  async createCaregiverRequest(caregiverId, patientIdentifier) {
    if (!this.hasActiveConfig()) return { success: true, isSimulated: true };

    try {
      const { data, error } = await this.client
        .from('caregiver_relationships')
        .insert({
          caregiver_id: caregiverId,
          patient_id: patientIdentifier,
          status: 'PENDING',
          can_view_adherence: true,
          can_receive_missed_alerts: true
        });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('[SupabaseService] createCaregiverRequest error:', err);
      return { success: false, error: err.message };
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SupabaseService.init();
});
