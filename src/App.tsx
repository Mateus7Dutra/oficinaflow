import React from 'react';
import { AuditDrawer } from './components/AuditDrawer';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';
import { OficinaProvider, useOficina } from './context/OficinaContext';
import { S01Login } from './screens/S01Login';
import { S02ClienteAgendamento } from './screens/S02ClienteAgendamento';
import { S03AtendenteAgenda } from './screens/S03AtendenteAgenda';
import { S04AtendenteCheckin } from './screens/S04AtendenteCheckin';
import { S05ClienteTermo } from './screens/S05ClienteTermo';
import { S06MecanicoDiagnostico } from './screens/S06MecanicoDiagnostico';
import { S07AtendenteOrcamento } from './screens/S07AtendenteOrcamento';
import { S08ClienteOrcamento } from './screens/S08ClienteOrcamento';
import { S09GestorAprovacoes } from './screens/S09GestorAprovacoes';
import { S10ComprasCotacoes } from './screens/S10ComprasCotacoes';
import { S11FornecedorPortal } from './screens/S11FornecedorPortal';
import { S12MecanicoExecucao } from './screens/S12MecanicoExecucao';
import { S13CobrancaEntrega } from './screens/S13CobrancaEntrega';

const OficinaRouter: React.FC = () => {
  const { isLoggedIn, currentScreen } = useOficina();

  if (!isLoggedIn || currentScreen === 'S01') {
    return (
      <>
        <S01Login />
        <ToastContainer />
      </>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'S02':
        return <S02ClienteAgendamento />;
      case 'S03':
        return <S03AtendenteAgenda />;
      case 'S04':
        return <S04AtendenteCheckin />;
      case 'S05':
        return <S05ClienteTermo />;
      case 'S06':
        return <S06MecanicoDiagnostico />;
      case 'S07':
        return <S07AtendenteOrcamento />;
      case 'S08':
        return <S08ClienteOrcamento />;
      case 'S09':
        return <S09GestorAprovacoes />;
      case 'S10':
        return <S10ComprasCotacoes />;
      case 'S11':
        return <S11FornecedorPortal />;
      case 'S12':
        return <S12MecanicoExecucao />;
      case 'S13':
        return <S13CobrancaEntrega />;
      default:
        return <S02ClienteAgendamento />;
    }
  };

  return (
    <>
      <Layout>{renderScreen()}</Layout>
      <AuditDrawer />
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <OficinaProvider>
      <OficinaRouter />
    </OficinaProvider>
  );
}
