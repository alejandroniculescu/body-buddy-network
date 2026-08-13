REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.runs_group(uuid, uuid) FROM authenticated, anon;