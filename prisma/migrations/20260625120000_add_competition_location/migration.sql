ALTER TABLE competitions ADD COLUMN country TEXT;
ALTER TABLE competitions ADD COLUMN continent TEXT;
UPDATE competitions SET country = CHR(78)||CHR(101)||CHR(115)||CHR(112)||CHR(101)||CHR(99)||CHR(105)||CHR(102)||CHR(105)||CHR(99)||CHR(97)||CHR(116) WHERE country IS NULL;
UPDATE competitions SET continent = CHR(78)||CHR(101)||CHR(115)||CHR(112)||CHR(101)||CHR(99)||CHR(105)||CHR(102)||CHR(105)||CHR(99)||CHR(97)||CHR(116) WHERE continent IS NULL;
ALTER TABLE competitions ALTER COLUMN country SET NOT NULL;
ALTER TABLE competitions ALTER COLUMN continent SET NOT NULL;
