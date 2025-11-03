
import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isSameDay,
  parseISO,
  formatRelative,
} from 'date-fns';

// --- TYPES ---
type User = {
  id: string;
  name: string;
  title: string;
  email: string;
  avatar_url: string;
  reward_points: number;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
};

type PostFile = {
  id: string;
  post_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  preview_url?: string;
};

type Post = {
  id: string;
  date: string; // ISO string
  content: string;
  platform: 'Instagram' | 'Twitter' | 'Facebook' | 'LinkedIn';
  client: 'H&S' | 'DECA' | 'DPS';
  user_id: string;
  files: PostFile[];
  created_at: string;
};

type Message = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
};

type ActivityLog = {
    id: string;
    user_id: string;
    action_type: 'post_created' | 'file_uploaded' | 'profile_updated' | 'user_updated' | 'user_added' | 'user_deleted';
    description: string;
    created_at: string;
};

type SpecialDay = {
  date: string; // YYYY-MM-DD
  title: string;
  type: 'holiday' | 'uae' | 'birthday';
  suggestion: string;
};

type Notification = {
    id: string;
    user_id: string;
    type: 'post_created' | 'file_uploaded' | 'profile_updated';
    message: string;
    is_read: boolean;
    created_at: string;
};

type ToastMessage = {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
};

// --- MOCK DATA ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Riaz', title: 'Admin', email: 'riaz@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=riaz@skybridge.com', reward_points: 120, role: 'admin', status: 'active' },
  { id: 'u2', name: 'Basi', title: 'Graphic Designer', email: 'basi@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=basi@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u3', name: 'Misbah', title: 'Videographer', email: 'misbah@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=misbah@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u4', name: 'Hari', title: 'Graphic Designer', email: 'hari@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=hari@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u5', name: 'Ginu', title: 'Graphic Designer', email: 'ginu@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=ginu@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u6', name: 'Sabira', title: 'Social Media Co', email: 'sabira@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=sabira@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u7', name: 'Salman', title: 'Videographer', email: 'salman@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=salman@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u8', name: 'Mustafa', title: 'Videographer', email: 'mustafa@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=mustafa@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u9', name: 'Escano', title: 'Marketing', email: 'escano@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=escano@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u10', name: 'Agha', title: 'Marketing Co', email: 'agha@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=agha@skybridge.com', reward_points: 100, role: 'member', status: 'active' },
  { id: 'u11', name: 'Emad', title: 'CEO', email: 'emad@skybridge.com', avatar_url: 'https://i.pravatar.cc/150?u=emad@skybridge.com', reward_points: 250, role: 'admin', status: 'active' },
];

const MOCK_FILES: PostFile[] = [
    { id: 'f1', post_id: 'p2', file_name: 'launch-banner.jpg', file_type: 'image/jpeg', file_url: 'https://images.unsplash.com/photo-1620712943543-2858200f7456?w=400', file_size: 102400, preview_url: 'https://images.unsplash.com/photo-1620712943543-2858200f7456?w=400' },
];

const MOCK_POSTS: Post[] = [
  { id: 'p1', date: new Date().toISOString(), content: 'Weekly team meeting recap post.', platform: 'LinkedIn', client: 'H&S', user_id: 'u1', files: [], created_at: new Date().toISOString() },
  { id: 'p2', date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), content: 'New product launch announcement!', platform: 'Instagram', client: 'DECA', user_id: 'u2', files: [MOCK_FILES[0]], created_at: new Date().toISOString() },
  { id: 'p3', date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), content: 'Blog post about new design trends.', platform: 'Facebook', client: 'DPS', user_id: 'u2', files: [], created_at: new Date().toISOString() },
  { id: 'p4', date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), content: 'Hiring for a new frontend developer!', platform: 'LinkedIn', client: 'H&S', user_id: 'u1', files: [], created_at: new Date().toISOString() },

];

const MOCK_MESSAGES: Message[] = [
    { id: 'm1', user_id: 'u2', content: 'Hey team, how is the campaign planning going for DECA?', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'm2', user_id: 'u1', content: 'Going well! I just scheduled the launch post.', created_at: new Date().toISOString() },
];

const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
    { id: 'a1', user_id: 'u1', action_type: 'post_created', description: 'created a post for H&S on LinkedIn.', created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString() },
    { id: 'a2', user_id: 'u2', action_type: 'file_uploaded', description: 'uploaded launch-banner.jpg.', created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
];

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', user_id: 'u1', type: 'post_created', message: 'Jane Smith scheduled a new post for DECA.', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
    { id: 'n2', user_id: 'u1', type: 'file_uploaded', message: 'A new file was uploaded for the "New Product Launch" post.', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'n3', user_id: 'u1', type: 'profile_updated', message: 'Sam Wilson is now inactive.', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
];


