
// TRUSTORA - Premium Surprise Experience

// 1. SUPABASE SETTINGS
const SUPABASE_URL = "https://ehnbhkhtbtzlefiutham.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ytSwB_gZWTr8nyuByq7HNA_PAd9l6Ws";

// Local backend
const BACKEND_URL = "http://localhost:3000";

// 2. PAGE ELEMENTS
const form = document.getElementById("surpriseForm");
const linkBox = document.getElementById("linkBox");
const shareLinkInput = document.getElementById("shareLink");

const photoUpload = document.getElementById("photoUpload");
const videoUpload = document.getElementById("videoUpload");

const validThemes = [
    "birthday", "anniversary", "diwali",
    "wedding", "friendship", "festival"
];

// 3. CONNECT DATABASE
let supabaseClient = null;

if (
    window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")
) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("TRUSTORA: Supabase connected!");
} else {
    console.error("TRUSTORA: Check Supabase URL, publishable key and CDN.");
}

// 4. UPLOAD SELECTED PHOTO AND VIDEO
async function uploadSelectedMedia(surpriseId) {
    const files = [];

    if (photoUpload && photoUpload.files[0]) {
        files.push(photoUpload.files[0]);
    }

    if (videoUpload && videoUpload.files[0]) {
        files.push(videoUpload.files[0]);
    }

    for (const file of files) {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4"
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error("Only JPG, PNG, WEBP and MP4 files are allowed.");
        }

        if (file.size > 20 * 1024 * 1024) {
            throw new Error("Each file must be smaller than 20 MB.");
        }

        const formData = new FormData();
        formData.append("media", file);

        const response = await fetch(
            `${BACKEND_URL}/api/upload/${surpriseId}`,
            {
                method: "POST",
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Media upload failed.");
        }
    }
}

// 5. CREATE SURPRISE
if (form) {
    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (!supabaseClient) {
            alert("Database connection nahi hai. Settings check karo.");
            return;
        }

        const sender = document.getElementById("sender").value.trim();
        const receiver = document.getElementById("receiver").value.trim();
        const theme = document.getElementById("theme").value;
        const message = document.getElementById("message").value.trim();

        if (!sender || !receiver) {
            alert("Sender aur Receiver ka naam likho.");
            return;
        }

        if (
            sender.length > 80 ||
            receiver.length > 80 ||
            message.length > 2000 ||
            !validThemes.includes(theme)
        ) {
            alert("Details check karo. Kuch galat ya bahut lamba hai.");
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');

        if (submitButton) submitButton.disabled = true;

        let surpriseId = null;

        try {
            const { data, error } = await supabaseClient.rpc(
                "create_trustora_surprise",
                {
                    p_sender: sender,
                    p_receiver: receiver,
                    p_theme: theme,
                    p_message: message
                }
            );

            if (error) throw error;

            if (
                typeof data !== "string" ||
                !/^[0-9a-f-]{36}$/i.test(data)
            ) {
                throw new Error("Invalid surprise ID.");
            }

            surpriseId = data;

            const url = new URL(window.location.href);
            url.search = "";
            url.hash = "";
            url.searchParams.set("surprise", surpriseId);

            shareLinkInput.value = url.href;
            linkBox.hidden = false;

            linkBox.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {
            console.error(error);
            alert("Surprise save nahi hua. Console check karo.");
            return;
        } finally {
            if (submitButton) submitButton.disabled = false;
        }

        // Upload media after creating the surprise
        try {
            await uploadSelectedMedia(surpriseId);
            alert("TRUSTORA surprise ready! 🎉");
        } catch (error) {
            console.error("Media upload error:", error);
            alert(
                "Surprise link ban gaya, lekin media upload nahi hua: " +
                error.message
            );
        }
    });
}

// 6. COPY LINK
const copyButton = document.getElementById("copyButton");

if (copyButton) {
    copyButton.addEventListener("click", async function() {
        try {
            await navigator.clipboard.writeText(shareLinkInput.value);
            alert("Link copied! 🎉");
        } catch (error) {
            shareLinkInput.select();
            alert("Ctrl + C dabakar link copy karo.");
        }
    });
}

// 7. WHATSAPP SHARE
const shareButton = document.getElementById("shareButton");

if (shareButton) {
    shareButton.addEventListener("click", function() {
        const text = "I created a special surprise for you! ✨ " +
            shareLinkInput.value;

        window.open(
            "https://wa.me/?text=" + encodeURIComponent(text),
            "_blank",
            "noopener,noreferrer"
        );
    });
}

