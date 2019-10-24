(window => {
    const socket = io("/admin");
    let config = {};

    // get youtube id from url
    const ytGetIdFromUrl = (url) => {
        // EXAMPLE URL: https://www.youtube.com/watch?v=ZY3J3Y_OU0wv
        // thanks to https://stackoverflow.com/a/8260383, failed at writing my own regex
        let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        let match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    };

    const updateYoutubeId = () => socket.emit("display-update-config", { youtubeId: document.querySelector("#youtubeId").value });

    document.querySelector("#youtubeIdBtn").addEventListener("click", () => {
        let youtubeUrlInput = prompt("Enter YouTube URL to get YouTube ID:");
        let youtubeIdGotten = ytGetIdFromUrl(youtubeUrlInput);
        if (youtubeIdGotten === false) {
            alert("Invalid YouTube URL, sorry!");
        } else {
            document.querySelector("#youtubeId").value = youtubeIdGotten;
            updateYoutubeId();
        }
    });

    socket.on("display-config", config => {
        document.querySelector("#headingText").value = config.headingText;
        document.querySelector("#position").value = config.position.join(" ");
        document.querySelector("#youtubeId").value = config.youtubeId;
        document.getElementById("colorPicker").jscolor.fromRGB(config.headingColor[0], config.headingColor[1], config.headingColor[2]);
    });

    document.querySelector("#headingText").addEventListener("keyup", e => {
        socket.emit("display-update-config", { headingText: document.querySelector("#headingText").value });
    });

    document.querySelector("#position").addEventListener("change", () => {
        socket.emit("display-update-config", { position: document.querySelector("#position").value.split(" ") });
    });

    document.querySelector("#youtubeId").addEventListener("change", updateYoutubeId);

    const updateColor = picker => {
        socket.emit("display-update-config", { headingColor: picker.rgb });
    };

    window.updateColor = updateColor;
})(window);