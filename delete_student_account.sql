-- =============================================================================
-- Migration: delete_student_account.sql
-- Function to permanently and transactionally delete a student account
-- and all associated student-owned data in strict reverse-dependency order.
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_student_account(target_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user RECORD;
    resume_ids UUID[];
    attempt_ids UUID[];
BEGIN
    -- 1. Verify target user exists
    SELECT id, email, role INTO target_user FROM public.users WHERE id = target_student_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student account not found.');
    END IF;

    -- 2. Verify target is a student (never delete admin accounts)
    IF target_user.role <> 'student' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Target account is not a student.');
    END IF;

    -- 3. Gather student_resumes IDs for this student
    SELECT array_agg(id) INTO resume_ids
    FROM public.student_resumes
    WHERE student_id = target_student_id;

    -- 4. Delete AI resume reviews FIRST (child of student_resumes and users)
    DELETE FROM public.resume_reviews
    WHERE student_id = target_student_id
       OR (resume_ids IS NOT NULL AND resume_id = ANY(resume_ids));

    -- 5. Delete resume section sub-tables (children of student_resumes)
    IF resume_ids IS NOT NULL AND array_length(resume_ids, 1) > 0 THEN
        DELETE FROM public.resume_skills WHERE resume_id = ANY(resume_ids);
        DELETE FROM public.resume_projects WHERE resume_id = ANY(resume_ids);
        DELETE FROM public.resume_experience WHERE resume_id = ANY(resume_ids);
        DELETE FROM public.resume_education WHERE resume_id = ANY(resume_ids);
        DELETE FROM public.resume_certifications WHERE resume_id = ANY(resume_ids);
        DELETE FROM public.resume_achievements WHERE resume_id = ANY(resume_ids);
    END IF;

    -- 6. Delete student_resumes NOW that all child records are removed
    DELETE FROM public.student_resumes
    WHERE student_id = target_student_id;

    -- 7. Gather mock_test_attempts for this student
    SELECT array_agg(id) INTO attempt_ids
    FROM public.mock_test_attempts
    WHERE student_id = target_student_id;

    -- 8. Delete mock_test_attempt_answers FIRST (child of mock_test_attempts)
    IF attempt_ids IS NOT NULL AND array_length(attempt_ids, 1) > 0 THEN
        DELETE FROM public.mock_test_attempt_answers
        WHERE attempt_id = ANY(attempt_ids);
    END IF;

    -- 9. Delete mock_test_attempts NOW that answers are removed
    DELETE FROM public.mock_test_attempts
    WHERE student_id = target_student_id;

    -- 10. Delete HR interview attempts
    DELETE FROM public.hr_interview_attempts
    WHERE student_id = target_student_id;

    -- 11. Delete student roadmap progress
    DELETE FROM public.student_roadmap_progress
    WHERE student_id = target_student_id;

    -- 12. Delete password reset requests (safely if table exists)
    BEGIN
        DELETE FROM public.password_reset_requests
        WHERE student_id = target_student_id;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- 13. Delete student profile
    DELETE FROM public.student_profiles
    WHERE user_id = target_student_id;

    -- 14. Delete user account
    DELETE FROM public.users
    WHERE id = target_student_id;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_student_id', target_student_id,
        'email', target_user.email
    );
EXCEPTION WHEN OTHERS THEN
    -- In PostgreSQL, any unhandled exception in plpgsql automatically rolls back the entire transaction.
    RAISE EXCEPTION 'Failed to delete student account: %', SQLERRM;
END;
$$;