// 8. OCCASION TITLES
function getOccasionTitle(theme) {
    const titles = {
        birthday: "🎂 Happy Birthday!",
        anniversary: "💍 Happy Anniversary!",
        diwali: "🪔 Happy Diwali!",
        wedding: "💒 Best Wishes!",
        friendship: "💌 Happy Friendship!",
        festival: "✨ Happy Celebrations!"
    };

    return titles[theme] || "A Special Surprise!";
}

// 9. FIREWORKS ANIMATION
function startFireworks(screen) {
    const canvas = document.createElement("canvas");

    canvas.style.cssText = `
        position:fixed;
        inset:0;
        width:100%;
        height:100%;
        pointer-events:none;
        z-index:5;
    `;

    screen.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let running = true;
    let frame = 0;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    const colors = [
        "#ffd166", "#ff6b6b", "#c77dff",
        "#4cc9f0", "#ffffff", "#f72585"
    ];

    function burst(x, y) {
        const color = colors[
            Math.floor(Math.random() * colors.length)
        ];

        for (let i = 0; i < 65; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 4.5;

            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 65 + Math.random() * 35,
                color,
                size: 1.5 + Math.random() * 2.5
            });
        }
    }

    function animate() {
        if (!running) return;

        ctx.clearRect(0, 0, width, height);
        frame++;

        if (frame % 48 === 1 && frame < 500) {
            burst(
                width * (0.15 + Math.random() * 0.7),
                height * (0.12 + Math.random() * 0.48)
            );
        }

        particles = particles.filter(p => p.life > 0);

        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.035;
            p.vx *= 0.99;
            p.vy *= 0.99;
            p.life--;

            ctx.globalAlpha = Math.max(0, p.life / 90);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        if (frame < 620 || particles.length > 0) {
            requestAnimationFrame(animate);
        } else {
            cleanup();
        }
    }

    const resizeHandler = () => resize();

    window.addEventListener("resize", resizeHandler);

    const cleanup = () => {
        if (!running) return;

        running = false;
        window.removeEventListener("resize", resizeHandler);
        canvas.remove();
    };

    screen.addEventListener("click", cleanup, { once: true });

    animate();
}

// 10. CONFETTI
function startConfetti(screen) {
    const layer = document.createElement("div");

    layer.style.cssText = `
        position:fixed;
        inset:0;
        overflow:hidden;
        pointer-events:none;
        z-index:6;
    `;

    for (let i = 0; i < 75; i++) {
        const piece = document.createElement("span");

        piece.textContent = ["✦", "✧", "•", "✨"][i % 4];

        piece.style.cssText = `
            position:absolute;
            left:${Math.random() * 100}%;
            top:-30px;
            font-size:${12 + Math.random() * 17}px;
            color:${["#ffd166", "#ff6b6b", "#c77dff", "#4cc9f0"][i % 4]};
            animation:trustoraFall ${3 + Math.random() * 4}s linear ${Math.random() * 3}s forwards;
        `;

        layer.appendChild(piece);
    }

    screen.appendChild(layer);

    if (!document.getElementById("trustora-animation-style")) {
        const style = document.createElement("style");

        style.id = "trustora-animation-style";

        style.textContent = `
            @keyframes trustoraFall {
                to {
                    transform:translateY(110vh) rotate(600deg);
                    opacity:0;
                }
            }
        `;

        document.head.appendChild(style);
    }

    setTimeout(() => layer.remove(), 8500);
}

// 11. LOAD PRIVATE MEDIA
async function loadSurpriseMedia(publicId, container) {
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/media/${publicId}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Media load failed.");
        }

        if (!Array.isArray(result.media)) return;

        for (const item of result.media) {
            const mediaElement = item.type === "video"
                ? document.createElement("video")
                : document.createElement("img");

            mediaElement.src = item.url;

            if (item.type === "video") {
                mediaElement.controls = true;
                mediaElement.playsInline = true;
                mediaElement.preload = "metadata";
            } else {
                mediaElement.alt = "TRUSTORA surprise photo";
                mediaElement.loading = "lazy";
            }

            mediaElement.style.cssText = `
                display:block;
                width:100%;
                max-width:500px;
                max-height:400px;
                object-fit:contain;
                border-radius:16px;
                margin:18px auto;
            `;

            container.appendChild(mediaElement);
        }

    } catch (error) {
        console.error("Media loading error:", error);
    }
}

