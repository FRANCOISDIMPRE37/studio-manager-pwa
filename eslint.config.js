import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['client/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // ============================================================
      // RÈGLE DE SÉCURITÉ CRITIQUE — NE PAS SUPPRIMER
      // Toutes les données doivent être stockées sur le serveur OVH
      // via tRPC. Aucun localStorage ou sessionStorage autorisé.
      // ============================================================
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message:
            '🚫 INTERDIT : localStorage est banni de ce projet. ' +
            'Toutes les données doivent être stockées sur le serveur OVH via tRPC. ' +
            'Voir la documentation : docs/securite-donnees.md',
        },
        {
          name: 'sessionStorage',
          message:
            '🚫 INTERDIT : sessionStorage est banni de ce projet. ' +
            'Toutes les données doivent être stockées sur le serveur OVH via tRPC.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'localStorage',
          message:
            '🚫 INTERDIT : window.localStorage est banni de ce projet. ' +
            'Utiliser tRPC pour toutes les données.',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message:
            '🚫 INTERDIT : window.sessionStorage est banni de ce projet. ' +
            'Utiliser tRPC pour toutes les données.',
        },
      ],
    },
  },
];
