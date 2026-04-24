export const metadata = {
  title: 'Trampo — Configuração Inicial',
  description: 'Configure seu sistema Trampo em menos de 5 minutos.',
};

/**
 * Layout isolado do /setup.
 * O root layout (com Providers/Footer) ainda envolve este,
 * mas o wizard usa position:fixed para cobrir tudo.
 */
export default function SetupLayout({ children }) {
  return children;
}
