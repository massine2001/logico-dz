// supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lflhbjxlsfdhzzspwczx.supabase.co'; // URL Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbGhianhsc2ZkaHp6c3B3Y3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNDMyMDMsImV4cCI6MjA0MjkxOTIwM30.dA5YnMYZwwe2xakVE0nk4fmJ2_FMn998nR5W58ihOqI'; 
export const supabase = createClient(supabaseUrl, supabaseKey);
