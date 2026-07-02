// Efectos de sonido generados con WebAudio (sin archivos externos)
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    ensure() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return false;
            }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
    }

    blip(freq, dur, type, vol, slide) {
        if (!this.ensure()) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, t);
        if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t + dur);
        gain.gain.setValueAtTime(vol || 0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
    }

    ruido(dur, vol) {
        if (!this.ensure()) return;
        const t = this.ctx.currentTime;
        const n = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < n; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / n);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol || 0.2, t);
        const filtro = this.ctx.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = 800;
        src.connect(filtro).connect(gain).connect(this.ctx.destination);
        src.start(t);
    }

    romper() {
        this.ruido(0.18, 0.25);
    }

    colocar() {
        this.blip(180, 0.09, 'square', 0.1);
    }

    saltar() {
        this.blip(260, 0.12, 'sine', 0.08, 180);
    }
}

const SFX = new SoundFX();
