-- 005: Rename sales dimension names in existing assessment scores
-- Maps old dimension names (v1.3.0) to new names (v1.4.0 job-templates)
-- Scores are stored as JSON in the `scores` TEXT column: [{"name":"...","weight":N,"score":N}]

-- Sales-specific dimensions (no conflict with other categories) — safe to update globally
UPDATE assessments SET scores = REPLACE(scores, '"name":"客户开发"', '"name":"销售能力（业务、英语水平）"') WHERE scores LIKE '%"name":"客户开发"%';
UPDATE assessments SET scores = REPLACE(scores, '"name":"执行纪律"', '"name":"勤奋度"') WHERE scores LIKE '%"name":"执行纪律"%';
UPDATE assessments SET scores = REPLACE(scores, '"name":"目标导向"', '"name":"目标感"') WHERE scores LIKE '%"name":"目标导向"%';
UPDATE assessments SET scores = REPLACE(scores, '"name":"沟通谈判"', '"name":"沟通能力"') WHERE scores LIKE '%"name":"沟通谈判"%';
UPDATE assessments SET scores = REPLACE(scores, '"name":"抗压韧性"', '"name":"抗压能力"') WHERE scores LIKE '%"name":"抗压韧性"%';

-- "责任心" exists in management/expert/support templates — only rename for sales category
UPDATE assessments SET scores = REPLACE(scores, '"name":"责任心"', '"name":"管理潜力"')
WHERE scores LIKE '%"name":"责任心"%'
  AND candidate_id IN (
    SELECT c.id FROM candidates c
    JOIN jobs j ON c.job_id = j.id
    WHERE j.category = 'sales'
  );
