const MusicManager = (() => {
    const audio = document.getElementById('bg-music');
    audio.loop   = true;
    audio.volume = 0;

    const tracks = {
        ambient: '/music/ambient.mp3',
        // space: './music/space.mp3',  // uncomment when ready
        // dark:  './music/dark.mp3'    // uncomment when ready
    };

    let currentTheme = null;
    let fadeInterval = null;

    function clearFade() {
        if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; }
    }

    function fadeTo(targetVol, duration = 1000, onDone) {
        clearFade();
        const steps    = 20;
        const interval = duration / steps;
        const delta    = (targetVol - audio.volume) / steps;

        fadeInterval = setInterval(() => {
            audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
            if ((delta > 0 && audio.volume >= targetVol) ||
                (delta < 0 && audio.volume <= targetVol)) {
                audio.volume = targetVol;
                clearFade();
                if (onDone) onDone();
            }
        }, interval);
    }

    function playSrc(src) {
        audio.src = src;
        audio.play().catch(e => console.warn('Audio play blocked:', e));
    }

    return {
        start(theme = 'ambient') {
            if (currentTheme === theme && !audio.paused) return;

            currentTheme = theme;
            const src = tracks[theme] || tracks.ambient; // always falls back to ambient

            clearFade();
            audio.volume = 0;
            playSrc(src);
            fadeTo(0.7, 1500);
        },

        stop() {
            fadeTo(0, 1000, () => {
                audio.pause();
                audio.src = '';
            });
            currentTheme = null;
        },

        setTheme(theme) {
            if (theme === currentTheme) return;
            fadeTo(0, 800, () => {
                this.start(theme);
            });
        },

        get isRunning() { return !audio.paused && audio.src !== ''; },
        get theme()     { return currentTheme; }
    };
})();

window.MusicManager = MusicManager;