import MainLayout from "./flow/components/MainLayout";
import { DebugPanel } from "./flow/components/DebugPanel";

function App() {
  return (
    <>
      <MainLayout />
      {/* Debug panel for Windows testing */}
      <DebugPanel />
    </>
  );
}

export default App;
