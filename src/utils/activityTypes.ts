import { ActivityTypeInfo, SubTask } from '../types';
import { 
  FileText, 
  Globe, 
  Layout, 
  MessageSquare, 
  Mail, 
  Send, 
  Facebook, 
  Search, 
  Linkedin,
  PenTool
} from 'lucide-react';

// Default subtasks for blog articles
const blogSubtasks: SubTask[] = [
  { id: 'research', title: 'Research topic', description: 'Research the topic and gather key information', status: 'todo' },
  { id: 'outline', title: 'Create outline', description: 'Create a detailed outline of the blog post', status: 'todo', dependencies: ['research'] },
  { id: 'draft', title: 'Write first draft', description: 'Write the first draft of the blog post', status: 'todo', dependencies: ['outline'] },
  { id: 'edit', title: 'Edit and revise', description: 'Edit and revise the blog post for clarity and accuracy', status: 'todo', dependencies: ['draft'] },
  { id: 'images', title: 'Add images', description: 'Find and add relevant images to the blog post', status: 'todo', dependencies: ['draft'] },
  { id: 'seo', title: 'SEO optimization', description: 'Optimize the blog post for search engines', status: 'todo', dependencies: ['edit'] },
  { id: 'publish', title: 'Publish blog post', description: 'Publish the blog post on the website', status: 'todo', dependencies: ['edit', 'images', 'seo'] }
];

// Default subtasks for full web pages
const webPageSubtasks: SubTask[] = [
  { id: 'requirements', title: 'Define requirements', description: 'Define the requirements and goals for the web page', status: 'todo' },
  { id: 'wireframe', title: 'Create wireframe', description: 'Create a wireframe or mockup of the web page', status: 'todo', dependencies: ['requirements'] },
  { id: 'content', title: 'Create content', description: 'Write and prepare all content for the web page', status: 'todo', dependencies: ['requirements'] },
  { id: 'design', title: 'Design page', description: 'Create the visual design for the web page', status: 'todo', dependencies: ['wireframe'] },
  { id: 'develop', title: 'Develop page', description: 'Develop and code the web page', status: 'todo', dependencies: ['design', 'content'] },
  { id: 'test', title: 'Test functionality', description: 'Test the web page for functionality and responsiveness', status: 'todo', dependencies: ['develop'] },
  { id: 'seo', title: 'SEO optimization', description: 'Optimize the web page for search engines', status: 'todo', dependencies: ['develop'] },
  { id: 'launch', title: 'Launch page', description: 'Launch the web page on the live site', status: 'todo', dependencies: ['test', 'seo'] }
];

// Default subtasks for landing pages
const landingPageSubtasks: SubTask[] = [
  { id: 'goal', title: 'Define goal', description: 'Define the primary goal and conversion action for the landing page', status: 'todo' },
  { id: 'audience', title: 'Define audience', description: 'Define the target audience for the landing page', status: 'todo' },
  { id: 'wireframe', title: 'Create wireframe', description: 'Create a wireframe or mockup of the landing page', status: 'todo', dependencies: ['goal', 'audience'] },
  { id: 'content', title: 'Create content', description: 'Write compelling copy for the landing page', status: 'todo', dependencies: ['goal', 'audience'] },
  { id: 'form', title: 'Create form', description: 'Design and create the form for data collection', status: 'todo', dependencies: ['wireframe'] },
  { id: 'design', title: 'Design page', description: 'Create the visual design for the landing page', status: 'todo', dependencies: ['wireframe'] },
  { id: 'develop', title: 'Develop page', description: 'Develop and code the landing page', status: 'todo', dependencies: ['design', 'content', 'form'] },
  { id: 'test', title: 'Test functionality', description: 'Test the landing page and form functionality', status: 'todo', dependencies: ['develop'] },
  { id: 'launch', title: 'Launch page', description: 'Launch the landing page on the live site', status: 'todo', dependencies: ['test'] }
];

// Default subtasks for social posts
const socialPostSubtasks: SubTask[] = [
  { id: 'topic', title: 'Define topic', description: 'Define the topic and goal for the social post', status: 'todo' },
  { id: 'content', title: 'Create content', description: 'Write the content for the social post', status: 'todo', dependencies: ['topic'] },
  { id: 'image', title: 'Create image', description: 'Create or select an image for the social post', status: 'todo', dependencies: ['topic'] },
  { id: 'review', title: 'Review and approve', description: 'Review and approve the social post', status: 'todo', dependencies: ['content', 'image'] },
  { id: 'schedule', title: 'Schedule post', description: 'Schedule the social post for publication', status: 'todo', dependencies: ['review'] }
];

