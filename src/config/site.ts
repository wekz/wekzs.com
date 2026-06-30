// Single source of truth for all site-wide metadata.
// Import from here instead of hardcoding URLs across components.
export const SITE = {
  name:        'Veljko Aleksić',
  role:        'QA Automation Engineer',
  domain:      'wekzs.com',
  email:       'reach@wekzs.com',
  description: 'Obsessed with how things work and why they break.',

  // Social links
  github:      'https://github.com/wekz',
  githubRepo:  'https://github.com/wekz/wekzs.com',
  linkedin:    'https://www.linkedin.com/in/veljkoaleksic/',
  hevy:        'https://hevy.com/user/veljavex',
} as const;
