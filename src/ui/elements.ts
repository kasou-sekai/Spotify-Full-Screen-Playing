export class DOM {
    static container: HTMLDivElement;
    static style: HTMLStyleElement;
    static cover: HTMLElement;
    static back: HTMLCanvasElement;
    static title: HTMLElement;
    static artist: HTMLElement;
    static album: HTMLElement;
    static play: HTMLElement;
    static ctx_container: HTMLElement;
    static ctx_icon: HTMLElement;
    static ctx_source: HTMLElement;
    static ctx_name: HTMLElement;
    static fsd_myUp: HTMLElement;
    static fsd_nextCover: HTMLElement;
    static fsd_up_next_text: HTMLElement;
    static fsd_next_tit_art: HTMLElement;
    static fsd_next_tit_art_inner: HTMLElement;
    static fsd_first_span: HTMLElement;
    static fsd_second_span: HTMLElement;
    static playingIcon: HTMLElement;
    static pausedIcon: HTMLElement;
    static nextControl: HTMLElement;
    static backControl: HTMLElement;
    static heart: HTMLElement;
    static shuffle: HTMLElement;
    static repeat: HTMLElement;
    static queue: HTMLElement | null;
    static invertButton: HTMLElement;
    static lyrics: HTMLElement;
    static coverImg = new Image();
    static backgroundImg = new Image();

    static init() {
        this.style = document.createElement("style");
        this.container = document.createElement("div");
        this.container.id = "full-screen-display";
        this.container.classList.add("Video", "VideoPlayer--fullscreen", "VideoPlayer--landscape");
    }
}
