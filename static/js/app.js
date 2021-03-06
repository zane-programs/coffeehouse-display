'use strict';

window.togglePause = () => console.log("Player still loading");

(window => {
    const socket = io("/display");

    let readyForSocketInteraction = false; // Is the document ready for interaction via socket?

    // player config
    const PLAYER_CONFIG = {
        'version': 3,
        // 'playlist': 'kfchvCyHmsc',
        'controls': 1,
        'autohide': 1,
        'showinfo': 1,
        'rel': 0,
        'autoplay': 1,
        //'loop': 1,
        'modestbranding': 1,
        'start': 0,
        'iv_load_policy': 3
    };

    // fullscreen init
    const FULLSCREEN_BUTTON_TEXT = {
        "false": "fullscreen", // NOT in fullscreen
        "true": "fullscreen_exit" // IN fullscreen
    };

    const enterFullScreen = () => {
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullScreen) {
                document.documentElement.webkitRequestFullScreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const exitFullScreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    // are we in fullscreen?
    const isInFullScreen = () => {
        let fullScreenState = (document.fullscreenElement && document.fullscreenElement !== null) ||
            (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
            (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
            (document.msFullscreenElement && document.msFullscreenElement !== null);

        return fullScreenState;
    };
    window.isInFullScreen = isInFullScreen;

    const toggleFullScreen = () => {
        let fullScreenActive = isInFullScreen();
        fullScreenActive ? exitFullScreen() : enterFullScreen();
        document.querySelector("div.fullscreen-btn i").innerText = FULLSCREEN_BUTTON_TEXT[JSON.stringify(!fullScreenActive)];
    };

    const updateVwVh = () => {
        let width = window.innerWidth;
        let height = window.innerHeight;

        document.querySelector("style#vwvhFix").innerHTML = `:root { --vw: ${width / 100}px; --vh: ${height / 100}px; }`;
    };

    const pageContentLoaded = async () => {
        updateVwVh();
        window.addEventListener('resize', updateVwVh);

        // Replace the 'ytplayer' element with an <iframe> and
        // YouTube player after the API code downloads.
    };

    // MOUSE MOVING TIMER
    // let debugIterations = 0;
    let timer = 0;
    let mouseHidden = false;
    const mouseCheckLoop = () => {
        // debugIterations++;
        timer++;
        // console.log(`TIMER at ${timer}, ${debugIterations} interval iterations`);
        if (timer >= 3) {
            mouseHidden = true;
            document.body.classList.add("mouse-hidden");
            clearInterval(mouseCheckInterval);
        }
    }

    let mouseCheckInterval = setInterval(mouseCheckLoop, 1000);

    const handleMouseMove = event => {
        timer = 0;
        clearInterval(mouseCheckInterval);
        document.body.classList.remove("mouse-hidden");
        mouseCheckInterval = setInterval(mouseCheckLoop, 1000);
        // console.log(event);
    };

    // Load the IFrame Player API code asynchronously.
    let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/player_api";
    let firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    socket.on("display-config", config => {
        // INIT HEADING
        let mainHeading = document.querySelector("h1.main-heading");
        mainHeading.classList.add(...config.position);
        mainHeading.innerText = config.headingText;
        mainHeading.classList.remove("heading-hidden"); // unhide heading after loading it

        document.querySelector("h1.main-heading").style.color = `rgb(${config.headingColor[0]}, ${config.headingColor[1]}, ${config.headingColor[2]})`;

        // PLAYER INIT
        let player;
        const onYouTubePlayerAPIReady = () => {
            player = new YT.Player('video-container', {
                height: '100%',
                width: '100%',
                videoId: config.youtubeId,
                host: 'https://www.youtube-nocookie.com',
                playerVars: PLAYER_CONFIG,
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
            // window.togglePause = togglePause;
            window.player = player; // dev
        };

        const togglePause = () => {
            try {
                console.log(typeof givenPlayerState);
                let playerState = player.getPlayerState();
                if (playerState === 1) {
                    player.pauseVideo();
                } else if (playerState === 2) {
                    player.playVideo();
                }
            } catch (e) {
                console.error(e);
            }
        };

        // player functions
        const onPlayerReady = (e) => {
            player.seekTo(0);
            player.mute();
            document.querySelector("iframe#video-container").setAttribute("allowfullscreen", "0");

            readyForSocketInteraction = true;
        };
        const onPlayerStateChange = (e) => {
            if (e.data === YT.PlayerState.ENDED) {
                player.playVideo();
            }
        };

        window.togglePause = togglePause;
        window.onYouTubePlayerAPIReady = onYouTubePlayerAPIReady;

        socket.emit("player-state", {playing: true});
    });

    socket.on("display-update-config", configData => {
        let configKeys = Object.keys(configData);
        for (let i = 0; i < configKeys.length; i++) {
            let key = configKeys[i];
            if (key === "youtubeId") {
                try {
                    player.loadVideoById(configData[key]);
                } catch (e) {
                    console.error(e);
                }
            } else if (key === "headingText") {
                document.querySelector("h1.main-heading").innerText = configData[key];
            } else if (key === "position") {
                document.querySelector("h1.main-heading").classList.remove("centered", "bottom", "left", "right");
                document.querySelector("h1.main-heading").classList.add(...configData[key]); // spread operator ... (apply array values as arguments)
            } else if (key === "playing") {
                let shouldPlay = configData[key];
                try {
                    shouldPlay ? player.playVideo() : player.pauseVideo();
                } catch (e) {
                    console.error(e);
                }
            } else if (key === "headingColor") {
                let color = configData[key];
                document.querySelector("h1.main-heading").style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            }
        }
    });

    document.addEventListener('DOMContentLoaded', pageContentLoaded);
    document.querySelector('div.fullscreen-btn').addEventListener('click', toggleFullScreen);
    window.addEventListener("mousemove", handleMouseMove);
})(window);