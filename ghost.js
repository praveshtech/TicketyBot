const express = require('express');
const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, 'ghost_data.json');

// 🛡️ --- ANTI-CRASH SYSTEM --- 🛡️
process.on('unhandledRejection', (reason, p) => {
    console.log(' [Anti-Crash] Unhandled Rejection:', reason, p);
});
process.on('uncaughtException', (err, origin) => {
    console.log(' [Anti-Crash] Uncaught Exception:', err, origin);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log(' [Anti-Crash] Uncaught Exception (Monitor):', err, origin);
});
// ---------------------------------

// --- Helper Functions ---
function initData() {
    const defaultData = { kapil_on: false, manvendra_on: false, stats: { gagan: 0, kapil: 0, manvendra: 0 } };
    try {
        if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
    } catch (err) {
        console.error("File creation error:", err);
    }
}

function getGhostData() {
    initData();
    try {
        return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (err) {
        return { kapil_on: false, manvendra_on: false, stats: { gagan: 0, kapil: 0, manvendra: 0 } };
    }
}

function updateLeaderboard(modName) {
    if (!modName) return;
    const data = getGhostData();
    if (data.stats[modName] !== undefined) {
        data.stats[modName] += 1;
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    }
}

// --- Dashboard Server ---
function startDashboard(port) {
    initData();
    const app = express();
    app.use(express.json());

    app.get('/api/data', (req, res) => res.json(getGhostData()));
    
    app.post('/api/toggle', (req, res) => {
        const { mod, state } = req.body;
        let data = getGhostData();
        if (mod === 'kapil') data.kapil_on = state;
        if (mod === 'manvendra') data.manvendra_on = state;
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        res.json({ success: true });
    });

    app.get('/', (req, res) => {
        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ghost Dashboard | Tickety</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                    font-family: 'Poppins', sans-serif; 
                    background: radial-gradient(circle at top, #1b1e2b 0%, #0d0f16 100%); 
                    color: #fff; 
                    min-height: 100vh; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    padding: 50px 20px; 
                }
                .header-title { 
                    font-size: 46px; 
                    font-weight: 800; 
                    background: linear-gradient(90deg, #5865F2, #00d4ff); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                    text-shadow: 0 0 30px rgba(88, 101, 242, 0.4); 
                    margin-bottom: 50px; 
                    letter-spacing: 1px; 
                }
                .section-title { 
                    font-size: 24px; 
                    font-weight: 600; 
                    color: #a1aab8; 
                    margin: 40px 0 25px; 
                    text-transform: uppercase; 
                    letter-spacing: 3px; 
                }
                .container { 
                    display: flex; 
                    flex-wrap: wrap; 
                    justify-content: center; 
                    gap: 35px; 
                    max-width: 1100px; 
                }
                .card { 
                    background: rgba(30, 33, 44, 0.5); 
                    backdrop-filter: blur(15px); 
                    border: 1px solid rgba(255, 255, 255, 0.05); 
                    border-radius: 20px; 
                    padding: 35px 40px; 
                    width: 320px; 
                    text-align: center; 
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4); 
                    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; 
                }
                .card:hover { 
                    transform: translateY(-10px); 
                    box-shadow: 0 15px 50px rgba(88, 101, 242, 0.2); 
                    border-color: rgba(88, 101, 242, 0.4); 
                }
                .card h2 { 
                    font-size: 22px; 
                    color: #e2e8f0; 
                    margin-bottom: 25px; 
                    font-weight: 600; 
                }
                
                /* Neon Switch CSS */
                .switch { position: relative; display: inline-block; width: 74px; height: 40px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { 
                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; 
                    background-color: #ed4245; transition: .4s; border-radius: 40px; 
                    box-shadow: inset 0 2px 6px rgba(0,0,0,0.4); 
                }
                .slider:before { 
                    position: absolute; content: ""; height: 32px; width: 32px; left: 4px; bottom: 4px; 
                    background-color: white; transition: .4s; border-radius: 50%; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3); 
                }
                input:checked + .slider { 
                    background-color: #57f287; 
                    box-shadow: 0 0 20px rgba(87, 242, 135, 0.4); 
                }
                input:checked + .slider:before { transform: translateX(34px); }
                
                /* Glowing Stats */
                .stats { 
                    font-size: 52px; 
                    margin-top: 10px; 
                    font-weight: 800; 
                    color: #FEE75C; 
                    text-shadow: 0 0 20px rgba(254, 231, 92, 0.4); 
                }
                
                /* Profile Specific Colors */
                .gagan-color { color: #5865F2; }
                .kapil-color { color: #eb459e; }
                .manvendra-color { color: #fee75c; }
            </style>
        </head>
        <body>
            <h1 class="header-title">👻 Ghost Stealth Panel</h1>
            
            <div class="section-title">Control Center</div>
            <div class="container">
                <div class="card">
                    <h2><span class="kapil-color">Kapil</span> Auto-Claim</h2>
                    <label class="switch">
                        <input type="checkbox" id="kapilToggle" onchange="toggleMod('kapil', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="card">
                    <h2><span class="manvendra-color">Manvendra</span> Auto-Claim</h2>
                    <label class="switch">
                        <input type="checkbox" id="manvendraToggle" onchange="toggleMod('manvendra', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="section-title" style="margin-top: 60px;">Live Leaderboard</div>
            <div class="container">
                <div class="card">
                    <h2><span class="gagan-color">Gagan</span></h2>
                    <div class="stats" id="gaganStats">0</div>
                </div>
                <div class="card">
                    <h2><span class="kapil-color">Kapil</span></h2>
                    <div class="stats" id="kapilStats" style="color: #eb459e; text-shadow: 0 0 20px rgba(235, 69, 158, 0.4);">0</div>
                </div>
                <div class="card">
                    <h2><span class="manvendra-color">Manvendra</span></h2>
                    <div class="stats" id="manvendraStats">0</div>
                </div>
            </div>

            <script>
                function loadData() {
                    fetch('/api/data').then(res => res.json()).then(data => {
                        document.getElementById('kapilToggle').checked = data.kapil_on;
                        document.getElementById('manvendraToggle').checked = data.manvendra_on;
                        document.getElementById('gaganStats').innerText = data.stats.gagan;
                        document.getElementById('kapilStats').innerText = data.stats.kapil;
                        document.getElementById('manvendraStats').innerText = data.stats.manvendra;
                    }).catch(err => console.error("Error fetching data", err));
                }
                
                function toggleMod(mod, state) {
                    fetch('/api/toggle', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ mod, state }) 
                    }).catch(err => console.error("Error toggling state", err));
                }
                
                loadData(); 
                setInterval(loadData, 3000); 
            </script>
        </body>
        </html>
        `);
    });

    app.listen(port, () => console.log(`✅ Premium Ghost Dashboard running on port ${port}`));
}

// 📤 Functions export kar rahe hain
module.exports = { startDashboard, getGhostData, updateLeaderboard };
