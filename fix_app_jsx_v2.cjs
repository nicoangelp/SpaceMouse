const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldJsxStart = code.indexOf('return (\n    <div className="min-h-screen');
const mainStart = code.indexOf('<main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 flex flex-col space-y-6">');

const newJsx = `return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-black">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={setActiveProfileId}
          isConnected={isConnected}
          connectionType={connectionType}
          deviceName={connectedDeviceName}
          onConnectBluetooth={handleConnectBluetooth}
          onConnectSerial={handleConnectSerial}
          onDisconnect={handleDisconnectHardware}
          packetHz={packetHz}
          onQuickBurnNvs={handleQuickBurnNvs}
        />

        {/* Floating Status Toast */}
        {toastMessage && (
          <div
            className={\`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl border text-xs shadow-2xl flex items-center gap-3 animate-slideUp \${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                : 'bg-cyan-950/95 border-cyan-500/50 text-cyan-200'
            }\`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Flame className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Profile Management Modal */}
        <ProfileManagerModal
          isOpen={isProfileManagerOpen}
          onClose={() => setIsProfileManagerOpen(false)}
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelectProfile={setActiveProfileId}
          onAddProfile={handleAddProfile}
          onUpdateProfile={handleUpdateProfile}
          onDeleteProfile={handleDeleteProfile}
          onImportProfiles={handleImportProfiles}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 animate-fadeIn">
          <div className="max-w-[1600px] mx-auto flex flex-col space-y-6">
`;

const oldEndStr = '{activeTab === \'ai\' && <AiAssistantTab profile={activeProfile} />}\n          </div>\n        </main>\n      </div>\n    </div>\n  );\n};\nexport default App;';
const newEndStr = '{activeTab === \'ai\' && <AiAssistantTab profile={activeProfile} />}\n          </div>\n        </main>\n      </div>\n    </div>\n  );\n};\n\nexport default App;\n';

// Replace from 'return (\n' to '<main className...>\n'
const prefix = code.substring(0, oldJsxStart);
let suffix = code.substring(mainStart + '<main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 flex flex-col space-y-6">'.length);

let finalCode = prefix + newJsx + suffix;
finalCode = finalCode.replace(oldEndStr, newEndStr);

fs.writeFileSync('src/App.tsx', finalCode);
