import { DOM } from "../../elements";
import CFM from "../../../utils/config";

type LyricLine = { time: number | null; text: string };
type LyricSource = "spotify" | "lyrics-plus" | null;

export class Lyrics {
    private static container: HTMLElement | null = null;
    private static scrollArea: HTMLElement | null = null;
    private static lines: LyricLine[] = [];
    private static activeIndex = -1;
    private static rafId: number | null = null;
    private static source: LyricSource = null;
    private static isAutoScrolling = false;

    static attach(container: HTMLElement) {
        this.container = container;
    }

    static teardown() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.lines = [];
        this.activeIndex = -1;
        this.source = null;
        this.isAutoScrolling = false;
        this.scrollArea?.removeEventListener("scroll", this.handleScroll);
        this.scrollArea = null;
        this.container = null;
    }

    static toggleLyrics() {
        DOM.container.classList.toggle("lyrics-hide-force");
    }

    static handleLyricsUpdate(evt: any) {
        const detail = evt?.detail ?? {};
        if (detail.isLoading) {
            this.renderStatus("Loading lyrics…", false);
            return;
        }
        const lines = this.normalizeLines(detail.synced || detail.lines || detail.lyrics);
        if (!lines.length) {
            if (this.source !== "spotify") this.renderStatus("Lyrics unavailable", true);
            return;
        }
        this.applyLines(lines, "lyrics-plus");
    }

    static async loadLyrics(trackUri?: string) {
        if (!CFM.get("lyricsDisplay") || !trackUri) {
            this.renderStatus("Lyrics unavailable", true);
            return;
        }
        this.renderStatus("Loading lyrics…", false);
        const trackId = trackUri?.split(":").pop();
        if (!trackId) {
            this.renderStatus("Lyrics unavailable", true);
            return;
        }
        try {
            const response = await Spicetify.CosmosAsync.get(
                `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`,
            );
            const lines = this.normalizeLines(response?.lyrics?.lines);
            if (!lines.length) {
                this.renderStatus("Lyrics unavailable", true);
                return;
            }
            this.applyLines(lines, "spotify");
        } catch (err) {
            this.renderStatus("Lyrics unavailable", true);
        }
    }

    // ---- internal helpers ----

    private static renderStatus(text: string, unavailable: boolean) {
        if (!this.container) return;
        if (unavailable) DOM.container.classList.add("lyrics-unavailable");
        else DOM.container.classList.remove("lyrics-unavailable");
        this.stopLoop();
        this.container.innerHTML = `<div class="lyrics-wrapper"><div class="lyrics-status">${text}</div></div>`;
    }

    private static applyLines(lines: LyricLine[], source: Exclude<LyricSource, null>) {
        this.source = source;
        this.lines = lines;
        this.activeIndex = -1;
        DOM.container.classList.remove("lyrics-unavailable");
        this.renderLines();
        this.startLoop();
    }

    private static renderLines() {
        if (!this.container) return;
        const body = this.lines
            .map(
                (line, idx) =>
                    `<div class="lyrics-line" data-index="${idx}" data-time="${line.time ?? ""}">${line.text}</div>`,
            )
            .join("");
        this.container.innerHTML = `<div class="lyrics-wrapper"><div class="lyrics-scroll">${body}</div></div>`;
        this.scrollArea = this.container.querySelector(".lyrics-scroll") as HTMLElement;
        this.scrollArea?.addEventListener("scroll", this.handleScroll);
    }

    private static startLoop() {
        this.stopLoop();
        const tick = () => {
            this.updateActive();
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
    }

    private static stopLoop() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }

    private static updateActive() {
        if (!this.container || !this.lines.length) return;
        const progress = Spicetify.Player?.getProgress?.() ?? 0;
        let nextIndex = -1;

        for (let i = 0; i < this.lines.length; i++) {
            const t = this.lines[i].time;
            if (t === null) continue;
            if (t <= progress) nextIndex = i;
            else break;
        }

        if (nextIndex === this.activeIndex) return;

        const nodes = Array.from(this.container.querySelectorAll<HTMLElement>(".lyrics-line"));
        const activeNode = nextIndex >= 0 ? nodes[nextIndex] : null;
        const lineHeight = activeNode?.getBoundingClientRect().height || 32;
        const centerOffset =
            this.scrollArea && activeNode
                ? this.scrollArea.clientHeight / 2 - lineHeight / 2
                : 0;
        const desiredOffset = activeNode
            ? Math.max(0, activeNode.offsetTop - centerOffset)
            : this.scrollArea?.scrollTop || 0;

        nodes.forEach((node, idx) => {
            const distance = Math.abs(idx - nextIndex);
            const isActive = idx === nextIndex && nextIndex >= 0;
            node.classList.toggle("active", isActive);

            const blur = isActive ? 0 : Math.min(3.5, distance * 0.6);
            const opacity = isActive ? 1 : Math.max(0.35, 1 - distance * 0.14);
            const scale = isActive ? 1.12 : Math.max(0.94, 1 - distance * 0.025);
            const translate =
                nextIndex < 0
                    ? 0
                    : Math.min(distance * 4, 14) * (idx < nextIndex ? -1 : 1);

            // Rubber-band: lines below lag slightly longer than above.
            const duration = isActive ? 0.25 : idx > nextIndex ? 0.5 : 0.32;
            const easing = idx > nextIndex
                ? "cubic-bezier(0.16, 0.8, 0.2, 1.1)"
                : "cubic-bezier(0.2, 0.6, 0.35, 1)";
            node.style.transitionDuration = `${duration}s`;
            node.style.transitionTimingFunction = easing;

            node.style.setProperty("--lyr-blur", `${blur}px`);
            node.style.setProperty("--lyr-opacity", `${opacity}`);
            node.style.setProperty("--lyr-scale", `${scale}`);
            node.style.setProperty("--lyr-translate", `${translate}px`);
        });

        if (activeNode && this.scrollArea) {
            this.isAutoScrolling = true;
            this.scrollArea.dataset.autoScroll = "true";
            this.scrollArea.scrollTo({ top: desiredOffset, behavior: "smooth" });
            window.setTimeout(() => {
                this.isAutoScrolling = false;
                this.scrollArea?.removeAttribute("data-auto-scroll");
            }, 480);
        } else if (this.scrollArea) {
            this.scrollArea.removeAttribute("data-auto-scroll");
        }

        this.activeIndex = nextIndex;
    }

    private static normalizeLines(raw: any): LyricLine[] {
        if (!raw || !Array.isArray(raw)) return [];
        return raw
            .map((line) => {
                const text = `${line?.words ?? line?.text ?? line?.lyrics ?? ""}`.trim();
                if (!text) return null;
                const timeValue =
                    line?.startTimeMs ?? line?.startTime ?? line?.time ?? line?.t ?? line?.offset ?? null;
                const parsed =
                    typeof timeValue === "string"
                        ? Number.parseInt(timeValue, 10)
                        : typeof timeValue === "number"
                            ? timeValue
                            : null;
                return { text, time: Number.isFinite(parsed ?? NaN) ? parsed! : null };
            })
            .filter(Boolean) as LyricLine[];
    }

    private static handleScroll = () => {
        if (this.isAutoScrolling) return;
        this.scrollArea?.removeAttribute("data-auto-scroll");
    };
}
