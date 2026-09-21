SELECT 'appointments_patient' as tbl, count(*) FROM appointments WHERE patient_id = 21
UNION ALL SELECT 'doctor_appointments_patient', count(*) FROM doctor_appointments WHERE patient_id = 21
UNION ALL SELECT 'equipment_bookings_patient', count(*) FROM equipment_bookings WHERE patient_id = 21
UNION ALL SELECT 'wallets', count(*) FROM wallets WHERE user_id = 21
UNION ALL SELECT 'payment_methods', count(*) FROM payment_methods WHERE doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = 21)
UNION ALL SELECT 'doctor_profiles', count(*) FROM doctor_profiles WHERE user_id = 21;
