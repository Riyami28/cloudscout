export const SEARCH_KEYWORDS = {
  cloudBilling: [
    'cloud bill',
    'cloud billing',
    'cloud cost',
    'cloud spend',
    'cloud expenses',
    'high AWS bill',
    'Azure cost',
    'GCP billing',
    'cloud budget',
    'cloud overspend',
  ],
  finops: [
    'FinOps',
    'cloud financial management',
    'cloud cost optimization',
    'cloud cost reduction',
    'cloud savings',
    'reserved instances',
    'right-sizing',
    'cloud waste',
  ],
  painPoints: [
    'cloud bill shock',
    'cost optimization',
    'reducing cloud costs',
    'cloud cost management',
    'cloud spending out of control',
    'unexpected cloud charges',
    'cloud cost surprise',
  ],
};

export const KEYWORD_PRESETS = [
  { label: 'Cloud Billing Problems', query: 'cloud bill problem OR cloud cost too high' },
  { label: 'FinOps Challenges', query: 'FinOps challenges OR cloud financial management' },
  { label: 'AWS Bill Too High', query: 'AWS bill too high OR AWS cost optimization' },
  { label: 'Cloud Cost Optimization', query: 'cloud cost optimization OR reduce cloud spend' },
  { label: 'Cloud Waste', query: 'cloud waste OR unused cloud resources OR idle instances' },
  { label: 'Multi-Cloud Costs', query: 'multi-cloud cost OR hybrid cloud billing' },
];

export const CATEGORIZED_PRESETS = [
  {
    label: 'Cloud Billing',
    icon: 'billing',
    presets: [
      { label: 'Cloud Bill Too High', query: 'cloud bill problem OR cloud cost too high' },
      { label: 'AWS Billing Issues', query: 'AWS bill too high OR AWS cost optimization' },
      { label: 'Azure Cost Problems', query: 'Azure cost too high OR Azure billing issues' },
      { label: 'GCP Billing', query: 'GCP billing OR Google Cloud cost optimization' },
    ],
  },
  {
    label: 'FinOps',
    icon: 'finops',
    presets: [
      { label: 'FinOps Challenges', query: 'FinOps challenges OR cloud financial management' },
      { label: 'Cost Optimization', query: 'cloud cost optimization OR reduce cloud spend' },
      { label: 'Cloud Waste', query: 'cloud waste OR unused cloud resources OR idle instances' },
      { label: 'Right-Sizing', query: 'right-sizing cloud OR cloud resource optimization' },
    ],
  },
  {
    label: 'By Company',
    icon: 'company',
    presets: [
      { label: 'Netflix Cloud', query: 'company:Netflix' },
      { label: 'Airbnb Cloud', query: 'company:Airbnb' },
      { label: 'Uber Cloud', query: 'company:Uber' },
      { label: 'Stripe Cloud', query: 'company:Stripe' },
    ],
  },
  {
    label: 'Multi-Cloud',
    icon: 'multicloud',
    presets: [
      { label: 'Multi-Cloud Costs', query: 'multi-cloud cost OR hybrid cloud billing' },
      { label: 'Cloud Migration', query: 'cloud migration cost OR cloud migration billing' },
      { label: 'OCI vs AWS', query: 'Oracle Cloud OCI vs AWS cost comparison' },
    ],
  },
];

export const TARGET_ROLES = [
  'CTO',
  'CEO',
  'VP Engineering',
  'VP of Engineering',
  'Director of Engineering',
  'Head of Infrastructure',
  'Head of Cloud',
  'VP Infrastructure',
  'CFO',
  'Director of Cloud',
  'Chief Architect',
  'VP Platform',
  'Director of DevOps',
  'Head of DevOps',
  'VP Operations',
  'Director of SRE',
  'Head of SRE',
];

export const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d' as const },
  { label: 'Last 30 days', value: '30d' as const },
  { label: 'Last 90 days', value: '90d' as const },
  { label: 'All time', value: 'all' as const },
];

export const SCORING_WEIGHTS = {
  painPointAlignment: 25,
  decisionMakerRole: 25,
  companyFit: 25,
  recency: 15,
  engagementSignal: 10,
};
