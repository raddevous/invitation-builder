-- Fix Ole Script font name to match Google Fonts

UPDATE predefined_options 
SET name = 'Oleo Script', value = 'Oleo Script' 
WHERE name = 'Ole Script Swash Caps' AND category = 'heading_fonts';
