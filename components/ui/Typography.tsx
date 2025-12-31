import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type TypographyVariant = keyof typeof Theme.typography;

interface TypographyProps {
    children: React.ReactNode;
    variant?: TypographyVariant;
    color?: string;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
}

export function Typography({
    children,
    variant = 'body',
    color,
    style,
    numberOfLines,
}: TypographyProps) {
    const { colors } = useTheme();
    const typographyStyle = Theme.typography[variant];

    return (
        <Text
            numberOfLines={numberOfLines}
            style={[
                typographyStyle,
                { color: color || colors.text },
                style,
            ]}
        >
            {children}
        </Text>
    );
}

export function Hero({ children, style, ...props }: Omit<TypographyProps, 'variant'>) {
    return <Typography variant="hero" style={style} {...props}>{children}</Typography>;
}

export function Title({ children, style, ...props }: Omit<TypographyProps, 'variant'>) {
    return <Typography variant="title" style={style} {...props}>{children}</Typography>;
}

export function Heading({ children, style, ...props }: Omit<TypographyProps, 'variant'>) {
    return <Typography variant="heading" style={style} {...props}>{children}</Typography>;
}

export function Body({ children, style, ...props }: Omit<TypographyProps, 'variant'>) {
    return <Typography variant="body" style={style} {...props}>{children}</Typography>;
}

export function Caption({ children, style, color, ...props }: Omit<TypographyProps, 'variant'>) {
    const { colors } = useTheme();
    return (
        <Typography
            variant="caption"
            color={color || colors.textMuted}
            style={style}
            {...props}
        >
            {children}
        </Typography>
    );
}
