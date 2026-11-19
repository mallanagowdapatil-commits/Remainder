-- =====================================================================
-- MEDITRACK PRO - DATABASE SCHEMA (PostgreSQL / Supabase)
-- Production Clean Schema for Medication Reminder & Adherence Tracker
-- =====================================================================

-- Enable necessary PostgreSQL cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. TABLE: profiles
-- User profiles for Patients and Caregivers linked to auth.users
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'caregiver')),
    full_name TEXT NOT NULL,
    phone VARCHAR(20),
    age INTEGER CHECK (age > 0 AND age < 150),
    blood_group VARCHAR(10),
    clinical_notes TEXT,
    language_preference VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language_preference IN ('en', 'kn', 'hi')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Patient and caregiver user profile information.';

-- =====================================================================
-- 2. TABLE: medications
-- Master medication list prescribed to patients
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    form_type VARCHAR(30) NOT NULL DEFAULT 'tablet' CHECK (
        form_type IN ('tablet', 'capsule', 'syrup', 'injection', 'drops', 'inhaler', 'other')
    ),
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.medications IS 'Prescribed medications owned and managed by patients.';

-- =====================================================================
-- 3. TABLE: medication_schedules
-- Timetable, frequencies, reminder intervals, and confirmation deadlines
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    frequency VARCHAR(30) NOT NULL DEFAULT 'once_daily' CHECK (
        frequency IN ('once_daily', 'twice_daily', 'thrice_daily', 'custom')
    ),
    dose_time TIME NOT NULL,
    reminder_interval_mins INTEGER NOT NULL DEFAULT 10 CHECK (reminder_interval_mins IN (5, 10, 15)),
    confirmation_deadline_mins INTEGER NOT NULL DEFAULT 60 CHECK (confirmation_deadline_mins > 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

COMMENT ON TABLE public.medication_schedules IS 'Dosing timetable and reminder configuration.';

-- =====================================================================
-- 4. TABLE: medication_events
-- Individual scheduled dose events and explicit user acknowledgements
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.medication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.medication_schedules(id) ON DELETE SET NULL,
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TAKEN', 'MISSED')),
    event_hash VARCHAR(64), -- Deterministic canonical SHA-256 digest
    blockchain_status VARCHAR(30) NOT NULL DEFAULT 'NOT_YET_RECORDED' CHECK (
        blockchain_status IN ('NOT_YET_RECORDED', 'PENDING_VERIFICATION', 'VERIFIED', 'MODIFIED_OR_INVALID')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_patient_med_dose UNIQUE (user_id, medication_id, scheduled_for),
    -- Dose intake rule: Dose marked TAKEN must have an explicit acknowledgement timestamp
    CONSTRAINT taken_must_have_timestamp CHECK (
        (status = 'TAKEN' AND acknowledged_at IS NOT NULL) OR (status <> 'TAKEN')
    )
);

COMMENT ON TABLE public.medication_events IS 'Audit log of each individual dose acknowledgement.';

-- =====================================================================
-- 5. TABLE: prescriptions
-- Prescription image uploads and OCR candidate records
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    ocr_raw_text TEXT,
    ocr_extracted_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    doctor_name VARCHAR(255),
    prescription_date DATE,
    verified_by_patient BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.prescriptions IS 'Prescription scans and OCR candidates awaiting patient verification.';

-- =====================================================================
-- 6. TABLE: caregiver_relationships
-- Explicit access-control links connecting patients with caregivers
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.caregiver_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')),
    can_view_schedules BOOLEAN NOT NULL DEFAULT TRUE,
    can_view_history BOOLEAN NOT NULL DEFAULT TRUE,
    can_receive_missed_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_patient_caregiver UNIQUE (patient_id, caregiver_id),
    CONSTRAINT distinct_patient_caregiver CHECK (patient_id <> caregiver_id)
);

COMMENT ON TABLE public.caregiver_relationships IS 'Access-control links between patients and verified caregivers.';

-- =====================================================================
-- 7. TABLE: blockchain_records
-- On-chain transaction references & Ethereum Sepolia verification records
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.blockchain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.medication_events(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    canonical_event_hash VARCHAR(64) NOT NULL,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    contract_address VARCHAR(42),
    wallet_address VARCHAR(42),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (
        verification_status IN ('NOT_YET_RECORDED', 'PENDING_VERIFICATION', 'VERIFIED', 'MODIFIED_OR_INVALID')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.blockchain_records IS 'Ethereum Sepolia audit trail for immutable event timestamp verification.';

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_med_schedules_med_id ON public.medication_schedules(medication_id);
CREATE INDEX IF NOT EXISTS idx_med_schedules_user_id ON public.medication_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_med_events_user_id ON public.medication_events(user_id);
CREATE INDEX IF NOT EXISTS idx_med_events_scheduled_for ON public.medication_events(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_med_events_status ON public.medication_events(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_patient_id ON public.caregiver_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_caregiver_id ON public.caregiver_relationships(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_event_id ON public.blockchain_records(event_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON public.blockchain_records(transaction_hash);

-- =====================================================================
-- TRIGGER FUNCTIONS
-- =====================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles ON public.profiles;
CREATE TRIGGER trigger_update_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_medications ON public.medications;
CREATE TRIGGER trigger_update_medications
    BEFORE UPDATE ON public.medications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_medication_events ON public.medication_events;
CREATE TRIGGER trigger_update_medication_events
    BEFORE UPDATE ON public.medication_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_caregiver_rel ON public.caregiver_relationships;
CREATE TRIGGER trigger_update_caregiver_rel
    BEFORE UPDATE ON public.caregiver_relationships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(20);
    user_name TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));

    IF user_role NOT IN ('patient', 'caregiver') THEN
        user_role := 'patient';
    END IF;

    INSERT INTO public.profiles (id, role, full_name, created_at, updated_at)
    VALUES (NEW.id, user_role, user_name, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
