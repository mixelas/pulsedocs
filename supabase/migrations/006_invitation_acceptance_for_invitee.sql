-- Allow invited users to view and accept invitations addressed to their email.

DROP POLICY IF EXISTS "invites_select_invitee" ON public.workspace_invitations;
CREATE POLICY "invites_select_invitee"
ON public.workspace_invitations FOR SELECT
TO authenticated
USING (
  accepted_at IS NULL
  AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "invites_update_invitee_accept" ON public.workspace_invitations;
CREATE POLICY "invites_update_invitee_accept"
ON public.workspace_invitations FOR UPDATE
TO authenticated
USING (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND accepted_at IS NOT NULL
);