// Default subtasks for automated emails
const automatedEmailSubtasks: SubTask[] = [
  { id: 'trigger', title: 'Define trigger', description: 'Define the trigger for the automated email', status: 'todo' },
  { id: 'audience', title: 'Define audience', description: 'Define the target audience for the email', status: 'todo' },
  { id: 'content', title: 'Create content', description: 'Write the email content', status: 'todo', dependencies: ['trigger', 'audience'] },
  { id: 'design', title: 'Design email', description: 'Design the email template', status: 'todo', dependencies: ['content'] },
  { id: 'test', title: 'Test email', description: 'Test the email for functionality and appearance', status: 'todo', dependencies: ['design'] },
  { id: 'setup', title: 'Set up automation', description: 'Set up the email automation in the email platform', status: 'todo', dependencies: ['test'] },
  { id: 'activate', title: 'Activate automation', description: 'Activate the email automation', status: 'todo', dependencies: ['setup'] }
];

// Default subtasks for email campaigns
const emailCampaignSubtasks: SubTask[] = [
  { id: 'goal', title: 'Define goal', description: 'Define the goal for the email campaign', status: 'todo' },
  { id: 'audience', title: 'Define audience', description: 'Define the target audience for the campaign', status: 'todo' },
  { id: 'content', title: 'Create content', description: 'Write the email content', status: 'todo', dependencies: ['goal', 'audience'] },
  { id: 'design', title: 'Design email', description: 'Design the email template', status: 'todo', dependencies: ['content'] },
  { id: 'test', title: 'Test email', description: 'Test the email for functionality and appearance', status: 'todo', dependencies: ['design'] },
  { id: 'segment', title: 'Segment audience', description: 'Segment the audience for targeted sending', status: 'todo', dependencies: ['audience'] },
  { id: 'schedule', title: 'Schedule campaign', description: 'Schedule the email campaign', status: 'todo', dependencies: ['test', 'segment'] },
  { id: 'send', title: 'Send campaign', description: 'Send the email campaign', status: 'todo', dependencies: ['schedule'] }
];

// Default subtasks for Meta advertising
const metaAdSubtasks: SubTask[] = [
  { id: 'goal', title: 'Define goal', description: 'Define the goal for the Meta advertising campaign', status: 'todo' },
  { id: 'audience', title: 'Define audience', description: 'Define the target audience for the ads', status: 'todo' },
  { id: 'budget', title: 'Set budget', description: 'Set the budget for the advertising campaign', status: 'todo' },
  { id: 'creative', title: 'Create ad creative', description: 'Create the visual and copy for the ads', status: 'todo', dependencies: ['goal', 'audience'] },
  { id: 'setup', title: 'Set up campaign', description: 'Set up the campaign in Meta Ads Manager', status: 'todo', dependencies: ['goal', 'audience', 'budget', 'creative'] },
  { id: 'launch', title: 'Launch campaign', description: 'Launch the advertising campaign', status: 'todo', dependencies: ['setup'] },
  { id: 'monitor', title: 'Monitor performance', description: 'Monitor the performance of the campaign', status: 'todo', dependencies: ['launch'] },
  { id: 'optimize', title: 'Optimize campaign', description: 'Optimize the campaign based on performance data', status: 'todo', dependencies: ['monitor'] }
];

// Default subtasks for Google advertising
const googleAdSubtasks: SubTask[] = [
  { id: 'goal', title: 'Define goal', description: 'Define the goal for the Google advertising campaign', status: 'todo' },
  { id: 'keywords', title: 'Research keywords', description: 'Research and select keywords for the campaign', status: 'todo', dependencies: ['goal'] },
  { id: 'budget', title: 'Set budget', description: 'Set the budget for the advertising campaign', status: 'todo' },
  { id: 'creative', title: 'Create ad creative', description: 'Create the ad copy and extensions', status: 'todo', dependencies: ['goal', 'keywords'] },
  { id: 'setup', title: 'Set up campaign', description: 'Set up the campaign in Google Ads', status: 'todo', dependencies: ['goal', 'keywords', 'budget', 'creative'] },
  { id: 'launch', title: 'Launch campaign', description: 'Launch the advertising campaign', status: 'todo', dependencies: ['setup'] },
  { id: 'monitor', title: 'Monitor performance', description: 'Monitor the performance of the campaign', status: 'todo', dependencies: ['launch'] },
  { id: 'optimize', title: 'Optimize campaign', description: 'Optimize the campaign based on performance data', status: 'todo', dependencies: ['monitor'] }
];

// Default subtasks for LinkedIn advertising
const linkedinAdSubtasks: SubTask[] = [
  { id: 'goal', title: 'Define goal', description: 'Define the goal for the LinkedIn advertising campaign', status: 'todo' },
  { id: 'audience', title: 'Define audience', description: 'Define the target audience for the ads', status: 'todo' },
  { id: 'budget', title: 'Set budget', description: 'Set the budget for the advertising campaign', status: 'todo' },
  { id: 'creative', title: 'Create ad creative', description: 'Create the visual and copy for the ads', status: 'todo', dependencies: ['goal', 'audience'] },
  { id: 'setup', title: 'Set up campaign', description: 'Set up the campaign in LinkedIn Campaign Manager', status: 'todo', dependencies: ['goal', 'audience', 'budget', 'creative'] },
  { id: 'launch', title: 'Launch campaign', description: 'Launch the advertising campaign', status: 'todo', dependencies: ['setup'] },
  { id: 'monitor', title: 'Monitor performance', description: 'Monitor the performance of the campaign', status: 'todo', dependencies: ['launch'] },
  { id: 'optimize', title: 'Optimize campaign', description: 'Optimize the campaign based on performance data', status: 'todo', dependencies: ['monitor'] }
];

