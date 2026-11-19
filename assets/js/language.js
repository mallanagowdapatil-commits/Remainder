/**
 * MediTrack - Multilingual Localization (i18n) Engine
 * English, Kannada (ಕನ್ನಡ) & Hindi (हिंदी) Translation Dictionaries & Live DOM Updater
 */

const I18n = {
  currentLang: 'en',

  translations: {
    en: {
      // Navigation
      'nav_dashboard': 'Dashboard',
      'nav_medicines': 'My Medicines',
      'nav_add_medicine': 'Add Medicine',
      'nav_scanner': 'Prescription Scanner',
      'nav_history': 'Medication History',
      'nav_blockchain': 'Verification Hub',
      'nav_caregiver': 'Caregiver Hub',
      'nav_pharmacy': 'Pharmacy Access',
      'nav_language': 'Language Settings',
      'nav_profile': 'Profile',
      'nav_logout': 'Logout',

      // Dashboard Titles & Stats
      'dash_title': 'Patient Dashboard',
      'dash_subtitle': 'Overview of daily schedules, adherence and pending acknowledgements',
      'stat_active_meds': 'Active Medications',
      'stat_today_doses': 'Scheduled Doses Today',
      'stat_pending': 'Pending Doses',
      'stat_adherence': 'Adherence Rate',
      'today_schedule_title': "Today's Medication Schedule",
      'today_schedule_sub': 'Confirm doses as you take them to record accurate timestamps',

      // Checkbox Acknowledgement Rule
      'checkbox_label': 'I have taken this medicine',
      'status_taken': 'Taken',
      'status_pending': 'Pending',
      'status_missed': 'Missed',
      'status_scheduled': 'Scheduled',
      'ack_confirmed': 'Confirmed Taken',
      'ack_taken_label': 'Confirmed Taken',
      'ack_missed_label': 'Marked as Missed',

      // Actions & Buttons
      'btn_snooze': 'Snooze',
      'btn_missed': 'Missed',
      'btn_refresh': 'Refresh',
      'btn_add_medicine': 'Add Medicine',
      'btn_details': 'Details',
      'btn_edit': 'Edit',
      'btn_delete': 'Delete',
      'btn_save': 'Save Changes',
      'btn_cancel': 'Cancel',
      'btn_dismiss': 'Dismiss Alert',
      'btn_export_csv': 'Export CSV',
      'btn_save_schedule': 'Save Medication Schedule',
      'btn_enable_alerts': 'Enable Alerts',
      'btn_alerts_active': 'Alerts Active',
      'btn_confirm_candidates': 'Confirm and Add All',
      'btn_get_started': 'Get Started',
      'btn_sign_in': 'Sign In',
      'btn_sign_up': 'Create Account',

      // In-App Reminder Modal
      'modal_due_title': 'Medication Dose Due',
      'modal_due_subtitle': 'Please confirm your dose intake',
      'modal_need_time': 'Need more time? Snooze reminder (dose remains pending):',
      'modal_instruction_label': 'Instructions:',

      // Add Medicine Form
      'form_med_name': 'Medicine Name',
      'form_dosage': 'Dosage (e.g., 500mg)',
      'form_type': 'Form / Type',
      'form_frequency': 'Schedule Frequency',
      'form_dose_times': 'Scheduled Dose Times',
      'form_start_date': 'Start Date',
      'form_end_date': 'End Date (Optional)',
      'form_interval': 'Reminder Interval',
      'form_deadline': 'Confirmation Deadline',
      'form_instructions': 'Instructions & Precautions',

      // History & Reports
      'hist_title': 'Medication History & Reports',
      'hist_adherence_report': 'Adherence Summary',
      'hist_col_name': 'Medicine Name',
      'hist_col_dosage': 'Dosage',
      'hist_col_scheduled': 'Scheduled Time',
      'hist_col_ack': 'Recorded Intake',
      'hist_col_status': 'Status',
      'hist_col_blockchain': 'Verification',
      'filter_all': 'All Records',

      // OCR & Pharmacy
      'ocr_title': 'Scan Doctor Prescription',
      'ocr_subtitle': 'Upload or take a photo to detect multiple medicines and add them to your schedule',
      'ocr_verify_warning': 'Please verify all details against your original prescription before confirming.',
      'ocr_no_meds_found': 'No medicines could be clearly detected. You can enter details manually.',
      'ocr_manual_entry': 'Enter Manually',
      'pharmacy_title': 'Trusted Online Pharmacies',
      'pharmacy_subtitle': 'Order verified medicines directly from authorized licensed partner services',
      'pharmacy_disclaimer': 'Online ordering available on their official site. Links open official partner websites in a new tab.',

      // Landing Page
      'hero_title': 'Never miss a dose. Track your health with confidence.',
      'hero_subtitle': 'Smart medication reminders with explicit dose confirmation, prescription scanning, and secure health records.',
      'feature_reminders_title': 'Smart Reminders',
      'feature_reminders_desc': 'Timely alerts with explicit checkbox confirmation to ensure accuracy.',
      'feature_scanner_title': 'Scan Prescriptions',
      'feature_scanner_desc': 'Snap a photo of your prescription to import multiple medicines effortlessly.',
      'feature_lang_title': '3 Languages',
      'feature_lang_desc': 'Full support for English, ಕನ್ನಡ (Kannada), and हिंदी (Hindi).',
      'feature_offline_title': 'Works Offline',
      'feature_offline_desc': 'View schedules and mark doses even without an internet connection.',
      'feature_security_title': 'Secure Records',
      'feature_security_desc': 'Tamper-resistant adherence history verified with cryptographic integrity.'
    },

    kn: {
      // Navigation (ಕನ್ನಡ)
      'nav_dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'nav_medicines': 'ನನ್ನ ಔಷಧಿಗಳು',
      'nav_add_medicine': 'ಔಷಧಿ ಸೇರಿಸಿ',
      'nav_scanner': 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನರ್',
      'nav_history': 'ಔಷಧಿ ಇತಿಹಾಸ',
      'nav_blockchain': 'ಪರಿಶೀಲನಾ ಕೇಂದ್ರ',
      'nav_caregiver': 'ಆರೈಕೆದಾರರ ಕೇಂದ್ರ',
      'nav_pharmacy': 'ಔಷಧಾಲಯ ಪ್ರವೇಶ',
      'nav_language': 'ಭಾಷಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      'nav_profile': 'ಪ್ರೊಫೈಲ್',
      'nav_logout': 'ಲಾಗ್‌ಔಟ್',

      // Dashboard Titles & Stats
      'dash_title': 'ರೋಗಿಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'dash_subtitle': 'ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ, ಔಷಧ ಪಾಲನೆ ಮತ್ತು ಬಾಕಿ ಪ್ರಮಾಣಗಳ ಅವಲೋಕನ',
      'stat_active_meds': 'ಸಕ್ರಿಯ ಔಷಧಿಗಳು',
      'stat_today_doses': 'ಇಂದಿನ ನಿಗದಿತ ಪ್ರಮಾಣಗಳು',
      'stat_pending': 'ಬಾಕಿ ಪ್ರಮಾಣಗಳು',
      'stat_adherence': 'ಪಾಲನಾ ಪ್ರಮಾಣ',
      'today_schedule_title': 'ಇಂದಿನ ಔಷಧ ವೇಳಾಪಟ್ಟಿ',
      'today_schedule_sub': 'ಸರಿಯಾದ ಸಮಯವನ್ನು ದಾಖಲಿಸಲು ನೀವು ಸೇವಿಸಿದಂತೆ ಔಷಧವನ್ನು ದೃಢೀಕರಿಸಿ',

      // Checkbox Acknowledgement Rule
      'checkbox_label': 'ನಾನು ಈ ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ',
      'status_taken': 'ತೆಗೆದುಕೊಂಡಿದೆ',
      'status_pending': 'ಬಾಕಿ ಉಳಿದಿದೆ',
      'status_missed': 'ತಪ್ಪಿಹೋಗಿದೆ',
      'status_scheduled': 'ನಿಗದಿಯಾಗಿದೆ',
      'ack_confirmed': 'ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ದೃಢಪಟ್ಟಿದೆ',
      'ack_taken_label': 'ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ದೃಢೀಕರಿಸಲಾಗಿದೆ',
      'ack_missed_label': 'ಪ್ರಮಾಣ ತಪ್ಪಿಹೋಗಿದೆ ಎಂದು ದಾಖಲಾಗಿದೆ',

      // Actions & Buttons
      'btn_snooze': 'ಸ್ನೂಜ್ (ನಂತರ ನೆನಪಿಸಿ)',
      'btn_missed': 'ತಪ್ಪಿದೆ ಎಂದು ಗುರುತಿಸಿ',
      'btn_refresh': 'ರಿಫ್ರೆಶ್ ಮಾಡಿ',
      'btn_add_medicine': 'ಹೊಸ ಔಷಧಿ ಸೇರಿಸಿ',
      'btn_details': 'ವಿವರಗಳು',
      'btn_edit': 'ತಿದ್ದುಪಡಿ',
      'btn_delete': 'ಅಳಿಸಿ',
      'btn_save': 'ಬದಲಾವಣೆ ಉಳಿಸಿ',
      'btn_cancel': 'ರದ್ದುಮಾಡಿ',
      'btn_dismiss': 'ಎಚ್ಚರಿಕೆ ಮುಚ್ಚಿ',
      'btn_export_csv': 'CSV ರಫ್ತು ಮಾಡಿ',
      'btn_save_schedule': 'ಔಷಧ ವೇಳಾಪಟ್ಟಿ ಉಳಿಸಿ',
      'btn_enable_alerts': 'ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯಗೊಳಿಸಿ',
      'btn_alerts_active': 'ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯವಾಗಿದೆ',
      'btn_confirm_candidates': 'ದೃಢೀಕರಿಸಿ ಎಲ್ಲವನ್ನೂ ಸೇರಿಸಿ',
      'btn_get_started': 'ಪ್ರಾರಂಭಿಸಿ',
      'btn_sign_in': 'ಸೈನ್ ಇನ್',
      'btn_sign_up': 'ಖಾತೆ ತೆರೆಯಿರಿ',

      // In-App Reminder Modal
      'modal_due_title': 'ಔಷಧ ಸೇವನೆಯ ಸಮಯವಾಗಿದೆ',
      'modal_due_subtitle': 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಔಷಧ ಸೇವನೆಯನ್ನು ದೃಢೀಕರಿಸಿ',
      'modal_need_time': 'ಹೆಚ್ಚಿನ ಸಮಯ ಬೇಕೇ? ಜ್ಞಾಪನೆಯನ್ನು ಸ್ನೂಜ್ ಮಾಡಿ (ಪ್ರಮಾಣ ಬಾಕಿ ಇರುತ್ತದೆ):',
      'modal_instruction_label': 'ಸೂಚನೆಗಳು:',

      // Add Medicine Form
      'form_med_name': 'ಔಷಧಿಯ ಹೆಸರು',
      'form_dosage': 'ಪ್ರಮಾಣ (ಉದಾ. 500mg)',
      'form_type': 'ರೂಪ / ಪ್ರಕಾರ',
      'form_frequency': 'ವೇಳಾಪಟ್ಟಿ ಆವರ್ತನ',
      'form_dose_times': 'ನಿಗದಿತ ಡೋಸ್ ಸಮಯಗಳು',
      'form_start_date': 'ಪ್ರಾರಂಭ ದಿನಾಂಕ',
      'form_end_date': 'ಅಂತಿಮ ದಿನಾಂಕ (ಐಚ್ಛಿಕ)',
      'form_interval': 'ಜ್ಞಾಪನೆ ಮಧ್ಯಂತರ',
      'form_deadline': 'ದೃಢೀಕರಣದ ಅಂತಿಮ ಗಡುವು',
      'form_instructions': 'ಸೂಚನೆಗಳು ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು',

      // History & Reports
      'hist_title': 'ಔಷಧಿ ಇತಿಹಾಸ ಮತ್ತು ವರದಿಗಳು',
      'hist_adherence_report': 'ಔಷಧ ಪಾಲನೆ ಸಾರಾಂಶ',
      'hist_col_name': 'ಔಷಧಿಯ ಹೆಸರು',
      'hist_col_dosage': 'ಪ್ರಮಾಣ',
      'hist_col_scheduled': 'ನಿಗದಿತ ಸಮಯ',
      'hist_col_ack': 'ದಾಖಲಾದ ಸೇವನೆ',
      'hist_col_status': 'ಸ್ಥಿತಿ',
      'hist_col_blockchain': 'ಪರಿಶೀಲನೆ',
      'filter_all': 'ಎಲ್ಲಾ ದಾಖಲೆಗಳು',

      // OCR & Pharmacy
      'ocr_title': 'ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
      'ocr_subtitle': 'ಹಲವಾರು ಔಷಧಿಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿ ವೇಳಾಪಟ್ಟಿಗೆ ಸೇರಿಸಲು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ತೆಗೆಯಿರಿ',
      'ocr_verify_warning': 'ದೃಢೀಕರಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಮೂಲ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ನೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.',
      'ocr_no_meds_found': 'ಯಾವುದೇ ಔಷಧಿಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಪತ್ತೆಹಚ್ಚಲಾಗಿಲ್ಲ. ನೀವು ವಿವರಗಳನ್ನು ಹಸ್ತಚಾಲಿತವಾಗಿ ನಮೂದಿಸಬಹುದು.',
      'ocr_manual_entry': 'ಸ್ವತಃ ನಮೂದಿಸಿ',
      'pharmacy_title': 'ವಿಶ್ವಾಸಾರ್ಹ ಆನ್‌ಲೈನ್ ಔಷಧಾಲಯಗಳು',
      'pharmacy_subtitle': 'ಪರವಾನಗಿ ಪಡೆದ ಪಾಲುದಾರ ಸೇವೆಗಳಿಂದ ನೇರವಾಗಿ ಔಷಧಿಗಳನ್ನು ಆರ್ಡರ್ ಮಾಡಿ',
      'pharmacy_disclaimer': 'ಅವರ ಅಧಿಕೃತ ಸೈಟ್‌ನಲ್ಲಿ ಆನ್‌ಲೈನ್ ಆರ್ಡರ್ ಲಭ್ಯವಿದೆ. ಲಿಂಕ್‌ಗಳು ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯುತ್ತವೆ.',

      // Landing Page
      'hero_title': 'ಔಷಧಿಯನ್ನು ಎಂದಿಗೂ ಮರೆಯಬೇಡಿ. ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ನೋಡಿಕೊಳ್ಳಿ.',
      'hero_subtitle': 'ಸ್ಪಷ್ಟ ಡೋಸ್ ದೃಢೀಕರಣ, ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನಿಂಗ್ ಮತ್ತು ಸುರಕ್ಷಿತ ಆರೋಗ್ಯ ದಾಖಲೆಗಳೊಂದಿಗೆ ಸ್ಮಾರ್ಟ್ ಜ್ಞಾಪನೆಗಳು.',
      'feature_reminders_title': 'ಸ್ಮಾರ್ಟ್ ಜ್ಞಾಪನೆಗಳು',
      'feature_reminders_desc': 'ನಿಖರತೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಚೆಕ್‌ಬಾಕ್ಸ್ ದೃಢೀಕರಣದೊಂದಿಗೆ ಸಮಯೋಚಿತ ಎಚ್ಚರಿಕೆಗಳು.',
      'feature_scanner_title': 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನ್',
      'feature_scanner_desc': 'ಹಲವಾರು ಔಷಧಿಗಳನ್ನು ಸುಲಭವಾಗಿ ಸೇರಿಸಲು ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.',
      'feature_lang_title': '3 ಭಾಷೆಗಳು',
      'feature_lang_desc': 'ಇಂಗ್ಲಿಷ್, ಕನ್ನಡ ಮತ್ತು ಹಿಂದಿ ಭಾಷೆಗಳಲ್ಲಿ ಸಂಪೂರ್ಣ ಲಭ್ಯತೆ.',
      'feature_offline_title': 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲೂ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
      'feature_offline_desc': 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ವೇಳಾಪಟ್ಟಿ ನೋಡಿ ಮತ್ತು ಔಷಧ ಸೇವನೆ ದಾಖಲಿಸಿ.',
      'feature_security_title': 'ಸುರಕ್ಷಿತ ದಾಖಲೆಗಳು',
      'feature_security_desc': 'ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಭದ್ರತೆಯೊಂದಿಗೆ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಬದಲಾಯಿಸಲಾಗದ ದಾಖಲೆಗಳು.'
    },

    hi: {
      // Navigation (हिंदी)
      'nav_dashboard': 'डैशबोर्ड',
      'nav_medicines': 'मेरी दवाइयां',
      'nav_add_medicine': 'दवाई जोड़ें',
      'nav_scanner': 'पर्ची स्कैनर (OCR)',
      'nav_history': 'दवा इतिहास',
      'nav_blockchain': 'सत्यापन केंद्र',
      'nav_caregiver': 'देखभालकर्ता केंद्र',
      'nav_pharmacy': 'फार्मेसी पोर्टल',
      'nav_language': 'भाषा सेटिंग्स',
      'nav_profile': 'प्रोफ़ाइल',
      'nav_logout': 'लॉग आउट',

      // Dashboard Titles & Stats
      'dash_title': 'मरीज़ डैशबोर्ड',
      'dash_subtitle': 'दैनिक समय सारिणी, दवा अनुपालन और लंबित खुराकों का अवलोकन',
      'stat_active_meds': 'सक्रिय दवाइयां',
      'stat_today_doses': 'आज की निर्धारित खुराक',
      'stat_pending': 'लंबित खुराक',
      'stat_adherence': 'अनुपालन दर',
      'today_schedule_title': 'आज की दवा समय सारिणी',
      'today_schedule_sub': 'सटीक समय दर्ज करने के लिए दवा लेते ही पुष्टि करें',

      // Checkbox Acknowledgement Rule
      'checkbox_label': 'मैंने यह दवाई ले ली है',
      'status_taken': 'ले ली गई',
      'status_pending': 'लंबित',
      'status_missed': 'छूट गई',
      'status_scheduled': 'निर्धारित',
      'ack_confirmed': 'ले ली गई के रूप में पुष्ट',
      'ack_taken_label': 'ले ली गई के रूप में दर्ज',
      'ack_missed_label': 'खुराक छूट गई के रूप में दर्ज',

      // Actions & Buttons
      'btn_snooze': 'स्नूज़ (बाद में याद दिलाएं)',
      'btn_missed': 'छूट गई दर्ज करें',
      'btn_refresh': 'ताज़ा करें',
      'btn_add_medicine': 'नई दवाई जोड़ें',
      'btn_details': 'विवरण',
      'btn_edit': 'संशोधित करें',
      'btn_delete': 'हटाएं',
      'btn_save': 'बदलाव सहेजें',
      'btn_cancel': 'रद्द करें',
      'btn_dismiss': 'अलर्ट बंद करें',
      'btn_export_csv': 'CSV निर्यात करें',
      'btn_save_schedule': 'दवा समय सारिणी सहेजें',
      'btn_enable_alerts': 'अलर्ट चालू करें',
      'btn_alerts_active': 'अलर्ट सक्रिय है',
      'btn_confirm_candidates': 'पुष्टि करें और सभी जोड़ें',
      'btn_get_started': 'शुरू करें',
      'btn_sign_in': 'साइन इन करें',
      'btn_sign_up': 'खाता बनाएं',

      // In-App Reminder Modal
      'modal_due_title': 'दवा लेने का समय हो गया है',
      'modal_due_subtitle': 'कृपया दवा लेने की पुष्टि करें',
      'modal_need_time': 'अधिक समय चाहिए? रिमाइंडर स्नूज़ करें (खुराक लंबित रहेगी):',
      'modal_instruction_label': 'निर्देश:',

      // Add Medicine Form
      'form_med_name': 'दवाई का नाम',
      'form_dosage': 'मात्रा (उदा. 500mg)',
      'form_type': 'प्रकार / स्वरूप',
      'form_frequency': 'समय सारिणी आवृत्ति',
      'form_dose_times': 'निर्धारित खुराक समय',
      'form_start_date': 'आरंभ तिथि',
      'form_end_date': 'समाप्ति तिथि (वैकल्पिक)',
      'form_interval': 'रिमाइंडर अंतराल',
      'form_deadline': 'पुष्टि की अंतिम समय सीमा',
      'form_instructions': 'निर्देश और सावधानियां',

      // History & Reports
      'hist_title': 'दवा इतिहास और रिपोर्ट',
      'hist_adherence_report': 'दवा अनुपालन सारांश',
      'hist_col_name': 'दवाई का नाम',
      'hist_col_dosage': 'मात्रा',
      'hist_col_scheduled': 'निर्धारित समय',
      'hist_col_ack': 'दवा लेने का समय',
      'hist_col_status': 'स्थिति',
      'hist_col_blockchain': 'सत्यापन',
      'filter_all': 'सभी रिकॉर्ड',

      // OCR & Pharmacy
      'ocr_title': 'डॉक्टर की पर्ची स्कैन करें',
      'ocr_subtitle': 'कई दवाइयों का पता लगाकर उन्हें समय सारिणी में जोड़ने के लिए फोटो अपलोड करें',
      'ocr_verify_warning': 'कृपया पुष्टि करने से पहले सभी विवरणों को अपनी मूल पर्ची से जांच लें।',
      'ocr_no_meds_found': 'कोई दवाई स्पष्ट रूप से नहीं मिली। आप विवरण स्वयं दर्ज कर सकते हैं।',
      'ocr_manual_entry': 'स्वयं दर्ज करें',
      'pharmacy_title': 'विश्वसनीय ऑनलाइन फार्मेसी',
      'pharmacy_subtitle': 'अधिकृत और लाइसेंस प्राप्त पार्टनर सेवाओं से सीधे दवाइयां मंगवाएं',
      'pharmacy_disclaimer': 'उनकी आधिकारिक वेबसाइट पर ऑनलाइन ऑर्डर उपलब्ध है। लिंक नए टैब में खुलते हैं।',

      // Landing Page
      'hero_title': 'दवा लेना कभी न भूलें। आत्मविश्वास के साथ अपने स्वास्थ्य का ध्यान रखें।',
      'hero_subtitle': 'स्पष्ट खुराक पुष्टि, पर्ची स्कैनिंग और सुरक्षित स्वास्थ्य रिकॉर्ड के साथ स्मार्ट रिमाइंडर।',
      'feature_reminders_title': 'स्मार्ट रिमाइंडर',
      'feature_reminders_desc': 'सटीकता सुनिश्चित करने के लिए चेकबॉक्स पुष्टि के साथ समय पर अलर्ट।',
      'feature_scanner_title': 'पर्ची स्कैन करें',
      'feature_scanner_desc': 'एक साथ कई दवाइयां जोड़ने के लिए अपनी पर्ची की फोटो खींचें।',
      'feature_lang_title': '3 भाषाएं',
      'feature_lang_desc': 'अंग्रेजी, कन्नड़ और हिंदी में पूर्ण समर्थन।',
      'feature_offline_title': 'ऑफ़लाइन भी काम करता है',
      'feature_offline_desc': 'इंटरनेट न होने पर भी समय सारिणी देखें और दवा लेना दर्ज करें।',
      'feature_security_title': 'सुरक्षित रिकॉर्ड',
      'feature_security_desc': 'क्रिप्टोग्राफिक सुरक्षा के साथ सत्यापित अपरिवर्तनीय रिकॉर्ड।'
    }
  },

  /**
   * Initialize Localization Subsystem
   */
  init() {
    const saved = (typeof StorageHelper !== 'undefined') 
      ? StorageHelper.get('med_app_lang', 'en') 
      : (localStorage.getItem('med_app_lang') || 'en');
    this.setLanguage(saved, false);
    this.initLanguageControls();
  },

  t(key) {
    const langDict = this.translations[this.currentLang] || this.translations.en;
    return langDict[key] || this.translations.en[key] || key;
  },

  /**
   * Set Language and Update DOM Instantly Without Page Reload
   */
  setLanguage(langCode, showFeedback = true) {
    if (!this.translations[langCode]) {
      langCode = 'en';
    }

    this.currentLang = langCode;
    document.documentElement.lang = langCode;

    if (typeof StorageHelper !== 'undefined') {
      StorageHelper.set('med_app_lang', langCode);
    } else {
      localStorage.setItem('med_app_lang', langCode);
    }

    // Apply Kannada / Devanagari specific font styling if needed
    if (langCode === 'kn') {
      document.body.style.fontFamily = "'Noto Sans Kannada', var(--font-family-base)";
    } else if (langCode === 'hi') {
      document.body.style.fontFamily = "'Noto Sans Devanagari', var(--font-family-base)";
    } else {
      document.body.style.fontFamily = "var(--font-family-base)";
    }

    // Update all text nodes with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        el.textContent = translation;
      }
    });

    // Update input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) {
        el.placeholder = translation;
      }
    });

    // Update quick toggle button text in top header or navbar
    const quickBtn = document.getElementById('quick-lang-toggle');
    if (quickBtn) {
      const langNames = { en: 'English', kn: 'ಕನ್ನಡ', hi: 'हिंदी' };
      quickBtn.textContent = langNames[langCode] || 'English';
    }

    // Update select in Language Settings view and navbar selects
    document.querySelectorAll('.app-lang-select, #language-select').forEach(select => {
      select.value = langCode;
    });

    // Highlight active card in Language Settings view
    document.querySelectorAll('.lang-card-option').forEach(card => {
      if (card.getAttribute('data-lang') === langCode) {
        card.classList.add('active-lang');
      } else {
        card.classList.remove('active-lang');
      }
    });

    // Save to Supabase profile if logged in
    const user = (typeof StorageHelper !== 'undefined') ? StorageHelper.get('med_app_user', {}) : null;
    if (user && user.id && typeof SupabaseService !== 'undefined' && SupabaseService.hasActiveConfig()) {
      SupabaseService.updateProfile(user.id, { language_preference: langCode }).catch(() => {});
    }

    if (showFeedback && typeof Toast !== 'undefined') {
      const langDisplay = { en: 'English', kn: 'ಕನ್ನಡ (Kannada)', hi: 'हिंदी (Hindi)' }[langCode];
      Toast.show(`Language switched to ${langDisplay}`, 'success', 'Language Updated');
    }
  },

  /**
   * Bind language switcher controls across the application
   */
  initLanguageControls() {
    document.querySelectorAll('.app-lang-select, #language-select').forEach(select => {
      if (!select.dataset.bound) {
        select.dataset.bound = 'true';
        select.addEventListener('change', (e) => {
          this.setLanguage(e.target.value, true);
        });
      }
    });

    const quickBtn = document.getElementById('quick-lang-toggle');
    if (quickBtn && !quickBtn.dataset.bound) {
      quickBtn.dataset.bound = 'true';
      quickBtn.addEventListener('click', () => {
        const order = ['en', 'kn', 'hi'];
        const nextIdx = (order.indexOf(this.currentLang) + 1) % order.length;
        this.setLanguage(order[nextIdx], true);
      });
    }

    document.querySelectorAll('.lang-card-option').forEach(card => {
      if (!card.dataset.bound) {
        card.dataset.bound = 'true';
        card.addEventListener('click', () => {
          const lang = card.getAttribute('data-lang');
          if (lang) {
            this.setLanguage(lang, true);
          }
        });
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  I18n.init();
});

window.I18n = I18n;
