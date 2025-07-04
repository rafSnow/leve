# Leve+ 📱

> Aplicativo React Native para controle de peso e medidas corporais com foco em experiência do usuário e rastreamento de progresso.

![Leve+ Logo](./assets/icon.png)

## 📋 Sobre o Projeto

O **Leve+** é um aplicativo mobile desenvolvido em React Native que permite aos usuários acompanhar sua jornada de controle de peso e medidas corporais de forma intuitiva e motivacional. Com recursos avançados de análise de progresso, gestão de metas e interface otimizada para performance.

### ✨ Principais Funcionalidades

- 📊 **Rastreamento de Peso**: Registro e visualização da evolução do peso
- 📏 **Medidas Corporais**: Controle de medidas (peito, cintura, quadril, coxa, braço)
- 🎯 **Gestão de Metas**: Definição e acompanhamento de objetivos personalizados
- 📈 **Gráficos e Estatísticas**: Visualização do progresso através de charts interativos
- 💡 **Análise de IMC**: Cálculo automático e interpretação do Índice de Massa Corporal
- 🏆 **Sistema Motivacional**: Mensagens e conquistas baseadas no progresso
- 📱 **Interface Otimizada**: Design responsivo e performance aprimorada
- 🔄 **Sincronização Local**: Sistema robusto de armazenamento local

## 🚀 Tecnologias Utilizadas

### Core

- **React Native** `0.79.2` - Framework principal
- **Expo** `~53.0.9` - Plataforma de desenvolvimento
- **TypeScript** `~5.8.3` - Tipagem estática
- **React** `19.0.0` - Biblioteca JavaScript

### Navegação

- **@react-navigation/native** `^7.1.6` - Navegação principal
- **@react-navigation/bottom-tabs** `^7.3.10` - Navegação por abas
- **@react-navigation/stack** `^7.3.3` - Navegação em pilha

### UI/UX

- **@expo-google-fonts/poppins** - Tipografia principal
- **@expo/vector-icons** - Ícones
- **react-native-chart-kit** - Gráficos e visualizações
- **expo-blur** - Efeitos visuais

### Armazenamento e Estado

- **@react-native-async-storage/async-storage** - Persistência local
- **React Hooks** - Gerenciamento de estado

### Performance e Qualidade

- **react-native-reanimated** - Animações performáticas
- **react-native-gesture-handler** - Gestos otimizados
- **ESLint** - Qualidade de código

## 📁 Estrutura do Projeto

```
leve/
├── assets/                     # Recursos estáticos
│   ├── icon.png               # Ícone do app
│   ├── splash.png             # Tela de splash
│   └── fonts/                 # Fontes customizadas
├── components/                 # Componentes reutilizáveis
│   ├── Button.tsx             # Botão customizado
│   ├── Chart.tsx              # Componente de gráficos
│   ├── ErrorBoundary.tsx      # Tratamento de erros
│   ├── GoalCard.tsx           # Card de metas
│   ├── ProgressCircle.tsx     # Círculo de progresso
│   └── ...
├── hooks/                      # Custom hooks
│   ├── useErrorHandler.ts     # Hook para tratamento de erros
│   ├── useLoadingState.ts     # Hook para estados de loading
│   └── useStorage.ts          # Hook para armazenamento
├── screens/                    # Telas do aplicativo
│   ├── AddScreen.tsx          # Tela de adição de dados
│   ├── HistoryScreen.tsx      # Histórico de registros
│   ├── MeasurementsScreen.tsx # Registro de medidas
│   ├── ProgressScreen.tsx     # Visualização de progresso
│   ├── ProfileScreen.tsx      # Perfil do usuário
│   └── WeightInputScreen.tsx  # Registro de peso
├── styles/                     # Estilos globais
│   ├── colors.ts              # Paleta de cores
│   └── Typography.ts          # Tipografia
├── types/                      # Definições de tipos
│   └── index.ts               # Tipos TypeScript
├── utils/                      # Utilitários
│   ├── Calculations.ts        # Cálculos (IMC, etc.)
│   ├── Storage.ts             # Gerenciamento de storage
│   └── ErrorRecovery.ts       # Recuperação de erros
├── App.tsx                     # Componente principal
├── app.json                    # Configuração do Expo
├── eas.json                    # Configuração EAS Build
└── package.json               # Dependências
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js (versão 18+ recomendada)
- npm ou yarn
- Expo CLI global
- Android Studio (para desenvolvimento Android)
- Xcode (para desenvolvimento iOS - apenas macOS)

### Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/leve-plus.git
cd leve-plus
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn install
```

