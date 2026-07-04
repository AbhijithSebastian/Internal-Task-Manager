import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{vue,js,ts}',
    ],
    theme: {
        extend: {
            colors: {
                page: '#F8F9FB',
                surface: '#FFFFFF',
                border: '#EAECF0',
                'text-primary': '#101828',
                'text-secondary': '#667085',
                success: {
                    DEFAULT: '#12B76A',
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                },
                warning: {
                    DEFAULT: '#F79009',
                    50: '#FFFAEB',
                    100: '#FEF0C7',
                },
                danger: {
                    DEFAULT: '#F04438',
                    50: '#FEF3F2',
                    100: '#FEE4E2',
                },
                'brand-primary': {
                    DEFAULT: '#6366F1',
                    50: '#EEF2FF',
                    100: '#E0E7FF',
                    200: '#C7D2FE',
                    400: '#818CF8',
                    500: '#6366F1',
                    600: '#4F46E5',
                    700: '#4338CA',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            fontSize: {
                'page-title': ['40px', { lineHeight: '1.1', fontWeight: '700' }],
                'section-title': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
                'card-title': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
            },
            spacing: {
                4.5: '1.125rem',
            },
            borderRadius: {
                DEFAULT: '10px',
                card: '16px',
                input: '10px',
            },
            boxShadow: {
                card: '0 1px 2px rgba(16,24,40,0.04)',
                'card-hover': '0 4px 12px rgba(16,24,40,0.07)',
                dropdown: '0 4px 16px rgba(16,24,40,0.08)',
                modal: '0 8px 32px rgba(16,24,40,0.12)',
            },
            maxWidth: {
                content: '1280px',
            },
        },
    },
    plugins: [forms, typography],
};
