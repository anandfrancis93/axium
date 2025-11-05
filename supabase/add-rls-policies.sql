-- Add INSERT, UPDATE, DELETE policies for subjects table
-- (Currently only has SELECT policy)

CREATE POLICY "Authenticated users can insert subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update subjects"
  ON subjects FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete subjects"
  ON subjects FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add INSERT, UPDATE, DELETE policies for chapters table
-- (Currently only has SELECT policy)

CREATE POLICY "Authenticated users can insert chapters"
  ON chapters FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update chapters"
  ON chapters FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete chapters"
  ON chapters FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add INSERT, UPDATE, DELETE policies for topics table
-- (Currently only has SELECT policy)

CREATE POLICY "Authenticated users can insert topics"
  ON topics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update topics"
  ON topics FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete topics"
  ON topics FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add INSERT, UPDATE, DELETE policies for questions table
-- (Currently only has SELECT policy)

CREATE POLICY "Authenticated users can insert questions"
  ON questions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update questions"
  ON questions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete questions"
  ON questions FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add INSERT, UPDATE, DELETE policies for knowledge_chunks table
-- (Currently only has SELECT policy)

CREATE POLICY "Authenticated users can insert knowledge_chunks"
  ON knowledge_chunks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update knowledge_chunks"
  ON knowledge_chunks FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete knowledge_chunks"
  ON knowledge_chunks FOR DELETE
  USING (auth.uid() IS NOT NULL);