3. **Configure as fontes do Google Fonts**

```bash
expo install @expo-google-fonts/poppins @expo-google-fonts/inter
```

4. **Execute o projeto**

```bash
# Desenvolvimento geral
npm start

# Android específico
npm run android

# iOS específico (apenas macOS)
npm run ios

# Web
npm run web
```

## 📱 Build e Deploy

### Build de Desenvolvimento

```bash
expo start --dev-client
```

### Build Preview (APK)

```bash
eas build --platform android --profile preview
```

### Build de Produção

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Ambas as plataformas
eas build --platform all --profile production
```

### Configuração EAS Build

O projeto está configurado com profiles no `eas.json`:

- **development**: Build para desenvolvimento com dev client
- **preview**: Build para testes (APK/IPA)
- **production**: Build final para stores

## 🏗️ Arquitetura

### Padrões Implementados

#### 1. **Error Boundaries e Recovery**

```typescript
// Tratamento robusto de erros em todos os níveis
<ErrorBoundary level="screen" name="ProgressScreen">
  <ScreenErrorBoundary maxRetries={3} autoRetry>
    <ProgressScreen />
  </ScreenErrorBoundary>
</ErrorBoundary>
```

#### 2. **Custom Hooks Otimizados**

```typescript
// Hooks com memoização e otimização de performance
const { records, loading, error, refresh } = useWeightRecords();
const errorHandler = useErrorHandler({ maxRetries: 3 });
```

#### 3. **Memoização Avançada**

```typescript
// Otimização de re-renders com useMemo e useCallback
const chartData = useMemo(() => processWeightData(records), [records]);
```

#### 4. **TypeScript Estrito**

```typescript
// Tipagem completa para maior segurança
interface WeightRecord {
  id: string;
  weight: number;
  date: string;
  notes?: string;
}
```

### Componentes Principais

#### **ProgressScreen**

- Visualização de progresso geral
- Gráficos de evolução
- Métricas de saúde (IMC, RCE)
- Cards de metas

#### **WeightInputScreen**

- Registro de peso
- Validação inteligente
- Sugestões baseadas no histórico
- Análise de metas

#### **MeasurementsScreen**

- Registro de medidas corporais
- Comparação com registros anteriores
- Validação de dados

#### **ProfileScreen**

- Configuração do perfil
- Definição de metas
- Estatísticas de completude

## 🎨 Design System

### Paleta de Cores

```typescript
export const colors = {
  primary: "#6366F1", // Índigo principal
  secondary: "#10B981", // Verde sucesso
  accent: "#F59E0B", // Amarelo destaque
  white: "#FFFFFF", // Branco
  dark: "#1F2937", // Texto escuro
  gray: "#6B7280", // Texto secundário
  lightGray: "#F3F4F6", // Fundo claro
  success: "#10B981", // Verde
  warning: "#F59E0B", // Laranja
  error: "#EF4444", // Vermelho
  background: "#FAFAFA", // Fundo principal
};
```

### Tipografia

- **Primary**: Poppins (Bold/Regular)
- **Secondary**: Inter (Regular)
- Sistema de tamanhos hierárquico (H1-H6, body, caption)

## 📊 Funcionalidades Detalhadas

### 1. Rastreamento de Peso

- ✅ Registro com validação inteligente
- ✅ Histórico completo com gráficos
- ✅ Detecção de tendências
- ✅ Alertas para valores anômalos
- ✅ Cálculo automático de IMC

### 2. Medidas Corporais

- ✅ 5 medidas principais (peito, cintura, quadril, coxa, braço)
- ✅ Comparação com registros anteriores
- ✅ Sugestões baseadas no histórico
- ✅ Validação de consistência

### 3. Sistema de Metas

- ✅ Definição de metas de peso
- ✅ Acompanhamento de progresso
- ✅ Prazos e deadlines
- ✅ Análise de viabilidade

### 4. Métricas de Saúde

- ✅ IMC (Índice de Massa Corporal)
- ✅ RCE (Relação Cintura-Estatura)
- ✅ RCQ (Relação Cintura-Quadril)
- ✅ Interpretação automática

### 5. Interface e UX

- ✅ Design responsivo
- ✅ Animações suaves
- ✅ Feedback visual
- ✅ Estados de loading
- ✅ Tratamento de erros

## 🔧 Performance e Otimização

### Estratégias Implementadas

1. **Memoização Inteligente**

   - `useMemo` para cálculos complexos
   - `useCallback` para funções estáveis
   - `React.memo` para componentes

2. **Lazy Loading**

   - Carregamento sob demanda
   - Pré-carregamento inteligente

3. **Error Recovery**

   - Sistema robusto de recuperação
   - Retry automático
   - Fallbacks graceful

4. **Storage Otimizado**
   - Cache inteligente
   - Compressão de dados
   - Cleanup automático

## 🧪 Testes e Qualidade

### Ferramentas

- **ESLint**: Análise estática de código
- **TypeScript**: Verificação de tipos
- **Expo Dev Tools**: Debug e profiling

### Comandos

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Debug build
expo start --dev-client
```

