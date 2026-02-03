-- ========================================
-- FULL-TEXT SEARCH TRIGGERS FOR KEYWORDS
-- ========================================
-- These triggers must be created here (after junction tables exist)

-- Trigger to update collection search_vector when keywords change
CREATE TRIGGER collection_keywords_update_vector
AFTER INSERT OR DELETE ON collection_keywords
FOR EACH ROW
EXECUTE FUNCTION update_collection_search_vector_on_keyword_change();