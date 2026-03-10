-- Add RLS policies for User and Workspace tables
-- These policies allow authenticated users to access their own data
-- Applied: Tue Mar 10 19:02:59 HSP 2026

-- User table policies
CREATE POLICY "Users can read their own data" 
ON "public"."User" 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own data" 
ON "public"."User" 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Users can insert their own data" 
ON "public"."User" 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Workspace table policies
CREATE POLICY "Users can read their own workspaces" 
ON "public"."Workspace" 
FOR SELECT 
USING ("userId" = auth.uid());

CREATE POLICY "Users can update their own workspaces" 
ON "public"."Workspace" 
FOR UPDATE 
USING ("userId" = auth.uid());

CREATE POLICY "Users can insert their own workspaces" 
ON "public"."Workspace" 
FOR INSERT 
WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can delete their own workspaces" 
ON "public"."Workspace" 
FOR DELETE 
USING ("userId" = auth.uid());
