-- Hospital-provided services (linked to a hospital, filterable by name/category)
CREATE TABLE IF NOT EXISTS hospital_services (
  id SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS hospital_services_hospital_id_idx ON hospital_services (hospital_id);
CREATE INDEX IF NOT EXISTS hospital_services_name_idx ON hospital_services (name);
