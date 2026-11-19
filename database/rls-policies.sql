-- =====================================================================
-- MEDITRACK PRO - ROW LEVEL SECURITY (RLS) POLICIES
-- Production Security Rules for Supabase PostgreSQL
-- =====================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- HELPER FUNCTION: Check if auth.uid() is an approved caregiver for a patient
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_approved_caregiver(target_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.caregiver_relationships
        WHERE patient_id = target_patient_id
          AND caregiver_id = auth.uid()
          AND status = 'APPROVED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 2. POLICIES FOR: profiles
-- =====================================================================

-- Users can insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Users can view own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

-- Approved caregivers can view linked patient profile
DROP POLICY IF EXISTS "profiles_select_by_caregiver" ON public.profiles;
CREATE POLICY "profiles_select_by_caregiver"
    ON public.profiles FOR SELECT
    USING (public.is_approved_caregiver(id));

-- Users can update own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =====================================================================
-- 3. POLICIES FOR: medications
-- =====================================================================

-- Patients can manage their own medications
DROP POLICY IF EXISTS "medications_all_own" ON public.medications;
CREATE POLICY "medications_all_own"
    ON public.medications FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Approved caregivers can read patient medications (read-only)
DROP POLICY IF EXISTS "medications_select_caregiver" ON public.medications;
CREATE POLICY "medications_select_caregiver"
    ON public.medications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.caregiver_relationships
            WHERE patient_id = medications.user_id
              AND caregiver_id = auth.uid()
              AND status = 'APPROVED'
              AND can_view_schedules = TRUE
        )
    );

-- =====================================================================
-- 4. POLICIES FOR: medication_schedules
-- =====================================================================

-- Patients can manage their own schedules
DROP POLICY IF EXISTS "schedules_all_own" ON public.medication_schedules;
CREATE POLICY "schedules_all_own"
    ON public.medication_schedules FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Approved caregivers can read schedules (read-only)
DROP POLICY IF EXISTS "schedules_select_caregiver" ON public.medication_schedules;
CREATE POLICY "schedules_select_caregiver"
    ON public.medication_schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.caregiver_relationships
            WHERE patient_id = medication_schedules.user_id
              AND caregiver_id = auth.uid()
              AND status = 'APPROVED'
              AND can_view_schedules = TRUE
        )
    );

-- =====================================================================
-- 5. POLICIES FOR: medication_events
-- =====================================================================

-- Patients can view, insert and acknowledge their own doses
DROP POLICY IF EXISTS "events_all_own" ON public.medication_events;
CREATE POLICY "events_all_own"
    ON public.medication_events FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Approved caregivers can view patient medication events (read-only)
DROP POLICY IF EXISTS "events_select_caregiver" ON public.medication_events;
CREATE POLICY "events_select_caregiver"
    ON public.medication_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.caregiver_relationships
            WHERE patient_id = medication_events.user_id
              AND caregiver_id = auth.uid()
              AND status = 'APPROVED'
              AND can_view_history = TRUE
        )
    );

-- =====================================================================
-- 6. POLICIES FOR: prescriptions
-- =====================================================================

-- Patients can manage their own prescription scans
DROP POLICY IF EXISTS "prescriptions_all_own" ON public.prescriptions;
CREATE POLICY "prescriptions_all_own"
    ON public.prescriptions FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Approved caregivers can view prescriptions
DROP POLICY IF EXISTS "prescriptions_select_caregiver" ON public.prescriptions;
CREATE POLICY "prescriptions_select_caregiver"
    ON public.prescriptions FOR SELECT
    USING (public.is_approved_caregiver(prescriptions.user_id));

-- =====================================================================
-- 7. POLICIES FOR: caregiver_relationships
-- =====================================================================

-- Patients can view, insert, and update relationships for themselves
DROP POLICY IF EXISTS "caregiver_rel_patient_all" ON public.caregiver_relationships;
CREATE POLICY "caregiver_rel_patient_all"
    ON public.caregiver_relationships FOR ALL
    USING (patient_id = auth.uid())
    WITH CHECK (patient_id = auth.uid());

-- Caregivers can view their own sent requests and active links
DROP POLICY IF EXISTS "caregiver_rel_caregiver_select" ON public.caregiver_relationships;
CREATE POLICY "caregiver_rel_caregiver_select"
    ON public.caregiver_relationships FOR SELECT
    USING (caregiver_id = auth.uid());

-- Caregivers can send link invitations (INSERT) with status 'PENDING'
DROP POLICY IF EXISTS "caregiver_rel_caregiver_insert" ON public.caregiver_relationships;
CREATE POLICY "caregiver_rel_caregiver_insert"
    ON public.caregiver_relationships FOR INSERT
    WITH CHECK (caregiver_id = auth.uid() AND status = 'PENDING');

-- Caregivers can update relationship status if needed (e.g. revoking their own link)
DROP POLICY IF EXISTS "caregiver_rel_caregiver_update" ON public.caregiver_relationships;
CREATE POLICY "caregiver_rel_caregiver_update"
    ON public.caregiver_relationships FOR UPDATE
    USING (caregiver_id = auth.uid())
    WITH CHECK (caregiver_id = auth.uid());

-- =====================================================================
-- 8. POLICIES FOR: blockchain_records
-- =====================================================================

-- Patients can view and insert their own blockchain verification proofs
DROP POLICY IF EXISTS "blockchain_all_own" ON public.blockchain_records;
CREATE POLICY "blockchain_all_own"
    ON public.blockchain_records FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Approved caregivers can view verification proofs
DROP POLICY IF EXISTS "blockchain_select_caregiver" ON public.blockchain_records;
CREATE POLICY "blockchain_select_caregiver"
    ON public.blockchain_records FOR SELECT
    USING (public.is_approved_caregiver(blockchain_records.user_id));

-- =====================================================================
-- 9. SUPABASE STORAGE BUCKET: prescriptions
-- =====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow user prescription uploads" ON storage.objects;
CREATE POLICY "Allow user prescription uploads"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'prescriptions' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Allow user to read own prescription files" ON storage.objects;
CREATE POLICY "Allow user to read own prescription files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'prescriptions' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Allow user to delete own prescription files" ON storage.objects;
CREATE POLICY "Allow user to delete own prescription files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'prescriptions' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