// Empty subtasks for custom activities
const customSubtasks: SubTask[] = [];

export const ACTIVITY_TYPES: ActivityTypeInfo[] = [
  {
    id: 'blog_article',
    name: 'Blog Article',
    description: 'Create and publish a blog article',
    icon: 'FileText',
    color: 'blue',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968854.png',
    defaultSubtasks: blogSubtasks,
    includesForm: false
  },
  {
    id: 'full_web_page',
    name: 'Full Web Page',
    description: 'Design and develop a complete web page',
    icon: 'Globe',
    color: 'indigo',
    logo: 'https://cdn-icons-png.flaticon.com/512/2301/2301129.png',
    defaultSubtasks: webPageSubtasks,
    includesForm: true
  },
  {
    id: 'landing_page',
    name: 'Landing Page',
    description: 'Create a landing page, possibly with a form',
    icon: 'Layout',
    color: 'purple',
    logo: 'https://cdn-icons-png.flaticon.com/512/1055/1055329.png',
    defaultSubtasks: landingPageSubtasks,
    includesForm: true
  },
  {
    id: 'social_post',
    name: 'Social Post',
    description: 'Create and schedule social media content',
    icon: 'MessageSquare',
    color: 'pink',
    logo: 'https://cdn-icons-png.flaticon.com/512/3128/3128208.png',
    defaultSubtasks: socialPostSubtasks,
    includesForm: false
  },
  {
    id: 'automated_email',
    name: 'Automated Email',
    description: 'Set up an automated email sequence',
    icon: 'Mail',
    color: 'yellow',
    logo: 'https://cdn-icons-png.flaticon.com/512/2258/2258843.png',
    defaultSubtasks: automatedEmailSubtasks,
    includesForm: false
  },
  {
    id: 'email_campaign',
    name: 'Email Campaign',
    description: 'Create and send an email campaign',
    icon: 'Send',
    color: 'green',
    logo: 'https://cdn-icons-png.flaticon.com/512/3178/3178158.png',
    defaultSubtasks: emailCampaignSubtasks,
    includesForm: false
  },
  {
    id: 'meta_advertising',
    name: 'Meta Advertising',
    description: 'Create and manage Meta (Facebook/Instagram) ads',
    icon: 'Facebook',
    color: 'blue',
    logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png',
    defaultSubtasks: metaAdSubtasks,
    includesForm: false
  },
  {
    id: 'google_advertising',
    name: 'Google Advertising',
    description: 'Create and manage Google ads',
    icon: 'Search',
    color: 'red',
    logo: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
    defaultSubtasks: googleAdSubtasks,
    includesForm: false
  },
  {
    id: 'linkedin_advertising',
    name: 'LinkedIn Advertising',
    description: 'Create and manage LinkedIn ads',
    icon: 'Linkedin',
    color: 'blue',
    logo: 'https://cdn-icons-png.flaticon.com/512/3536/3536505.png',
    defaultSubtasks: linkedinAdSubtasks,
    includesForm: false
  },
  {
    id: 'custom',
    name: 'Custom Activity',
    description: 'Create a custom marketing activity',
    icon: 'PenTool',
    color: 'gray',
    logo: 'https://cdn-icons-png.flaticon.com/512/1250/1250615.png',
    defaultSubtasks: customSubtasks,
    includesForm: false
  }
];

export const getActivityTypeInfo = (type: string): ActivityTypeInfo => {
  const activityType = ACTIVITY_TYPES.find(t => t.id === type);
  if (!activityType) {
    return ACTIVITY_TYPES[0]; // Default to first type if not found
  }
  return activityType;
};

export const getActivityIcon = (type: string) => {
  switch (type) {
    case 'blog_article':
      return FileText;
    case 'full_web_page':
      return Globe;
    case 'landing_page':
      return Layout;
    case 'social_post':
      return MessageSquare;
    case 'automated_email':
      return Mail;
    case 'email_campaign':
      return Send;
    case 'meta_advertising':
      return Facebook;
    case 'google_advertising':
      return Search;
    case 'linkedin_advertising':
      return Linkedin;
    case 'custom':
      return PenTool;
    default:
      return FileText;
  }
};

export const getActivityColor = (type: string): string => {
  const info = getActivityTypeInfo(type);
  
  switch (info.color) {
    case 'blue':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'indigo':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'purple':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'pink':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'red':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'green':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'gray':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getActivityStatusColor = (status: string): string => {
  switch (status) {
    case 'not_started':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getSubtaskStatusColor = (status: string): string => {
  switch (status) {
    case 'todo':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};