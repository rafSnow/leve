import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  // Títulos
  h1: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: colors.dark,
  } as TextStyle,

  h2: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.dark,
  } as TextStyle,

  h3: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.dark,
  } as TextStyle,

  h4: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.dark,
  } as TextStyle,

  h5: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.dark,
  } as TextStyle,

  h6: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.dark,
  } as TextStyle,

  // Corpo de texto
  body1: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.dark,
  } as TextStyle,

  body2: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.dark,
  } as TextStyle,

  // Legendas e labels
  caption: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray,
  } as TextStyle,

  label: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: colors.dark,
  } as TextStyle,

  // Botões
  button: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 20,
    color: colors.white,
  } as TextStyle,

  buttonSmall: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
  } as TextStyle,

  buttonLarge: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 22,
    color: colors.white,
  } as TextStyle,

  // Números e estatísticas
  statNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: colors.dark,
  } as TextStyle,

  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray,
  } as TextStyle,

  // Links e texto secundário
  link: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
    textDecorationLine: 'underline',
  } as TextStyle,

  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray,
  } as TextStyle,
};