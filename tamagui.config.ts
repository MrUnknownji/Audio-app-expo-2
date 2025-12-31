import { createTamagui } from 'tamagui';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';
import { createInterFont } from '@tamagui/font-inter';
import { createAnimations } from '@tamagui/animations-react-native';

const interFont = createInterFont();

const animations = createAnimations({
    fast: {
        type: 'spring',
        damping: 20,
        mass: 1.2,
        stiffness: 250,
    },
    medium: {
        type: 'spring',
        damping: 15,
        mass: 1,
        stiffness: 150,
    },
    slow: {
        type: 'spring',
        damping: 20,
        stiffness: 60,
    },
    lazy: {
        type: 'spring',
        damping: 20,
        stiffness: 60,
    },
    quick: {
        type: 'spring',
        damping: 20,
        mass: 1.2,
        stiffness: 250,
    },
    tooltip: {
        type: 'spring',
        damping: 10,
        mass: 0.9,
        stiffness: 100,
    },
});

const appConfig = createTamagui({
    defaultTheme: 'dark',
    shouldAddPrefersColorThemes: true,
    themeClassNameOnRoot: true,
    shorthands,
    animations,
    fonts: {
        heading: interFont,
        body: interFont,
    },
    themes: {
        ...themes,
        dark: {
            ...themes.dark,
            background: 'hsla(0, 15%, 1%, 1)',
            backgroundHover: 'hsla(0, 15%, 6%, 1)',
            backgroundPress: 'hsla(0, 15%, 12%, 1)',
            backgroundFocus: 'hsla(0, 15%, 17%, 1)',
            color: 'hsla(0, 15%, 99%, 1)',
            colorHover: 'hsla(0, 15%, 93%, 1)',
            borderColor: 'hsla(0, 15%, 23%, 1)',
            borderColorHover: 'hsla(0, 15%, 28%, 1)',
            placeholderColor: 'hsla(0, 15%, 50%, 1)',
        },
        light: {
            ...themes.light,
            background: 'hsla(0, 15%, 99%, 1)',
            backgroundHover: 'hsla(0, 15%, 94%, 1)',
            backgroundPress: 'hsla(0, 15%, 88%, 1)',
            backgroundFocus: 'hsla(0, 15%, 83%, 1)',
            color: 'hsla(0, 15%, 1%, 1)',
            colorHover: 'hsla(0, 15%, 15%, 1)',
            borderColor: 'hsla(0, 15%, 77%, 1)',
            borderColorHover: 'hsla(0, 15%, 72%, 1)',
            placeholderColor: 'hsla(0, 15%, 50%, 1)',
        },
    },
    tokens,
    media: {
        xs: { maxWidth: 660 },
        sm: { maxWidth: 800 },
        md: { maxWidth: 1020 },
        lg: { maxWidth: 1280 },
        xl: { maxWidth: 1420 },
        xxl: { maxWidth: 1600 },
        gtXs: { minWidth: 660 + 1 },
        gtSm: { minWidth: 800 + 1 },
        gtMd: { minWidth: 1020 + 1 },
        gtLg: { minWidth: 1280 + 1 },
        short: { maxHeight: 820 },
        tall: { minHeight: 820 },
        hoverNone: { hover: 'none' },
        pointerCoarse: { pointer: 'coarse' },
    },
});

export type AppConfig = typeof appConfig;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig { }
}

export default appConfig;
