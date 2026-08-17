/**
 * Transport sound for the microfiche viewer: a quiet mechanical texture while
 * the sheet is moving, and a short lock/click when it settles. Nothing plays
 * while the sheet is at rest, so there is no ambient bed.
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

export function useTransportAudio(enabled: boolean): Transport {
    const contextRef = useRef<AudioContext | null>(null);
    const textureRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);
    const noiseRef = useRef<AudioBuffer | null>(null);
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
        const now = context.currentTime;

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(82, now);
        oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.035);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
    }, [getContext]);

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