## 📈 Métricas e Analytics

### Performance Tracking

- Tempo de carregamento de telas
- Taxa de erro por componente
- Uso de memória
- Cache hit rate

### User Experience

- Jornada de onboarding
- Frequência de uso
- Retenção de usuários
- Abandono de formulários

## 🤝 Contribuição

### Como Contribuir

1. **Fork** o projeto
2. **Clone** seu fork

```bash
git clone https://github.com/seu-usuario/leve-plus.git
```

3. **Crie** uma branch para sua feature

```bash
git checkout -b feature/nova-funcionalidade
```

4. **Commit** suas mudanças

```bash
git commit -m "feat: adiciona nova funcionalidade"
```

5. **Push** para a branch

```bash
git push origin feature/nova-funcionalidade
```

6. **Abra** um Pull Request

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 🐛 Troubleshooting

### Problemas Comuns

#### Metro bundler não inicia

```bash
npx expo start --clear
```

#### Erro de dependências

```bash
rm -rf node_modules
npm install
```

#### Problema com fontes

```bash
expo install expo-font @expo-google-fonts/poppins
```

#### Build EAS falha

```bash
eas build --clear-cache --platform android --profile preview
```

## 📝 Roadmap

### Versão 1.1

- [ ] Export de dados (CSV/PDF)
- [ ] Backup na nuvem
- [ ] Temas personalizáveis
- [ ] Notificações push

### Versão 1.2

- [ ] Social features (compartilhamento)
- [ ] Integração com dispositivos de saúde
- [ ] IA para sugestões personalizadas
- [ ] Múltiplos perfis

### Versão 2.0

- [ ] Web app complementar
- [ ] API backend
- [ ] Synchronização multi-device
- [ ] Analytics avançadas

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: [Seu Nome](https://github.com/seu-usuario)
- **Design**: Baseado em Material Design e Human Interface Guidelines
- **Testes**: Comunidade de beta testers

## 📞 Suporte

### Canais de Comunicação

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/leve-plus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/seu-usuario/leve-plus/discussions)
- **Email**: suporte@leveplus.app

### FAQ

**P: O app funciona offline?**
R: Sim, todos os dados são armazenados localmente no dispositivo.

**P: Os dados são seguros?**
R: Sim, todos os dados ficam no seu dispositivo e não são enviados para servidores externos.

**P: Posso exportar meus dados?**
R: Esta funcionalidade está planejada para a versão 1.1.

---

<div align="center">

**Leve+** - Sua jornada de saúde começa aqui 💪

[![Made with React Native](https://img.shields.io/badge/Made%20with-React%20Native-blue.svg)](https://reactnative.dev/)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC.svg)](https://www.typescriptlang.org/)

[⭐ Star no GitHub](https://github.com/seu-usuario/leve-plus) • [📱 Download](https://expo.dev/@seu-usuario/leve-plus) • [📖 Docs](https://github.com/seu-usuario/leve-plus/wiki)

</div>