// 12. DISPLAY SURPRISE
function openSurprise(data, publicId) {
    const main = document.querySelector("main");
    const navbar = document.querySelector(".navbar");

    if (main) main.hidden = true;
    if (navbar) navbar.hidden = true;

    const screen = document.createElement("section");

    screen.style.cssText = `
        min-height:100vh;
        box-sizing:border-box;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:25px;
        text-align:center;
        overflow:hidden;
        position:relative;
        background:radial-gradient(circle at center,#49301d,#09090d 75%);
    `;

    const card = document.createElement("div");

    card.style.cssText = `
        position:relative;
        z-index:2;
        max-width:650px;
        width:100%;
        padding:45px 25px;
        border:1px solid rgba(217,181,109,.6);
        border-radius:24px;
        background:rgba(19,19,27,.92);
        box-shadow:0 20px 70px rgba(0,0,0,.5);
        animation:trustoraAppear 1s ease both;
    `;

    if (!document.getElementById("trustora-card-style")) {
        const style = document.createElement("style");

        style.id = "trustora-card-style";

        style.textContent = `
            @keyframes trustoraAppear {
                from {
                    opacity:0;
                    transform:translateY(25px) scale(.96);
                }
                to {
                    opacity:1;
                    transform:translateY(0) scale(1);
                }
            }
        `;

        document.head.appendChild(style);
    }

    const icon = document.createElement("div");

    icon.textContent = data.theme === "diwali" ? "🪔" :
        data.theme === "birthday" ? "🎂" : "🎁";

    icon.style.cssText = "font-size:76px;";

    const label = document.createElement("p");

    label.textContent = "A SPECIAL SURPRISE FOR";
    label.style.cssText =
        "color:#d9b56d;letter-spacing:3px;margin:20px 0;";

    const name = document.createElement("h1");

    name.textContent = data.receiver;

    name.style.cssText = `
        font-family:Georgia,serif;
        font-size:clamp(38px,8vw,70px);
        color:#f6dda3;
        overflow-wrap:anywhere;
        margin:15px 0;
    `;

    const heading = document.createElement("h2");

    heading.textContent = getOccasionTitle(data.theme);
    heading.style.cssText = "margin:20px 0;color:#fff;font-size:25px;";

    const message = document.createElement("p");

    message.textContent = data.message ||
        "Wishing you happiness, beautiful memories and endless smiles!";

    message.style.cssText =
        "color:#e0d9e3;margin:20px auto;max-width:500px;line-height:1.8;";

    const mediaContainer = document.createElement("div");

    const sender = document.createElement("p");

    sender.textContent = "With love, " + data.sender;
    sender.style.cssText = "color:#d9b56d;margin-top:25px;";

    const button = document.createElement("button");

    button.textContent = "CREATE YOUR OWN SURPRISE ✨";
    button.className = "primary-button";
    button.style.marginTop = "30px";

    button.addEventListener("click", function() {
        window.location.href = window.location.pathname;
    });

    card.append(
        icon,
        label,
        name,
        heading,
        message,
        mediaContainer,
        sender,
        button
    );

    screen.appendChild(card);
    document.body.appendChild(screen);

    startFireworks(screen);
    startConfetti(screen);

    loadSurpriseMedia(publicId, mediaContainer);
}

// 13. LOAD SURPRISE FROM DATABASE
async function loadSurprise(publicId) {
    if (!supabaseClient) {
        alert("Database connection unavailable.");
        return;
    }

    if (!/^[0-9a-f-]{36}$/i.test(publicId)) {
        alert("Invalid surprise link.");
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc(
            "get_trustora_surprise",
            { p_public_id: publicId }
        );

        if (error) throw error;

        if (!data || data.length === 0) {
            alert("Surprise nahi mila. Link check karo.");
            return;
        }

        const surprise = data[0];

        if (
            typeof surprise.sender !== "string" ||
            typeof surprise.receiver !== "string" ||
            !validThemes.includes(surprise.theme)
        ) {
            throw new Error("Invalid surprise data.");
        }

        openSurprise({
            sender: surprise.sender,
            receiver: surprise.receiver,
            theme: surprise.theme,
            message: surprise.message || ""
        }, publicId);

        console.log("TRUSTORA: Surprise loaded!");

    } catch (error) {
        console.error("TRUSTORA loading error:", error);
        alert("Surprise load nahi hua. Please try again.");
    }
}

// 14. CHECK URL
const params = new URLSearchParams(window.location.search);
const surpriseId = params.get("surprise");

if (surpriseId) {
    loadSurprise(surpriseId);
}
