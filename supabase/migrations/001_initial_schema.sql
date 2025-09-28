-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clay_bodies table
CREATE TABLE clay_bodies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  shrinkage DECIMAL(5,2) NOT NULL CHECK (shrinkage >= 0 AND shrinkage <= 100),
  color TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create raw_materials table
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  base_material_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create glaze_recipes table
CREATE TABLE glaze_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  finish TEXT NOT NULL CHECK (finish IN ('glossy', 'matte', 'semi-matte', 'crystalline', 'raku', 'wood-fired', 'soda')),
  composition JSONB NOT NULL,
  date DATE NOT NULL,
  batch_number TEXT NOT NULL,
  photos TEXT[],
  clay_body_id UUID REFERENCES clay_bodies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clay_bodies_user_id ON clay_bodies(user_id);
CREATE INDEX idx_raw_materials_user_id ON raw_materials(user_id);
CREATE INDEX idx_glaze_recipes_user_id ON glaze_recipes(user_id);
CREATE INDEX idx_glaze_recipes_created_at ON glaze_recipes(created_at DESC);
CREATE INDEX idx_glaze_recipes_finish ON glaze_recipes(finish);

-- Enable Row Level Security (RLS)
ALTER TABLE clay_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE glaze_recipes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Clay bodies policies
CREATE POLICY "Users can view their own clay bodies" ON clay_bodies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clay bodies" ON clay_bodies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clay bodies" ON clay_bodies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clay bodies" ON clay_bodies
  FOR DELETE USING (auth.uid() = user_id);

-- Raw materials policies
CREATE POLICY "Users can view their own raw materials" ON raw_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own raw materials" ON raw_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own raw materials" ON raw_materials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own raw materials" ON raw_materials
  FOR DELETE USING (auth.uid() = user_id);

-- Glaze recipes policies
CREATE POLICY "Users can view their own glaze recipes" ON glaze_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own glaze recipes" ON glaze_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own glaze recipes" ON glaze_recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own glaze recipes" ON glaze_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for glaze_recipes
CREATE TRIGGER update_glaze_recipes_updated_at
  BEFORE UPDATE ON glaze_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
