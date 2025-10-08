-- Create a sequence for student IDs
CREATE SEQUENCE IF NOT EXISTS student_id_seq START WITH 1000;

-- Create a function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
  next_id INTEGER;
  current_year TEXT;
BEGIN
  next_id := nextval('student_id_seq');
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  RETURN 'STU' || current_year || LPAD(next_id::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate student_id
CREATE OR REPLACE FUNCTION set_student_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NULL THEN
    NEW.student_id := generate_student_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles table
DROP TRIGGER IF EXISTS trigger_set_student_id ON public.profiles;
CREATE TRIGGER trigger_set_student_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_student_id();