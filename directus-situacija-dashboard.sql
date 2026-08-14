BEGIN;

INSERT INTO directus_dashboards (
  id, name, icon, note, user_created, color
) VALUES (
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Situacija.eu suvestinė',
  'space_dashboard',
  'Gyva klientų užklausų ir darbų galerijos suvestinė.',
  '5a330eb4-b929-4e55-be22-1413a13fc2d4',
  '#2ECDA7'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  note = EXCLUDED.note,
  color = EXCLUDED.color;

INSERT INTO directus_panels (
  id, dashboard, name, icon, color, show_header, note, type,
  position_x, position_y, width, height, options, user_created
) VALUES
(
  '7d7717aa-62df-4ea9-b104-91253b294101',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Naujos užklausos', 'mark_email_unread', '#E35169', true,
  'Užklausos, su kuriomis dar nepradėta dirbti.', 'metric',
  1, 1, 6, 4,
  '{"collection":"requests","field":"id","function":"count","filter":{"status":{"_eq":"new"}},"numberStyle":"decimal","notation":"standard","minimumFractionDigits":0,"maximumFractionDigits":0,"textAlign":"center","fontSize":"auto","font":"sans-serif","fontWeight":800,"fontStyle":"normal"}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
),
(
  '7d7717aa-62df-4ea9-b104-91253b294102',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Vykdomos užklausos', 'pending_actions', '#FFA439', true,
  'Užklausos, dėl kurių jau bendraujama arba derinami darbai.', 'metric',
  7, 1, 6, 4,
  '{"collection":"requests","field":"id","function":"count","filter":{"status":{"_eq":"in_progress"}},"numberStyle":"decimal","notation":"standard","minimumFractionDigits":0,"maximumFractionDigits":0,"textAlign":"center","fontSize":"auto","font":"sans-serif","fontWeight":800,"fontStyle":"normal"}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
),
(
  '7d7717aa-62df-4ea9-b104-91253b294103',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Atliktos užklausos', 'task_alt', '#2ECDA7', true,
  'Sėkmingai užbaigtos klientų užklausos.', 'metric',
  13, 1, 6, 4,
  '{"collection":"requests","field":"id","function":"count","filter":{"status":{"_eq":"done"}},"numberStyle":"decimal","notation":"standard","minimumFractionDigits":0,"maximumFractionDigits":0,"textAlign":"center","fontSize":"auto","font":"sans-serif","fontWeight":800,"fontStyle":"normal"}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
),
(
  '7d7717aa-62df-4ea9-b104-91253b294104',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Galerijos nuotraukos', 'photo_library', '#6644FF', true,
  'Šiuo metu svetainėje paskelbtos darbų nuotraukos.', 'metric',
  19, 1, 6, 4,
  '{"collection":"gallery","field":"id","function":"count","filter":{"status":{"_eq":"published"}},"numberStyle":"decimal","notation":"standard","minimumFractionDigits":0,"maximumFractionDigits":0,"textAlign":"center","fontSize":"auto","font":"sans-serif","fontWeight":800,"fontStyle":"normal"}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
),
(
  '7d7717aa-62df-4ea9-b104-91253b294105',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Užklausos pagal būseną', 'donut_large', '#6644FF', true,
  'Parodo, kiek užklausų yra naujų, vykdomų, atliktų arba archyvuotų.', 'pie-chart',
  1, 5, 12, 10,
  '{"collection":"requests","column":"status","function":"count","donut":true,"showLabels":true,"legend":"right","decimals":0,"color":"#6644FF","filter":{}}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
),
(
  '7d7717aa-62df-4ea9-b104-91253b294106',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Užklausos per paskutinius 3 mėnesius', 'show_chart', '#2ECDA7', true,
  'Naujų klientų užklausų skaičiaus kitimas savaitėmis.', 'time-series',
  13, 5, 12, 10,
  '{"collection":"requests","function":"count","precision":"week","dateField":"date_created","range":"3 months","valueField":"id","decimals":0,"color":"#2ECDA7","curveType":"smooth","fillType":"gradient","missingData":"0","showXAxis":true,"showYAxis":true,"filter":{}}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
),
(
  '7d7717aa-62df-4ea9-b104-91253b294107',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Naujausios klientų užklausos', 'list_alt', '#E35169', true,
  'Paspauskite eilutę, kad iškart atidarytumėte užklausą.', 'list',
  1, 15, 12, 8,
  '{"collection":"requests","limit":8,"sortField":"date_created","sortDirection":"desc","displayTemplate":"{{name}} — {{phone}} · {{status}}","linkToItem":true,"filter":{}}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
),
(
  '7d7717aa-62df-4ea9-b104-91253b294108',
  '6c4d5b37-2d3a-4b9e-a5ce-5af7cd41e101',
  'Naujausi galerijos darbai', 'collections', '#6644FF', true,
  'Naujausios svetainėje paskelbtos darbų nuotraukos.', 'list',
  13, 15, 12, 8,
  '{"collection":"gallery","limit":8,"sortField":"date_created","sortDirection":"desc","displayTemplate":"{{title}} · {{category}}","linkToItem":true,"filter":{"status":{"_eq":"published"}}}'::json,
  '5a330eb4-b929-4e55-be22-1413a13fc2d4'
)
ON CONFLICT (id) DO UPDATE SET
  dashboard = EXCLUDED.dashboard,
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  show_header = EXCLUDED.show_header,
  note = EXCLUDED.note,
  type = EXCLUDED.type,
  position_x = EXCLUDED.position_x,
  position_y = EXCLUDED.position_y,
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  options = EXCLUDED.options;

COMMIT;
