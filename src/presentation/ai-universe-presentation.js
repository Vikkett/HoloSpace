// ============================================================
// PRESENTATION LAYER — DOM, events, chat UI, modal logic.
// Orchestrates calls to domain and persistence layers only.
// ============================================================

// ── App state ─────────────────────────────────────────────────

const session = createSession();   // domain


// ── Chat UI ───────────────────────────────────────────────────

function toggleChat() {
    document.getElementById('chat-window').classList.toggle('active');
}

function addMsg(text, sender) {
    const history = document.getElementById('chat-history');
    const div     = document.createElement('div');
    div.className   = sender === 'ai' ? 'ai-msg' : 'user-msg';
    div.textContent = text;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

function setModeIndicator(text) {
    document.getElementById('mode-indicator').innerText = text;
}

// ── Loading feedback ──────────────────────────────────────────

function setUILoading(loading) {
    const btn   = document.querySelector('#chat-window #send-btn');
    const input = document.getElementById('user-input');

    if (loading) {
        if (btn)   { btn.innerText = '...'; btn.disabled = true; }
        if (input) input.disabled = true;
    } else {
        if (btn)   { btn.innerText = 'CRÉER'; btn.disabled = false; }
        if (input) input.disabled = false;
    }

    setLoading(loading);   // persistence (Three.js animation state)
}

// ── Bot communication ─────────────────────────────────────────

async function talkToBot(userMessage) {
    setUILoading(true);

    // If this is the first message after setup, inject preferences
    let messageToSend = userMessage;
    if (session.universeSetup && !session.universeSetup.sent) {
        session.universeSetup.sent = true;
        messageToSend = buildSetupMessage(session.universeSetup);   // domain
    }

    try {
        const data = await sendChatMessage(session.id, messageToSend);   // domain
        session.phase = data.phase || session.phase;

        const cleanMessage = cleanBotMessage(data.message ?? '');        // domain
        addMsg(cleanMessage, 'ai');

        // Planets
        const planets = processPlanets(data.planets);                    // domain
        if (planets) {
            buildUniverse(planets);                                      // persistence
            setModeIndicator(`✦ ${planets.length} PLANÈTE(S)`);
        }

        // Sun color
        if (data.environment?.sunColor != null) {
            const canUpdate = !isSunColorLocked() || data.environment.sunLocked === true;
            if (canUpdate) {
                applySunColor(data.environment.sunColor, data.environment.sunLocked);  // persistence
            }
        }

        // Environment
        if (data.environment) {
            const envParams = mapEnvironmentParams(data.environment);    // domain
            updateEnvironment(envParams);                                // persistence
        }

        if (data.sunLocked) setSunColorLocked(true);                    // persistence

        // Mode indicator
        if (data.isComplete) {
            document.getElementById('user-input').placeholder = 'Demande des modifications...';
            setModeIndicator('✦ SYSTÈME DÉPLOYÉ');
        } else if (!planets) {
            setModeIndicator('✦ AI UNIVERSE');
        }

        if (data.toolsUsed?.length > 0) {
            console.log('Tools used:', data.toolsUsed.join(', '));
        }

    } catch (e) {
        console.error('Error:', e);
        addMsg('✕ Erreur critique : Liaison avec Nova rompue.', 'ai');
        setModeIndicator('✕ ERREUR');
    } finally {
        setUILoading(false);
    }
}

async function handleUserMsg() {
    const inputField = document.getElementById('user-input');
    const text = inputField.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    inputField.value = '';
    await talkToBot(text);
}

async function startConvo() {
    await talkToBot(null);
}

// ── Setup modal ───────────────────────────────────────────────

function validateAndGo() {
    const vibeInput = document.getElementById('setup-vibe');
    const errorSpan = document.getElementById('vibe-error');
    const vibe      = vibeInput.value.trim();

    const { valid, error } = validateSetup(vibe);    // domain
    if (!valid) {
        errorSpan.textContent = error;
        vibeInput.classList.add('invalid');
        return;
    }
    errorSpan.textContent = '';
    vibeInput.classList.remove('invalid');

    const style = document.getElementById('setup-style')?.value || 'mystique';
    session.universeSetup = { vibe, style, sent: false };

    // Show scene panels
    document.getElementById('setup-modal').style.display   = 'none';
    document.getElementById('chat-window').style.display   = 'flex';
    document.querySelector('.chat-trigger').style.display  = 'flex';
    document.getElementById('customize-btn').style.display = 'flex';

    // Boot Three.js
    initScene();            // persistence
    startAnimationLoop();   // persistence

    // Apply style environment before first bot message
    const styleColors = STYLE_SKY_COLORS[style];   // domain constant
    if (styleColors) {
        manualSkyOverride = true;
        updateEnvironment({                         // persistence
            vibe:           styleColors.vibe,
            mood:           styleColors.vibe,
            primaryColor:   styleColors.primary,
            secondaryColor: styleColors.secondary,
            energy:         styleColors.energy,
        });
    }

    startConvo();
}

// ── Customise modal ───────────────────────────────────────────

function openCustomize() {
    const modal = document.getElementById('customize-modal');
    if (!modal) return;

    if (session.universeSetup) {
        const vibeField  = document.getElementById('custom-vibe');
        const styleField = document.getElementById('custom-style');
        if (vibeField)  vibeField.value  = session.universeSetup.vibe  || '';
        if (styleField) styleField.value = session.universeSetup.style || 'mystique';
    }
    modal.style.display = 'flex';
}

function closeCustomize() {
    const modal = document.getElementById('customize-modal');
    if (modal) modal.style.display = 'none';
}

function applyCustomize() {
    const vibe      = document.getElementById('custom-vibe')?.value.trim();
    const errorSpan = document.getElementById('custom-vibe-error');

    const { valid, error } = validateCustomize(vibe);   // domain
    if (!valid) {
        if (errorSpan) errorSpan.textContent = error;
        return;
    }
    if (errorSpan) errorSpan.textContent = '';

    const style = document.getElementById('custom-style')?.value || 'mystique';
    session.universeSetup = { ...session.universeSetup, vibe, style, sent: false };

    const styleColors = STYLE_SKY_COLORS[style];        // domain constant
    if (styleColors) {
        manualSkyOverride = true;
        updateEnvironment({                             // persistence
            vibe:           styleColors.vibe,
            mood:           styleColors.vibe,
            primaryColor:   styleColors.primary,
            secondaryColor: styleColors.secondary,
            energy:         styleColors.energy,
        });
    }

    closeCustomize();

    const msg = buildCustomizeMessage(vibe, style);     // domain
    addMsg(msg, 'user');
    talkToBot(msg);
}

// ── Bootstrap ─────────────────────────────────────────────────

window.onload = () => {
    console.log('UI LOADED');

    const input    = document.getElementById('user-input');
    const btn      = document.getElementById('send-btn');
    const enterBtn = document.getElementById('enter-btn');
    const vibeInput = document.getElementById('setup-vibe');

    if (input)     input.addEventListener('keydown',     e => { if (e.key === 'Enter') handleUserMsg(); });
    if (btn)       btn.addEventListener('click',         handleUserMsg);
    if (enterBtn)  enterBtn.addEventListener('click',    validateAndGo);
    if (vibeInput) vibeInput.addEventListener('keydown', e => { if (e.key === 'Enter') validateAndGo(); });
};

window.onresize = () => onResize();   // persistence