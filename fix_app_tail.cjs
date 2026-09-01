const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The original file ended with:
//         {activeTab === 'ai' && <AiAssistantTab profile={activeProfile} />}
//       </main>
//     </div>
//   );
// };

// Replace the end part correctly.
const cutoffIndex = code.indexOf('{activeTab === \'ai\' && <AiAssistantTab profile={activeProfile} />}');
if (cutoffIndex > -1) {
  const final = code.substring(0, cutoffIndex) + `{activeTab === 'ai' && <AiAssistantTab profile={activeProfile} />}\n          </div>\n        </main>\n      </div>\n    </div>\n  );\n};\nexport default App;\n`;
  fs.writeFileSync('src/App.tsx', final);
}
