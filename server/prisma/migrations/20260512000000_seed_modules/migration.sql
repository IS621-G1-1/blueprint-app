-- Seed initial module catalogue (idempotent — ON CONFLICT DO NOTHING)
INSERT INTO "modules" ("id", "code", "name", "credits", "school", "description", "createdAt")
VALUES
  (gen_random_uuid()::text, 'IS621', 'Agile and DevSecOps', 1, 'School of Computing and Information Systems', 'Practices for iterative delivery, secure software operations, and modern development workflows.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IS620', 'Digital Transformation', 1, 'School of Computing and Information Systems', 'Core concepts and implementation approaches for technology-led business transformation.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IS615', 'Digital Transformation Strategy', 1, 'School of Computing and Information Systems', 'Strategic planning methods for evaluating, shaping, and leading digital change.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IS619', 'Business Application of Digital Technology', 1, 'School of Computing and Information Systems', 'Applied digital technology use cases across business functions and operating models.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CS101', 'Programming Fundamentals', 1, 'School of Computing and Information Systems', 'Foundational programming constructs, problem solving, and software development basics.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IS212', 'Software Project Management', 1, 'School of Computing and Information Systems', 'Project planning, estimation, risk management, and delivery practices for software teams.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IS213', 'Enterprise Solution Development', 1, 'School of Computing and Information Systems', 'Design and development of enterprise applications using layered architectures.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IS214', 'Software Engineering', 1, 'School of Computing and Information Systems', 'Requirements, design, testing, and maintenance practices for reliable software systems.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'LAW101', 'Business Law', 1, 'Yong Pung How School of Law', 'Introduces legal principles that shape contracts, business obligations, and commercial decision-making.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ACCT101', 'Financial Accounting', 1, 'School of Accountancy', 'Covers core accounting concepts, financial statement preparation, and interpretation for business decisions.', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ECON101', 'Introductory Economics', 1, 'School of Economics', 'Explores microeconomic and macroeconomic foundations for markets, policy, and organisational strategy.', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
