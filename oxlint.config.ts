import { defineConfig } from 'oxlint';

// Ported from t-performance-dash's oxlint.config.ts. Dropped there-only rules: the chart.js and
// lodash import wrappers, the vitest plugin, and the Storybook, shadcn and test overrides.
export default defineConfig({
  $schema: './node_modules/oxlint/configuration_schema.json',
  // Listing plugins replaces oxlint's defaults, so eslint/typescript/unicorn/oxc are restated here.
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import', 'react', 'jsx-a11y'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'warn',
  },
  options: {
    typeAware: true,
    // typeCheck is left off: `astro check` stays the source of truth for type errors.
  },
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  ignorePatterns: ['dist/**', '.astro/**', '.impeccable/**', '**/*.js', '**/*.mjs'],
  rules: {
    'no-console': 'error',
    'no-unused-vars': 'error',
    'prefer-destructuring': ['warn', { array: false, object: true }],
    eqeqeq: ['error', 'smart'],

    'import/no-self-import': 'error',
    'import/no-default-export': 'warn',
    'import/newline-after-import': 'error',
    'import/max-dependencies': ['warn', { max: 20, ignoreTypeImports: false }],

    'react/jsx-no-target-blank': 'warn',
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    'react/rules-of-hooks': 'error',
    'react/exhaustive-deps': 'error',
    // React Compiler rules; native in oxlint but marked experimental upstream.
    'react/set-state-in-effect': 'error',
    'react/set-state-in-render': 'error',
    'react/immutability': 'error',
    'react/refs': 'error',
    'react/static-components': 'error',
    'react/preserve-manual-memoization': 'error',
    'react/purity': 'error',
    'react/globals': 'error',
    'react/use-memo': 'error',
    'react/void-use-memo': 'error',
    'react/incompatible-library': 'error',
    'react/error-boundaries': 'error',
    'react/unsupported-syntax': 'error',

    'typescript/ban-ts-comment': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-non-null-assertion': 'off',
    'typescript/triple-slash-reference': 'off',
    'typescript/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false },
    ],
    'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],

    // Type-aware
    'typescript/await-thenable': 'error',
    'typescript/no-floating-promises': 'error',
    'typescript/no-misused-promises': 'error',
    'typescript/no-unnecessary-type-assertion': 'error',
    'typescript/no-unsafe-type-assertion': 'error',
    'typescript/no-unsafe-argument': 'error',
    'typescript/no-unsafe-assignment': 'error',
    'typescript/no-unsafe-call': 'error',
    'typescript/no-unsafe-member-access': 'error',
    'typescript/no-unsafe-return': 'error',
    // On primitives `||` is used on purpose: '' falls back to a default, 0 hides a value, and
    // booleans are or'd. `??` would change all three. Not on by category (pedantic).
    'typescript/prefer-nullish-coalescing': [
      'error',
      { ignorePrimitives: true, ignoreBooleanCoercion: true },
    ],
    'typescript/restrict-template-expressions': 'error',
    'typescript/switch-exhaustiveness-check': [
      'error',
      { considerDefaultExhaustiveForUnions: true, requireDefaultForNonUnion: false },
    ],

    // Not useful here
    'react/react-in-jsx-scope': 'off', // automatic JSX runtime
    'import/no-unassigned-import': 'off', // CSS and font side-effect imports
    'unicorn/consistent-function-scoping': 'off',
    'oxc/no-map-spread': 'off',
    'unicorn/prefer-set-has': 'off', // its fixes turn tiny constant arrays into Sets, one by one
    'react/exhaustive-effect-dependencies': 'off', // duplicates react/exhaustive-deps
    'jsx-a11y/control-has-associated-label': 'off', // flags empty table cells
    'jsx-a11y/prefer-tag-over-role': 'off',
  },
  overrides: [
    {
      // Astro islands and config files are default exports by convention.
      files: ['src/components/charts/*.tsx', 'astro.config.*', 'oxlint.config.ts', 'src/content.config.ts'],
      rules: { 'import/no-default-export': 'off' },
    },
  ],
});
