-- Prevent more than one final attempt for a session question.
CREATE UNIQUE INDEX "attempts_session_question_id_idx"
    ON "attempts"("session_question_id");
