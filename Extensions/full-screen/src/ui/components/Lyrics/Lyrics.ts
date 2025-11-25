import { DOM } from "../../elements";
import CFM from "../../../utils/config";

type LyricLine = { time: number | null; text: string };
type LyricSource = "spotify" | "lyrics-plus" | null;

export class Lyrics {
    private static container: HTMLElement | null = null;
    private static lines: LyricLine[] = [];
    private static activeIndex = -1;
    private static syncTimer: NodeJS.Timeout | null = null;
    private static currentTrack: string | null = null;
    private static source: LyricSource = null;

    static attach(container: HTMLElement) {
        this.container = container;
    }

    static teardown() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        this.lines = [];
        this.activeIndex = -1;
        this.currentTrack = null;
        this.source = null;
        this.container = null;
    }

    static toggleLyrics() {
        DOM.container.classList.toggle("lyrics-hide-force");
    }

    static handleLyricsUpdate(evt: any) {
        const detail = evt?.detail ?? {};
        if (detail.isLoading) {
            this.setLoading();
            return;
        }

        const lines = this.normalizeLines(detail.synced || detail.lines || detail.lyrics);
        const isAvailable = detail.available ?? lines.length > 0;

        if (!isAvailable || !lines.length) {
            // If Spotify already filled lyrics, keep them; otherwise mark unavailable.
            if (this.source !== "spotify") {
                this.setUnavailable();
            }
            return;
        }

        this.applyLines(lines, "lyrics-plus", detail.trackUri || detail.uri);
    }

    static async loadLyrics(trackUri?: string) {
        if (!CFM.get("lyricsDisplay")) return;
        this.currentTrack = trackUri || null;

        if (!trackUri) {
            this.setUnavailable();
            return;
        }

        this.setLoading();
        await this.fetchFromSpotify(trackUri);
    }

    private static setLoading(message = "Loading lyrics…") {
        if (!this.container) return;
        DOM.container.classList.remove("lyrics-unavailable");
        this.stopSync();
        this.container.innerHTML = `<div class="lyrics-wrapper"><div class="lyrics-status">${message}</div></div>`;
    }

    private static setUnavailable(message = "Lyrics unavailable") {
        if (!this.container) return;
        this.stopSync();
        DOM.container.classList.add("lyrics-unavailable");
        this.container.innerHTML = `<div class="lyrics-wrapper"><div class="lyrics-status">${message}</div></div>`;
    }

    private static stopSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    private static normalizeLines(raw: any): LyricLine[] {
        if (!raw || !Array.isArray(raw)) return [];

        return raw
            .map((line) => {
                const text = `${line?.words ?? line?.text ?? line?.lyrics ?? ""}`.trim();
                if (!text) return null;

                const timeValue = line?.startTimeMs ?? line?.startTime ?? line?.time ?? line?.t ?? line?.offset;
                const parsed =
                    typeof timeValue === "string"
                        ? Number.parseInt(timeValue, 10)
                        : typeof timeValue === "number"
                            ? timeValue
                            : NaN;

                return { text, time: Number.isFinite(parsed) ? parsed : null };
            })
            .filter(Boolean) as LyricLine[];
    }

    private static async fetchFromSpotify(trackUri: string) {
        const trackId = trackUri?.split(":").pop();
        if (!trackId) {
            this.setUnavailable();
            return;
        }

        try {
            const response = await Spicetify.CosmosAsync.get(
                `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`,
            );
            const lines = this.normalizeLines(response?.lyrics?.lines);

            if (!lines.length) {
                this.setUnavailable();
                return;
            }

            this.applyLines(lines, "spotify", trackUri);
        } catch (err) {
            this.setUnavailable();
        }
    }

    private static applyLines(lines: LyricLine[], source: Exclude<LyricSource, null>, trackUri?: string) {
        const currentUri = Spicetify.Player.data?.item?.uri;
        if (trackUri && currentUri && trackUri !== currentUri) return;

        if (trackUri) {
            this.currentTrack = trackUri;
        }
        this.source = source;
        this.lines = lines;
        this.activeIndex = -1;
        DOM.container.classList.remove("lyrics-unavailable");

        this.renderLines();
        this.startSync();
    }

    private static renderLines() {
        if (!this.container) return;

        const hasLines = this.lines.length > 0;
        const content = hasLines
            ? `<div class="lyrics-scroll">${this.lines
                .map(
                    (line, index) =>
                        `<div class="lyrics-line${index === this.activeIndex ? " active" : ""}" data-index="${index}" data-time="${line.time ?? ""
                        }">${line.text}</div>`,
                )
                .join("")}</div>`
            : `<div class="lyrics-status">Lyrics unavailable</div>`;

        this.container.innerHTML = `<div class="lyrics-wrapper">${content}</div>`;
        this.syncActiveLine();
    }

    private static startSync() {
        this.stopSync();
        if (!this.lines.some((line) => line.time !== null)) return;

        this.syncTimer = setInterval(() => this.syncActiveLine(), 250);
        this.syncActiveLine();
    }

    private static syncActiveLine() {
        if (!this.container || !this.lines.length) return;

        const progress = Spicetify.Player?.getProgress?.() ?? 0;
        let nextIndex = -1;

        for (let i = 0; i < this.lines.length; i++) {
            const lineTime = this.lines[i].time;
            if (lineTime === null) {
                nextIndex = i;
                break;
            }
            if (progress + 200 >= lineTime) {
                nextIndex = i;
            } else {
                break;
            }
        }

        if (nextIndex === -1 && this.lines.length > 0) {
            nextIndex = 0;
        }

        if (nextIndex === this.activeIndex) return;

        const lines = Array.from(this.container.querySelectorAll<HTMLElement>(".lyrics-line"));
        lines[this.activeIndex]?.classList.remove("active");
        lines[nextIndex]?.classList.add("active");
        lines[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });

        this.activeIndex = nextIndex;
    }
}
