import mainConfig, { baseRules, basePlugins } from 'mk-eslint-config';

export default [
    ...mainConfig,
    {
        plugins: {
            ...basePlugins,
        },
        rules: {
            ...baseRules,
            'react/no-array-index-key': 'off'
        },
    },
];