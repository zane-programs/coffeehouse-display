(window => {
    const socket = io("/admin");
    let config = {};

    socket.on("display-config", config => {
        document.querySelector("#headingText").value = config.headingText;
        document.querySelector("#position").value = config.position.join(" ");
    });

    document.querySelector("#headingText").addEventListener("keyup", e => {
        socket.emit("display-update-config", { headingText: document.querySelector("#headingText").value });
    });

    document.querySelector("#position").addEventListener("change", () => {
        socket.emit("display-update-config", { position: document.querySelector("#position").value.split(" ") });
    });
})(window);