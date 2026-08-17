/**
 * Transport sound for the microfiche viewer: a quiet mechanical texture while
 * the sheet is moving, and a lock when it settles. Nothing plays while the
 * sheet is at rest, so there is no ambient bed.
 *
 * The lock is a heavy panel button — dull contact, a low resonant body, then
 * the mechanism seating a beat later. It is synthesised rather than sampled
 * mostly so it can vary: an identical waveform on every settle starts to sound
 * like a machine gun, and this fires often.
 */
import { useCallback, useEffect, useRef } from "react";

type Transport = {
    /** Begin the travel texture. Safe to call when already running. */
    start: () => void;
    /** 0..1 — scales with movement speed and distance. */
    setIntensity: (value: number) => void;
    /** Fade out the travel texture. */
    stop: () => void;
    /** Short mechanical lock at the end of a move. */
    lock: () => void;
};

const MAX_TEXTURE_GAIN = 0.05;
/** Peak level of the lock. The one number to nudge if it sits wrong against
 *  the travel texture. */
const LOCK_GAIN = 0.4;
/**
 * How far ahead of the audio clock to schedule the lock. `currentTime` is the
 * start of the block already being rendered, so anything scheduled at it is
 * partly in the past by the time the audio thread gets there. The 70ms body
 * loses a few inaudible milliseconds that way, but the 6ms contact transient
 * loses its entire envelope — which is why the click was sometimes only a thud.
 */
const LOCK_LEAD = 0.012;

export function useTransportAudio(enabled: boolean): Transport {
    const contextRef = useRef<AudioContext | null>(null);
    const textureRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);
    const noiseRef = useRef<AudioBuffer | null>(null);
    const clickNoiseRef = useRef<AudioBuffer | null>(null);
    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;

    const getContext = useCallback(() => {
        if (!contextRef.current) {
            contextRef.current = new AudioContext();
        }
        const context = contextRef.current;
        if (context.state === "suspended") void context.resume();
        return context;
    }, []);

    const getNoise = useCallback((context: AudioContext) => {
        if (!noiseRef.current) {
            const length = Math.floor(context.sampleRate * 1.5);
            const buffer = context.createBuffer(1, length, context.sampleRate);
            const data = buffer.getChannelData(0);
            // Brown-ish noise: heavier low end reads as machinery rather than hiss.
            let last = 0;
            for (let i = 0; i < length; i++) {
                const white = Math.random() * 2 - 1;
                last = (last + 0.028 * white) / 1.028;
                data[i] = last * 3.2;
            }
            noiseRef.current = buffer;
        }
        return noiseRef.current;
    }, []);

    const getClickNoise = useCallback((context: AudioContext) => {
        if (!clickNoiseRef.current) {
            // White, unlike the transport's brown noise, which has almost
            // nothing left above 1 kHz to make a contact transient from.
            const length = Math.floor(context.sampleRate * 0.12);
            const buffer = context.createBuffer(1, length, context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
            clickNoiseRef.current = buffer;
        }
        return clickNoiseRef.current;
    }, []);

    const stop = useCallback(() => {
        const texture = textureRef.current;
        if (!texture || !contextRef.current) return;
        const now = contextRef.current.currentTime;
        texture.gain.gain.cancelScheduledValues(now);
        texture.gain.gain.setTargetAtTime(0, now, 0.05);
        texture.source.stop(now + 0.4);
        textureRef.current = null;
    }, []);

    const start = useCallback(() => {
        if (!enabledRef.current || textureRef.current) return;
        const context = getContext();

        const source = context.createBufferSource();
        source.buffer = getNoise(context);
        source.loop = true;

        // A narrow band around the drive motor, plus a little rumble underneath.
        const band = context.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 340;
        band.Q.value = 1.4;

        const shelf = context.createBiquadFilter();
        shelf.type = "lowshelf";
        shelf.frequency.value = 180;
        shelf.gain.value = 6;

        const gain = context.createGain();
        gain.gain.value = 0;

        source.connect(band).connect(shelf).connect(gain).connect(context.destination);
        source.start();
        textureRef.current = { source, gain };
    }, [getContext, getNoise]);

    const setIntensity = useCallback((value: number) => {
        const texture = textureRef.current;
        if (!texture || !contextRef.current) return;
        const clamped = Math.max(0, Math.min(1, value));
        texture.gain.gain.setTargetAtTime(
            clamped * MAX_TEXTURE_GAIN,
            contextRef.current.currentTime,
            0.04,
        );
    }, []);

    const lock = useCallback(() => {
        if (!enabledRef.current) return;
        const context = getContext();
        const now = context.currentTime + LOCK_LEAD;
        const buffer = getClickNoise(context);

        // One wobble and one level for the whole click. Varying each transient
        // separately swung the balance between contact and body, so the same
        // sound came out as a click on one press and a thud on the next.
        const spread = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;
        const wobble = spread(0.025);
        const level = spread(0.05);

        /** One filtered noise transient with an exponential decay. */
        const hit = (
            at: number,
            type: BiquadFilterType,
            frequency: number,
            q: number,
            peak: number,
            decay: number,
        ) => {
            const source = context.createBufferSource();
            source.buffer = buffer;
            const filter = context.createBiquadFilter();
            filter.type = type;
            filter.frequency.value = frequency * wobble;
            filter.Q.value = q;
            const gain = context.createGain();
            gain.gain.setValueAtTime(peak * level * LOCK_GAIN, at);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
            source.connect(filter).connect(gain).connect(context.destination);
            source.start(at);
            source.stop(at + decay + 0.01);
        };

        hit(now, "highpass", 1900, 0.6, 0.2, 0.006); // contact
        hit(now, "lowpass", 240, 8, 1, 0.07); // body
        hit(now + 0.026 * spread(0.08), "lowpass", 190, 6, 0.5, 0.055); // seating
    }, [getClickNoise, getContext]);

    // Turning sound off mid-travel should silence the texture immediately.
    useEffect(() => {
        if (!enabled) stop();
    }, [enabled, stop]);

    useEffect(() => {
        return () => {
            stop();
            void contextRef.current?.close();
            contextRef.current = null;
        };
    }, [stop]);

    return { start, setIntensity, stop, lock };
}