const CURRENT_YEAR = new Date().getFullYear();
const MOCK_SPECIAL_DAYS: SpecialDay[] = [
    // International
    { date: `${CURRENT_YEAR}-01-01`, title: "New Year's Day", type: 'holiday', suggestion: "Launch a 'New Year, New Goals' campaign." },
    { date: `${CURRENT_YEAR}-02-14`, title: "Valentine's Day", type: 'holiday', suggestion: "Run a contest for the most romantic story." },
    { date: `${CURRENT_YEAR}-03-08`, title: "International Women's Day", type: 'holiday', suggestion: "Highlight influential women in your industry." },
    { date: `${CURRENT_YEAR}-03-20`, title: "International Day of Happiness", type: 'holiday', suggestion: "Share content that brings joy and positivity." },
    { date: `${CURRENT_YEAR}-04-22`, title: "Earth Day", type: 'holiday', suggestion: "Promote your brand's sustainability efforts." },
    { date: `${CURRENT_YEAR}-05-01`, title: "International Workers' Day", type: 'holiday', suggestion: "Thank your team and celebrate their hard work." },
    { date: `${CURRENT_YEAR}-06-21`, title: "International Yoga Day", type: 'holiday', suggestion: "Post about wellness and mental health benefits." },
    { date: `${CURRENT_YEAR}-10-31`, title: 'Halloween', type: 'holiday', suggestion: 'Host a spooky-themed giveaway or photo contest.' },
    { date: `${CURRENT_YEAR}-12-25`, title: "Christmas Day", type: 'holiday', suggestion: "Share festive greetings and holiday-themed content." },
    { date: `${CURRENT_YEAR}-12-31`, title: "New Year's Eve", type: 'holiday', suggestion: "Post a year-in-review and tease upcoming announcements." },
    // UAE
    { date: `${CURRENT_YEAR}-04-10`, title: 'Eid Al Fitr', type: 'uae', suggestion: 'Share warm greetings for Eid and promote special offers.' },
    { date: `${CURRENT_YEAR}-06-15`, title: 'Arafat Day', type: 'uae', suggestion: 'Post content reflecting on peace and spirituality.' },
    { date: `${CURRENT_YEAR}-06-16`, title: 'Eid Al Adha', type: 'uae', suggestion: 'Celebrate the festival of sacrifice with themed content.' },
    { date: `${CURRENT_YEAR}-07-07`, title: 'Islamic New Year', type: 'uae', suggestion: 'Wish followers a happy Hijri New Year and share resolutions.' },
    { date: `${CURRENT_YEAR}-09-15`, title: "Prophet Mohammed's Birthday", type: 'uae', suggestion: 'Share inspiring quotes and stories.' },
    { date: `${CURRENT_YEAR}-11-03`, title: 'UAE Flag Day', type: 'uae', suggestion: 'Share patriotic content and celebrate national pride.' },
    { date: `${CURRENT_YEAR}-12-01`, title: 'Commemoration Day', type: 'uae', suggestion: 'Honor the nation\'s martyrs with respectful and patriotic posts.' },
    { date: `${CURRENT_YEAR}-12-02`, title: 'UAE National Day', type: 'uae', suggestion: 'Celebrate the spirit of the union with special offers.' },
    // Birthdays
    { date: `${CURRENT_YEAR}-02-10`, title: "Mr Saad's Birthday", type: 'birthday', suggestion: "Celebrate Mr Saad's special day!" },
    { date: `${CURRENT_YEAR}-07-15`, title: "Mr Emad's Birthday", type: 'birthday', suggestion: "Celebrate Mr Emad's special day!" },
    { date: `${CURRENT_YEAR}-11-12`, title: "Mr Fahad's Birthday", type: 'birthday', suggestion: "Celebrate Mr Fahad's special day!" },
];


// --- ICONS (SVG Components) ---
const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>;
const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const XIcon = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>;
const MessageSquareIcon = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const FileTextIcon = ({className = "w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const UsersIcon = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const ActivityIcon = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const PaperclipIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>;
const FileUpIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
const StarIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const BellIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const ShieldCheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>;
const UserCogIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><circle cx="19" cy="11" r="2"></circle><path d="M19 8v1"></path><path d="M19 13v1"></path><path d="m21.6 9.5-.87.5"></path><path d="m17.27 12.5-.87.5"></path><path d="m21.6 12.5-.87-.5"></path><path d="m17.27 9.5-.87-.5"></path></svg>;
const SettingsIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0 2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const LogOutIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>;
const SearchIcon = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg>;
const UploadCloudIcon = ({ className = "w-12 h-12" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>;
const CheckCircleIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircleIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" x2="9" y1="9" y2="15"></line><line x1="9" x2="15" y1="9" y2="15"></line></svg>;
const InfoIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="16" y2="12"></line><line x1="12" x2="12.01" y1="8" y2="8"></line></svg>;
const AlertTriangleIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>;
const DownloadIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>;
const UserPlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="17" x2="23" y1="11" y2="11"/></svg>;
const Trash2Icon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>;
const Edit3Icon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;
const ToggleLeftIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="8" cy="12" r="3"></circle></svg>;
const ToggleRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="16" cy="12" r="3"></circle></svg>;

// --- HELPERS ---
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- HOOKS ---
const useConfetti = () => {
    const [isConfettiActive, setConfettiActive] = useState(false);
    const triggerConfetti = () => {
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 3000);
    };
    const ConfettiContainer = () => isConfettiActive ? (
        <div className="fixed inset-0 pointer-events-none z-50">
            {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="confetti" style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    backgroundColor: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'][i % 16]
                }} />
            ))}
        </div>
    ) : null;
    return { triggerConfetti, ConfettiContainer };
};

