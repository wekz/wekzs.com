// Single source of truth for all site-wide metadata.
// Import from here instead of hardcoding URLs across components.
export const SITE = {
  name:        'Veljko Aleksić',
  role:        'QA Automation Engineer',
  domain:      'wekzs.com',
  email:       'hello@wekzs.com',
  description: 'QA Automation Engineer — wekzs.com',

  // Social links
  github:      'https://github.com/veljavex',
  githubRepo:  'https://github.com/wekz/wekzs.com',
  linkedin:    'https://www.linkedin.com/in/veljkoaleksic/',
  hevy:        'https://hevy.com/user/veljavex',
} as const;