const ToastContext = createContext<{ addToast: (message: string, type: ToastMessage['type']) => void }>({ addToast: () => {} });

const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }: { children?: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: ToastMessage['type']) => {
        const id = new Date().toISOString() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts }: { toasts: ToastMessage[] }) => (
    <div className="fixed top-5 right-5 z-[100] w-80 space-y-3">
        {toasts.map(toast => <Toast key={toast.id} id={toast.id} message={toast.message} type={toast.type} />)}
    </div>
);

const Toast: React.FC<ToastMessage> = ({ message, type }) => {
    const icons = {
        success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
        error: <XCircleIcon className="w-6 h-6 text-red-500" />,
        info: <InfoIcon className="w-6 h-6 text-blue-500" />,
        warning: <AlertTriangleIcon className="w-6 h-6 text-yellow-500" />,
    };

    return (
        <div className="glass-card silver-gradient-border rounded-lg p-4 flex items-center space-x-3 animate-fade-in-up shadow-lg">
            {icons[type]}
            <p className="text-slate-700 text-sm font-medium">{message}</p>
        </div>
    );
};

// --- APP CONTEXT ---
type AppContextType = {
    users: User[];
    posts: Post[];
    messages: Message[];
    activityLogs: ActivityLog[];
    notifications: Notification[];
    specialDays: SpecialDay[];
    currentUser: User;
    addToast: (message: string, type: ToastMessage['type']) => void;
    addPost: (post: Omit<Post, 'id' | 'created_at' | 'user_id' | 'files'> & { files: File[] }) => void;
    addMessage: (content: string) => void;
    markAllNotificationsRead: () => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    addActivityLog: (action_type: ActivityLog['action_type'], description: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within an AppProvider");
    return context;
};

const AppProvider = ({ children, loggedInUser }: { children?: React.ReactNode, loggedInUser: User }) => {
    const { addToast } = useToast();
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(MOCK_ACTIVITY_LOGS);
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    
    const currentUser = loggedInUser;

    const addActivityLog = useCallback((action_type: ActivityLog['action_type'], description: string) => {
        const newLog: ActivityLog = {
            id: `a${Date.now()}`,
            user_id: currentUser.id,
            action_type,
            description,
            created_at: new Date().toISOString(),
        };
        setActivityLogs(prev => [newLog, ...prev]);
    }, [currentUser.id]);

    const addPost = (post: Omit<Post, 'id' | 'created_at' | 'user_id' | 'files'> & { files: File[] }) => {
        const postId = `p${Date.now()}`;
        const { files, ...restOfPost } = post;

        const newPostFiles: PostFile[] = files.map((file, index) => {
            const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
            return {
                id: `f${postId}-${index}`,
                post_id: postId,
                file_name: file.name,
                file_type: file.type,
                file_url: previewUrl || '', // Using previewUrl as file_url for simulation
                file_size: file.size,
                preview_url: previewUrl,
            };
        });

        const newPost: Post = {
            ...restOfPost,
            id: postId,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            files: newPostFiles,
        };
        setPosts(prev => [...prev, newPost]);
        addActivityLog('post_created', `created a post for ${post.client} on ${post.platform}.`);
        if (newPostFiles.length > 0) {
            addActivityLog('file_uploaded', `uploaded ${newPostFiles.length} file(s) for the new post.`);
        }
        addToast('Post scheduled successfully!', 'success');
    };

    const addMessage = (content: string) => {
        const newMessage: Message = {
            id: `m${Date.now()}`,
            user_id: currentUser.id,
            content,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const markAllNotificationsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        addToast('All notifications marked as read.', 'info');
    };
    
    const addUser = (user: Omit<User, 'id'>) => {
        const newUser: User = { ...user, id: `u${Date.now()}` };
        setUsers(prev => [...prev, newUser]);
        addActivityLog('user_added', `added a new member: ${user.name}.`);
        addToast(`User ${user.name} added.`, 'success');
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        addActivityLog('user_updated', `updated profile for ${updatedUser.name}.`);
        addToast(`User ${updatedUser.name} updated.`, 'success');
    };

    const deleteUser = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            addActivityLog('user_deleted', `deleted user: ${user.name}.`);
            addToast(`User ${user.name} deleted.`, 'warning');
        }
    };

    const value: AppContextType = {
        users,
        posts,
        messages,
        activityLogs,
        notifications,
        specialDays: MOCK_SPECIAL_DAYS,
        currentUser,
        addToast,
        addPost,
        addMessage,
        markAllNotificationsRead,
        addUser,
        updateUser,
        deleteUser,
        addActivityLog,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// --- UI COMPONENTS ---
const Modal = ({ children, onClose, title }: { children?: React.ReactNode, onClose: () => void, title: string }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="glass-card silver-gradient-border rounded-xl w-full max-w-lg m-4 max-h-[90vh] flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/20 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ children, onClose, title, from = 'right' }: { children?: React.ReactNode, onClose: () => void, title: string, from?: 'left' | 'right' }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const fromClasses = from === 'right' ? 'right-0' : 'left-0';

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose}>
            <div className={`fixed top-0 bottom-0 ${fromClasses} glass-card w-full max-w-md flex flex-col animate-fade-in-up`} onClick={e => e.stopPropagation()}>
                 <header className="p-4 border-b border-white/20 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}

const PostCard: React.FC<{post: Post}> = ({ post }) => {
    const platformColors = {
        Instagram: 'bg-pink-100 text-pink-800',
        Twitter: 'bg-sky-100 text-sky-800',
        Facebook: 'bg-blue-100 text-blue-800',
        LinkedIn: 'bg-indigo-100 text-indigo-800',
    };

    const clientColors = {
        'H&S': 'border-l-4 border-red-500',
        'DECA': 'border-l-4 border-blue-500',
        'DPS': 'border-l-4 border-green-500',
    };

    return (
        <div className={`p-2 rounded-lg text-xs cursor-pointer hover:bg-slate-200/50 transition-colors ${clientColors[post.client]}`}>
            <p className="font-bold truncate text-slate-700">{post.content}</p>
            <div className="flex items-center justify-between mt-1">
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${platformColors[post.platform]}`}>
                    {post.platform}
                </span>
                {post.files && post.files.length > 0 && <PaperclipIcon className="w-3 h-3 text-slate-500" />}
            </div>
        </div>
    );
};

const Header = ({ onAdminClick, onNotificationsClick, onProfileClick }: { onAdminClick: () => void, onNotificationsClick: (e: React.MouseEvent) => void, onProfileClick: (e: React.MouseEvent) => void }) => {
    const { currentUser } = useApp();

    return (
        <header className="h-20 flex-shrink-0 bg-white/30 backdrop-blur-md border-b border-white/50 flex items-center justify-between px-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">SKYBRIGE <span className="text-slate-500 font-normal">Content Hub</span></h1>
                <p className="text-sm text-slate-500">Welcome back, {currentUser.name.split(' ')[0]}!</p>
            </div>
            <div className="flex items-center space-x-4">
                {currentUser.role === 'admin' && (
                    <button onClick={onAdminClick} className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl">
                        <ShieldCheckIcon className="w-5 h-5"/>
                        <span>Admin</span>
                    </button>
                )}
                <div className="relative">
                    <button onClick={onNotificationsClick} className="p-2 rounded-full hover:bg-slate-200/50 transition-colors text-slate-600">
                        <BellIcon />
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>
                <button onClick={onProfileClick} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-200/50">
                    <div>
                        <p className="font-semibold text-slate-700 text-right">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 text-right">{currentUser.title}</p>
                    </div>
                </button>
            </div>
        </header>
    );
};

const NotificationsDropdown = ({ onClose }: { onClose: () => void }) => {
    const { notifications, markAllNotificationsRead } = useApp();
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute top-20 right-8 w-80 glass-card silver-gradient-border rounded-lg shadow-xl z-50 animate-fade-in">
            <div className="p-3 border-b border-white/20 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Notifications</h3>
                {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="text-xs text-blue-500 hover:underline">Mark all as read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
                {notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b border-white/20 text-sm ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                        <p className="text-slate-700">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatRelative(parseISO(n.created_at), new Date())}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfileDropdown = ({ onClose, onLogout }: { onClose: () => void, onLogout: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const items = [
        { label: "Edit Profile", icon: <UserCogIcon />, action: () => {} },
        { label: "Settings", icon: <SettingsIcon />, action: () => {} },
        { label: "Logout", icon: <LogOutIcon />, action: onLogout },
    ];

    return (
        <div ref={ref} className="absolute top-20 right-8 w-56 glass-card silver-gradient-border rounded-lg shadow-xl z-50 animate-fade-in p-2">
            {items.map(item => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 hover:bg-slate-200/50 hover:text-slate-800 rounded-md transition-colors text-sm">
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
}

const Calendar = ({ onDateClick, onPostClick }: { onDateClick: (date: Date) => void, onPostClick: (post: Post) => void }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [clientFilter, setClientFilter] = useState<'All' | 'H&S' | 'DECA' | 'DPS'>('All');
    const { posts, specialDays } = useApp();

    const startOfMonthDate = startOfMonth(currentDate);
    const endOfMonthDate = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: startOfWeek(startOfMonthDate), end: endOfWeek(endOfMonthDate) });

    const postsByDate = useMemo(() => {
        const filteredPosts = clientFilter === 'All' ? posts : posts.filter(post => post.client === clientFilter);
        const map = new Map<string, Post[]>();
        filteredPosts.forEach(post => {
            const dateKey = format(parseISO(post.date), 'yyyy-MM-dd');
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(post);
        });
        return map;
    }, [posts, clientFilter]);

    const specialDaysByDate = useMemo(() => {
        const map = new Map<string, SpecialDay>();
        specialDays.forEach(day => {
            map.set(day.date, day);
        });
        return map;
    }, [specialDays]);

    const specialDayColors = {
        holiday: 'bg-red-500',
        uae: 'bg-green-500',
        birthday: 'bg-yellow-500',
    };

    return (
        <div className="flex-grow flex flex-col p-4 bg-white/50 backdrop-blur-sm rounded-t-2xl m-4 mb-0 overflow-hidden">
            <header className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-2xl font-bold text-slate-800">{format(currentDate, 'MMMM yyyy')}</h2>
                <div className="flex items-center space-x-2">
                    {(['All', 'H&S', 'DECA', 'DPS'] as const).map(client => (
                        <button
                            key={client}
                            onClick={() => setClientFilter(client)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md ${
                                clientFilter === client 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white/60 text-slate-600 hover:bg-white/90'
                            }`}
                        >
                            {client}
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-slate-200/50 transition-colors text-slate-500"><ChevronLeftIcon /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="text-sm font-semibold text-slate-600 px-4 py-1.5 rounded-lg hover:bg-slate-200/50 transition-all shadow-sm hover:shadow-md">Today</button>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-slate-200/50 transition-colors text-slate-500"><ChevronRightIcon /></button>
                </div>
            </header>
            <div className="flex-grow grid grid-cols-7 grid-rows-6 gap-2 overflow-y-auto">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-sm text-slate-500">{day}</div>
                ))}
                {daysInMonth.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayPosts = postsByDate.get(dateKey) || [];
                    const specialDay = specialDaysByDate.get(dateKey);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateClick(day)}
                            className={`rounded-lg p-2 flex flex-col bg-white/40 border border-white/60 cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 ${isSameMonth(day, currentDate) ? 'opacity-100' : 'opacity-40'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-semibold ${isToday(day) ? 'bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center today-glow' : 'text-slate-600'}`}>
                                    {format(day, 'd')}
                                </span>
                                {specialDay && <span title={specialDay.title} className={`w-2 h-2 rounded-full ${specialDayColors[specialDay.type]}`}></span>}
                            </div>
                            <div className="mt-2 space-y-1 overflow-y-auto h-full">
                                {dayPosts.map(post => <PostCard key={post.id} post={post} />)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RightSidebar = () => {
    const { specialDays, activityLogs, users } = useApp();
    const today = new Date();
    
    const upcomingSpecialDays = useMemo(() => {
        return specialDays
            .filter(day => parseISO(`${day.date}T00:00:00`) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    }, [specialDays]);

    const getUser = (id: string) => users.find(u => u.id === id);

    return (
        <aside className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto">
            <div className="glass-card silver-gradient-border rounded-xl p-4">
                <h3 className="font-semibold text-slate-700 mb-2">Upcoming Special Days</h3>
                <div className="space-y-2">
                    {upcomingSpecialDays.map(day => (
                        <div key={day.date} className="text-sm">
                            <p className="font-bold text-slate-600">{day.title}</p>
                            <p className="text-xs text-slate-500">{format(parseISO(day.date), 'MMMM d')}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="glass-card silver-gradient-border rounded-xl p-4">
                <h3 className="font-semibold text-slate-700 mb-2">Team Activity</h3>
                <div className="space-y-3">
                    {activityLogs.slice(0, 5).map(log => {
                        const user = getUser(log.user_id);
                        return (
                            <div key={log.id} className="flex items-start space-x-3 text-sm">
                                <div>
                                    <p className="text-slate-600">
                                        <span className="font-bold text-slate-700">{user?.name || 'A user'}</span> {log.description}
                                    </p>
                                    <p className="text-xs text-slate-400">{formatRelative(parseISO(log.created_at), new Date())}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </aside>
    );
};

const BottomNav = ({ onNavClick }: { onNavClick: (item: string) => void }) => {
    const navItems = [
        { name: 'Chat', icon: <MessageSquareIcon className="w-5 h-5" /> },
        { name: 'Activity', icon: <ActivityIcon className="w-5 h-5" /> },
        { name: 'Files', icon: <FileTextIcon className="w-5 h-5" /> },
        { name: 'Team', icon: <UsersIcon className="w-5 h-5" /> },
        { name: 'Search', icon: <SearchIcon className="w-5 h-5" /> },
    ];
    return (
        <footer className="h-20 flex-shrink-0 flex items-center justify-center">
            <div className="glass-card silver-gradient-border rounded-full px-6 py-3 flex items-center space-x-8">
                {navItems.map((item) => (
                    <button key={item.name} onClick={() => onNavClick(item.name)} className="flex flex-col items-center justify-center transition-all duration-300 text-slate-500 hover:text-blue-500">
                        {item.icon}
                        <span className="text-xs mt-1">{item.name}</span>
                    </button>
                ))}
            </div>
        </footer>
    );
};

// --- MODALS & SIDEBARS ---
const UploadModal = ({ onClose, preselectedDate }: { onClose: () => void, preselectedDate?: Date }) => {
    const { addPost } = useApp();
    const [content, setContent] = useState('');
    const [platform, setPlatform] = useState<'Instagram' | 'Twitter' | 'Facebook' | 'LinkedIn'>('Instagram');
    const [client, setClient] = useState<'H&S' | 'DECA' | 'DPS'>('H&S');
    const [date, setDate] = useState(preselectedDate ? format(preselectedDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
            setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
        }
    };
    
    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addPost({ date: new Date(date).toISOString(), content, platform, client, files });
        onClose();
    };
    
    return (
        <Modal title="Schedule a New Post" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Content</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full glass-input rounded-md" placeholder="What's on your mind?"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Platform</label>
                        <select value={platform} onChange={e => setPlatform(e.target.value as any)} className="w-full glass-input rounded-md">
                            <option>Instagram</option>
                            <option>Twitter</option>
                            <option>Facebook</option>
                            <option>LinkedIn</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Client</label>
                        <select value={client} onChange={e => setClient(e.target.value as any)} className="w-full glass-input rounded-md">
                            <option>H&S</option>
                            <option>DECA</option>
                            <option>DPS</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Date & Time</label>
                    <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full glass-input rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Attachments (Optional)</label>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                            multiple
                        />
                        <UploadCloudIcon className="w-10 h-10 mx-auto text-slate-400" />
                        <p className="mt-2 text-sm text-slate-500">
                            <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400">Images, Videos, or Documents</p>
                    </div>
                    {files.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md text-sm">
                                    <div className="flex items-center gap-3">
                                        {file.type.startsWith('image/') ? <ImageIcon /> : <FileTextIcon />}
                                        <span className="font-medium text-slate-700 truncate max-w-xs">{file.name}</span>
                                        <span className="text-slate-500">{formatBytes(file.size)}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveFile(index)} className="p-1 rounded-full hover:bg-red-100 text-red-500">
                                        <Trash2Icon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 shadow-lg hover:shadow-xl transition-all">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all">Schedule Post</button>
                </div>
            </form>
        </Modal>
    );
};

const ChatModal = ({ onClose }: { onClose: () => void }) => {
    const { messages, users, currentUser, addMessage } = useApp();
    const [newMessage, setNewMessage] = useState('');
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const getUser = (id: string) => users.find(u => u.id === id);

    const handleSend = () => {
        if (newMessage.trim()) {
            addMessage(newMessage.trim());
            setNewMessage('');
        }
    };
    
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Modal title="Team Chat" onClose={onClose}>
            <div className="h-[60vh] flex flex-col">
                <div className="flex-grow overflow-y-auto space-y-4 pr-4">
                    {messages.map(msg => {
                        const user = getUser(msg.user_id);
                        const isCurrentUser = msg.user_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex items-end gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                <div className={`p-3 rounded-lg max-w-xs ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {!isCurrentUser && <p className="text-xs font-bold mb-1 text-slate-500">{user?.name}</p>}
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-xs mt-1 opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>{formatRelative(parseISO(msg.created_at), new Date())}</p>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={endOfMessagesRef} />
                </div>
                <div className="mt-4 flex-shrink-0 flex items-center gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..." 
                        className="w-full glass-input rounded-full" 
                    />
                    <button onClick={handleSend} className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600">
                        <SendIcon />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const ActivitySidebar = ({ onClose }: { onClose: () => void }) => {
    const { activityLogs, users } = useApp();
    const getUser = (id: string) => users.find(u => u.id === id);
    return (
        <Sidebar title="All Team Activity" onClose={onClose}>
            <div className="space-y-4">
                {activityLogs.map(log => {
                    const user = getUser(log.user_id);
                    return (
                        <div key={log.id} className="flex items-start space-x-3 text-sm">
                            <div className="w-9 h-9 flex-shrink-0 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                               {user?.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-slate-600">
                                    <span className="font-bold text-slate-700">{user?.name || 'A user'}</span> {log.description}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(log.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Sidebar>
    );
};

const TeamSidebar = ({ onClose }: { onClose: () => void }) => {
    const { users } = useApp();
    return (
        <Sidebar title="Team Members" onClose={onClose}>
            <div className="space-y-4">
                {users.map(user => (
                    <div key={user.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-slate-200/40">
                        <div>
                            <p className="font-bold text-slate-700">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>{user.status}</span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">{user.role}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Sidebar>
    );
};

const SearchModal = ({ onClose }: { onClose: () => void }) => (
    <Modal title="Search" onClose={onClose}>
        <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="search" placeholder="Search posts, files, users..." className="w-full glass-input rounded-full pl-10" autoFocus/>
        </div>
        <div className="mt-6 text-center text-slate-500">
            <p>Search results will appear here.</p>
        </div>
    </Modal>
);

const FileManagerSidebar = ({ onClose }: { onClose: () => void }) => {
    const { posts } = useApp();
    
    const allFilesWithDate = useMemo(() => {
        return posts.flatMap(post => 
            post.files.map(file => ({
                ...file,
                postDate: post.date,
            }))
        );
    }, [posts]);

    const filesGroupedByDate = useMemo(() => {
        const groups: { [key: string]: typeof allFilesWithDate } = {};
        allFilesWithDate.forEach(file => {
            const dateKey = format(parseISO(file.postDate), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(file);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])); // Sort by date descending
    }, [allFilesWithDate]);

    return (
        <Sidebar title="File Manager" onClose={onClose}>
            {filesGroupedByDate.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                    <FileTextIcon className="mx-auto w-12 h-12 text-slate-400"/>
                    <h3 className="mt-2 text-lg font-semibold">No Files Uploaded</h3>
                    <p className="text-sm">Files from scheduled posts will appear here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filesGroupedByDate.map(([date, files]) => (
                        <div key={date}>
                            <h3 className="font-semibold text-slate-700 mb-2">{format(parseISO(date), "MMMM d, yyyy")}</h3>
                            <div className="space-y-2">
                                {files.map(file => (
                                    <div key={file.id} className="flex items-center justify-between bg-slate-100/80 p-2 rounded-md">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex-shrink-0">
                                                {file.file_type.startsWith('image/') ? <ImageIcon /> : <FileTextIcon />}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-slate-800 truncate" title={file.file_name}>{file.file_name}</p>
                                                <p className="text-xs text-slate-500">{formatBytes(file.file_size)}</p>
                                            </div>
                                        </div>
                                        <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-blue-100 text-blue-500 flex-shrink-0 ml-2" title="Download">
                                            <DownloadIcon className="w-5 h-5"/>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Sidebar>
    );
};


const UserRow = React.forwardRef<HTMLTableRowElement, { user: User, onEdit: (user: User) => void, onDelete: (user: User) => void, onToggleStatus: (user: User) => void }>(({ user, onEdit, onDelete, onToggleStatus }, ref) => (
  <tr ref={ref} className="border-b border-white/20 hover:bg-slate-200/20">
    <td className="p-3">
      <div>
        <p className="font-bold text-slate-700">{user.name}</p>
        <p className="text-sm text-slate-500">{user.title}</p>
      </div>
    </td>
    <td className="p-3 text-slate-600 capitalize">{user.role}</td>
    <td className="p-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
            {user.status}
        </span>
    </td>
    <td className="p-3 text-slate-600">{user.reward_points}</td>
    <td className="p-3">
        <div className="flex items-center space-x-2">
            <button onClick={() => onToggleStatus(user)} className="p-1.5 rounded-md hover:bg-slate-300/50 transition-colors" title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                {user.status === 'active' ? <ToggleRightIcon className="w-5 h-5 text-green-500"/> : <ToggleLeftIcon className="w-5 h-5 text-slate-500" />}
            </button>
            <button onClick={() => onEdit(user)} className="p-1.5 rounded-md hover:bg-slate-300/50 transition-colors" title="Edit User">
                <Edit3Icon className="w-4 h-4 text-blue-600" />
            </button>
            <button onClick={() => onDelete(user)} className="p-1.5 rounded-md hover:bg-slate-300/50 transition-colors" title="Delete User">
                <Trash2Icon className="w-4 h-4 text-red-600" />
            </button>
        </div>
    </td>
  </tr>
));

const AddUserModal = ({ onClose, onSave }: { onClose: () => void, onSave: (user: Omit<User, 'id'>) => void }) => {
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        email: '',
        role: 'member' as 'admin' | 'member',
        status: 'active' as 'active' | 'inactive',
        reward_points: 0,
        avatar_url: `https://i.pravatar.cc/150?u=${Date.now()}`
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal title="Add New Member" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full glass-input rounded-md" required />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">Title</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full glass-input rounded-md" placeholder="e.g. Graphic Designer" required />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full glass-input rounded-md" required />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full glass-input rounded-md">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 shadow-lg hover:shadow-xl transition-all">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all">Add Member</button>
                </div>
            </form>
        </Modal>
    );
};

const EditUserModal = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: (user: User) => void }) => {
    const [formData, setFormData] = useState(user);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal title="Edit Member" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full glass-input rounded-md" required />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">Title</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full glass-input rounded-md" required />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full glass-input rounded-md" required />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full glass-input rounded-md">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 shadow-lg hover:shadow-xl transition-all">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};


const AdminPanel = ({ onClose }: { onClose: () => void }) => {
    const { users, addUser, updateUser, deleteUser, addActivityLog } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleToggleStatus = (userToToggle: User) => {
        const newStatus = userToToggle.status === 'active' ? 'inactive' : 'active';
        updateUser({ ...userToToggle, status: newStatus });
        addActivityLog('user_updated', `set status for ${userToToggle.name} to ${newStatus}.`);
    };
    
    const handleDeleteUser = (userToDelete: User) => {
        if(window.confirm(`Are you sure you want to delete ${userToDelete.name}?`)) {
            deleteUser(userToDelete.id);
        }
    }

    return (
        <Sidebar title="Admin Panel" onClose={onClose} from="left">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Manage Users</h3>
                <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg">
                    <UserPlusIcon className="w-4 h-4"/>
                    <span>Add Member</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase border-b border-white/20">
                        <tr>
                            <th scope="col" className="p-3">User</th>
                            <th scope="col" className="p-3">Role</th>
                            <th scope="col" className="p-3">Status</th>
                            <th scope="col" className="p-3">Points</th>
                            <th scope="col" className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <UserRow 
                                key={user.id} 
                                user={user} 
                                onEdit={setEditingUser}
                                onDelete={handleDeleteUser}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSave={addUser} />}
            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={updateUser} />}

        </Sidebar>
    );
};

const LoginScreen = ({ onLogin, users }: { onLogin: (user: User) => void, users: User[] }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            onLogin(user);
        } else {
            setError('Invalid email or password.');
        }
    };
    
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-100/50">
            <div className="w-full max-w-sm">
                <form onSubmit={handleLogin} className="glass-card silver-gradient-border rounded-xl p-8 space-y-6">
                     <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-800">SKYBRIGE <span className="text-slate-500 font-normal">Content Hub</span></h1>
                        <p className="text-sm text-slate-500 mt-1">Please sign in to continue</p>
                    </div>
                    {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input rounded-md" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full glass-input rounded-md" required />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all">Log In</button>
                </form>
            </div>
        </div>
    );
};

const MainDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const { triggerConfetti, ConfettiContainer } = useConfetti();

    useEffect(() => {
        const hasWon = Math.random() < 0.1; // 10% chance to "win" on load
        if (hasWon) {
            triggerConfetti();
        }
    }, []);

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setActiveModal('upload');
    };
    
    const handleNavClick = (item: string) => {
        setSelectedDate(undefined); // Reset date when using bottom nav
        setActiveModal(item.toLowerCase());
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowProfile(p => !p);
        setShowNotifications(false);
    }
    
    const handleNotificationsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowNotifications(p => !p);
        setShowProfile(false);
    }
    
    const closeModal = () => {
        setActiveModal(null);
        setSelectedDate(undefined);
    }

    const renderModal = () => {
        switch (activeModal) {
            case 'upload': return <UploadModal onClose={closeModal} preselectedDate={selectedDate} />;
            case 'chat': return <ChatModal onClose={closeModal} />;
            case 'activity': return <ActivitySidebar onClose={closeModal} />;
            case 'team': return <TeamSidebar onClose={closeModal} />;
            case 'search': return <SearchModal onClose={closeModal} />;
            case 'admin': return <AdminPanel onClose={closeModal} />;
            case 'files': return <FileManagerSidebar onClose={closeModal} />;
            default: return null;
        }
    };
    
    return (
        <div className="h-screen w-screen flex flex-col bg-slate-100/50" onClick={() => { setShowNotifications(false); setShowProfile(false); }}>
            <ConfettiContainer />
            <Header 
                onAdminClick={() => setActiveModal('admin')} 
                onNotificationsClick={handleNotificationsClick}
                onProfileClick={handleProfileClick}
            />

            {showNotifications && <NotificationsDropdown onClose={() => setShowNotifications(false)}/>}
            {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} onLogout={onLogout} />}
            
            <main className="flex-grow flex overflow-hidden">
                <div className="flex-grow flex flex-col">
                    <Calendar onDateClick={handleDateClick} onPostClick={() => {}} />
                </div>
                <RightSidebar />
            </main>
            <BottomNav onNavClick={handleNavClick} />
            {renderModal()}
        </div>
    );
};


// --- MAIN APP CONTAINER ---
const App = () => {
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const { addToast } = useToast();

    const handleLogin = (user: User) => {
        setLoggedInUser(user);
        addToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
    };

    const handleLogout = () => {
        setLoggedInUser(null);
        addToast('You have been logged out.', 'info');
    };

    if (!loggedInUser) {
        return <LoginScreen onLogin={handleLogin} users={MOCK_USERS} />;
    }

    return (
        <AppProvider loggedInUser={loggedInUser}>
            <MainDashboard onLogout={handleLogout} />
        </AppProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <ToastProvider>
            <App />
        </ToastProvider>
    </React.StrictMode>
);